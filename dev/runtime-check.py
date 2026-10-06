#!/usr/bin/env python3
"""Run beanshow on an isolated LNbits instance and record route evidence.

Run from any directory with the runtime checkout available:
  /home/talvasconcelos/Work/lnbits_pg/.venv/bin/python bean-show/dev/runtime-check.py

The server listens on 127.0.0.1:5021 and remains up until Ctrl-C. Runtime data,
logs, and token-free evidence stay under bean-show/dev/.instance/.
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import shutil
import stat
import subprocess
import sys
import time
import zipfile
from pathlib import Path, PurePosixPath

import httpx

CORE = Path("/home/talvasconcelos/Work/lnbits_pg")
GAME = Path(__file__).resolve().parents[1]
ROOT = Path(os.environ.get("BEANSHOW_RUNTIME_DIR", GAME / "dev/.instance"))
DATA = ROOT / "data"
EXTENSIONS = DATA / "wasm_extensions"
PORT = int(os.environ.get("BEANSHOW_PORT", "5021"))
BASE = f"http://127.0.0.1:{PORT}"
USERNAME = f"beanshow{secrets.token_hex(4)}"
PASSWORD = secrets.token_urlsafe(24)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def preflight() -> tuple[dict, Path, Path | None, dict]:
    config_path = GAME / "config.json"
    wasm = GAME / "wasm/module.wasm"
    if not config_path.is_file() or not wasm.is_file():
        raise RuntimeError("Build first: config.json and wasm/module.wasm are required.")
    config = json.loads(config_path.read_text())
    if config.get("id") != "beanshow" or config.get("extension_type") != "wasm":
        raise RuntimeError("Expected a WASM extension with id 'beanshow'.")
    if not wasm.read_bytes().startswith(b"\0asm"):
        raise RuntimeError("wasm/module.wasm has no WebAssembly magic header.")
    if config.get("permissions"):
        raise RuntimeError("Harness expects beanshow to request no permissions.")
    manifest_routes = [
        route for route in config.get("api_routes", [])
        if route.get("method") == "GET"
        and route.get("path") == "/manifest"
        and route.get("export") == "show-manifest"
        and route.get("auth") == "public"
    ]
    if len(manifest_routes) != 1:
        raise RuntimeError("Expected public GET /manifest -> show-manifest.")
    expected_ui = {"/beanshow/play": "public", "/beanshow": "user"}
    actual_ui = {route.get("path"): route.get("auth") for route in config.get("ui_routes", [])}
    if any(actual_ui.get(path) != auth for path, auth in expected_ui.items()):
        raise RuntimeError("Expected public /beanshow/play and authenticated /beanshow UI routes.")
    archive = GAME / "dist" / f"beanshow-{config['version']}.zip"
    archive_info = {
        "installSource": "source_symlink",
        "installedComponentSha256": sha256(wasm),
    }
    if archive.is_file():
        with zipfile.ZipFile(archive) as zf:
            names = [item.filename for item in zf.infolist() if item.filename]
            roots = {PurePosixPath(name).parts[0] for name in names if PurePosixPath(name).parts}
            if len(roots) != 1:
                raise RuntimeError("Release ZIP must contain exactly one top-level directory.")
            root = next(iter(roots))
            config_name = f"{root}/config.json"
            module_name = f"{root}/wasm/module.wasm"
            if config_name not in names or module_name not in names:
                raise RuntimeError("Release ZIP lacks the runtime config or configured component.")
            for item in zf.infolist():
                path = PurePosixPath(item.filename)
                mode = item.external_attr >> 16
                if path.is_absolute() or ".." in path.parts or path.parts[0] != root:
                    raise RuntimeError(f"Unsafe ZIP path: {item.filename}")
                if stat.S_ISLNK(mode):
                    raise RuntimeError(f"ZIP symlink is not allowed: {item.filename}")
                if path.suffix.lower() in {".py", ".pyc", ".pyo", ".so", ".pyd"}:
                    raise RuntimeError(f"Forbidden runtime archive file: {item.filename}")
            zipped_config = json.loads(zf.read(config_name))
            zipped_wasm = zf.read(module_name)
            if zipped_config.get("id") != "beanshow" or zipped_config != config:
                raise RuntimeError("Release ZIP config differs from the source config.")
            if hashlib.sha256(zipped_wasm).hexdigest() != sha256(wasm):
                raise RuntimeError("Release ZIP component differs from wasm/module.wasm.")
        archive_info = {
            "installSource": "release_zip",
            "archivePath": str(archive),
            "archiveSha256": sha256(archive),
            "installedComponentSha256": hashlib.sha256(zipped_wasm).hexdigest(),
        }
    return config, wasm, archive if archive.is_file() else None, archive_info


def runtime_commit() -> str:
    return subprocess.check_output(
        ["git", "-C", str(CORE), "rev-parse", "HEAD"], text=True
    ).strip()


def setup(archive: Path | None, reset: bool = True) -> None:
    if reset:
        shutil.rmtree(ROOT, ignore_errors=True)
    EXTENSIONS.mkdir(parents=True, exist_ok=True)
    installed = EXTENSIONS / "beanshow"
    if installed.is_symlink():
        installed.unlink()
    elif installed.exists():
        shutil.rmtree(installed)
    if archive:
        with zipfile.ZipFile(archive) as zf:
            root = next(iter({PurePosixPath(n).parts[0] for n in zf.namelist() if PurePosixPath(n).parts}))
            for item in zf.infolist():
                relative = PurePosixPath(item.filename).relative_to(root)
                target = installed.joinpath(*relative.parts)
                if item.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(zf.read(item))
    else:
        # Before a release ZIP exists, load the exact build tree by symlink.
        installed.symlink_to(GAME, target_is_directory=True)
    (ROOT / "python_extensions/extensions").mkdir(parents=True, exist_ok=True)


def server_env() -> dict[str, str]:
    env = os.environ.copy()
    env.update({
        "PYTHONPATH": str(CORE),
        "HOST": "127.0.0.1",
        "PORT": str(PORT),
        "LNBITS_DATA_FOLDER": str(DATA),
        "LNBITS_WASM_EXTENSIONS_PATH": str(EXTENSIONS),
        "LNBITS_EXTENSIONS_PATH": str(ROOT / "python_extensions"),
        "LNBITS_DATABASE_URL": "",
        "LNBITS_EXTENSIONS_DEFAULT_INSTALL": "[]",
        "LNBITS_EXTENSIONS_DEACTIVATE_ALL": "false",
        "LNBITS_ADMIN_UI": "true",
        "LNBITS_BACKEND_WALLET_CLASS": "FakeWallet",
        "LNBITS_ALLOWED_FUNDING_SOURCES": '["FakeWallet"]',
        "LNBITS_AUTH_SECRET_KEY": "isolated-beanshow-runtime-check",
        "AUTH_SECRET_KEY": "isolated-beanshow-runtime-check",
        "FIRST_INSTALL_TOKEN": "",
        "AUTH_HTTPS_ONLY": "false",
        "DEBUG": "false",
        "NO_PROXY": "127.0.0.1,localhost",
        "no_proxy": "127.0.0.1,localhost",
    })
    return env


def wait_ready(process: subprocess.Popen, log_path: Path) -> None:
    with httpx.Client(trust_env=False, timeout=2) as client:
        deadline = time.monotonic() + 75
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError(f"LNbits exited during startup; inspect {log_path}")
            try:
                client.get(f"{BASE}/api/v1/auth")
                return
            except httpx.HTTPError:
                time.sleep(0.25)
    raise RuntimeError(f"LNbits did not start; inspect {log_path}")


def main() -> int:
    config, wasm, archive, archive_info = preflight()
    setup(archive, reset="--serve" not in sys.argv)
    log_path = ROOT / f"lnbits-{PORT}.log"
    with log_path.open("w") as log_file:
        def start_server() -> subprocess.Popen:
            return subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "lnbits.__main__:app", "--host",
                 "127.0.0.1", "--port", str(PORT), "--workers", "1"],
                cwd=CORE, env=server_env(), stdout=log_file, stderr=subprocess.STDOUT,
            )

        def stop_server(current: subprocess.Popen) -> None:
            current.terminate()
            try:
                current.wait(timeout=15)
            except subprocess.TimeoutExpired:
                current.kill()

        process = start_server()
        evidence = None
        try:
            wait_ready(process, log_path)
            if "--serve" in sys.argv:
                print(f"READY; existing test instance: {BASE}/ext/beanshow/play", flush=True)
                while process.poll() is None:
                    time.sleep(1)
                raise RuntimeError(f"LNbits exited; inspect {log_path}")
            evidence = {
                "base": BASE,
                "extension": config["id"],
                "version": config["version"],
                "runtimeCommit": runtime_commit(),
                "componentSha256": sha256(wasm),
                **archive_info,
                "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "routes": {},
                "tokenStored": False,
                "log": str(log_path),
                "result": "running",
            }
            evidence_path = ROOT / "evidence.json"

            def save_evidence() -> None:
                evidence_path.write_text(json.dumps(evidence, indent=2) + "\n")

            with httpx.Client(trust_env=False, timeout=45, follow_redirects=False) as client:
                first = client.put(
                    f"{BASE}/api/v1/auth/first_install",
                    json={"username": USERNAME, "password": PASSWORD,
                          "password_repeat": PASSWORD},
                )
                first.raise_for_status()
                token = first.json()["access_token"]
                client.headers["Authorization"] = f"Bearer {token}"
                enabled = client.put(f"{BASE}/api/v1/extension/beanshow/enable")
                enabled.raise_for_status()

                def capture(name: str, response: httpx.Response) -> None:
                    evidence["routes"][name] = {
                        "status": response.status_code,
                        "contentType": response.headers.get("content-type", ""),
                        "location": response.headers.get("location"),
                    }
                    save_evidence()

                anon = httpx.Client(trust_env=False, timeout=45, follow_redirects=False)

                public_manifest = anon.get(f"{BASE}/api/v1/ext/beanshow/manifest")
                capture("publicManifest", public_manifest)
                if public_manifest.status_code != 200:
                    raise RuntimeError(f"public manifest route returned {public_manifest.status_code}")
                try:
                    envelope = public_manifest.json()
                except ValueError as exc:
                    raise RuntimeError("manifest response was not JSON") from exc
                if not isinstance(envelope, dict) or envelope.get("ok") is not True:
                    raise RuntimeError("manifest export did not return an ok envelope")
                evidence["manifestResponse"] = envelope

                public_page = anon.get(f"{BASE}/ext/beanshow/play")
                capture("publicPage", public_page)
                if public_page.status_code != 200:
                    raise RuntimeError(f"public page returned {public_page.status_code}")
                signed_out_page = anon.get(f"{BASE}/ext/beanshow")
                capture("authenticatedPageSignedOut", signed_out_page)
                if signed_out_page.status_code not in {401, 403, 302, 303, 307, 308}:
                    raise RuntimeError("authenticated page unexpectedly served to signed-out client")
                private_page = client.get(f"{BASE}/ext/beanshow")
                capture("authenticatedPageWithToken", private_page)
                if private_page.status_code != 200:
                    raise RuntimeError(f"authenticated page with token returned {private_page.status_code}")

                auth_frame = client.post(
                    f"{BASE}/api/v1/ext/beanshow/_ui/frame",
                    json={"path": "/ext/beanshow"},
                )
                capture("authenticatedFrameConfig", auth_frame)
                if auth_frame.status_code != 200:
                    raise RuntimeError(f"authenticated frame config returned {auth_frame.status_code}")

                bad_array = client.post(
                    f"{BASE}/api/v1/ext/beanshow/_ui/frame",
                    content=b"[]", headers={"Content-Type": "application/json"},
                )
                capture("arrayBodyRejected", bad_array)
                if bad_array.status_code != 400:
                    raise RuntimeError(f"array request expected HTTP 400, got {bad_array.status_code}")
                anon.close()

            evidence["restartDataFolder"] = str(DATA)
            evidence["result"] = "passed"
            save_evidence()
            stop_server(process)
            process = start_server()
            wait_ready(process, log_path)
            with httpx.Client(trust_env=False, timeout=45, follow_redirects=False) as after:
                login = after.post(
                    f"{BASE}/api/v1/auth",
                    json={"username": USERNAME, "password": PASSWORD},
                )
                login.raise_for_status()
                after.headers["Authorization"] = f"Bearer {login.json()['access_token']}"
                restarted_manifest = httpx.get(
                    f"{BASE}/api/v1/ext/beanshow/manifest",
                    timeout=45, trust_env=False,
                )
                capture("manifestAfterRestartSignedOut", restarted_manifest)
                if restarted_manifest.status_code != 200:
                    raise RuntimeError("public manifest failed after same-data restart")
                restarted_page = after.get(f"{BASE}/ext/beanshow")
                capture("authenticatedPageAfterRestart", restarted_page)
                if restarted_page.status_code != 200:
                    raise RuntimeError("authenticated page failed after same-data restart")
            evidence_path.write_text(json.dumps(evidence, indent=2) + "\n")
            print(json.dumps(evidence, indent=2), flush=True)
            print(f"READY; server stays up. Evidence: {evidence_path}", flush=True)
            if os.environ.get("BEANSHOW_BROWSER_CHECK"):
                browser_env = os.environ.copy()
                browser_env.update({"BEANSHOW_AUTH_TOKEN": token, "BEANSHOW_BASE": f"{BASE}/ext/beanshow/play?test=1"})
                subprocess.run(["node", str(GAME / "dev/browser-check.mjs")], env=browser_env, check=True)
            while True:
                if process.poll() is not None:
                    raise RuntimeError(f"LNbits exited; inspect {log_path}")
                time.sleep(1)
        except Exception as exc:
            if evidence is not None:
                evidence["result"] = "failed"
                evidence["error"] = f"{type(exc).__name__}: {exc}"
                evidence_path.write_text(json.dumps(evidence, indent=2) + "\n")
            raise
        finally:
            stop_server(process)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
