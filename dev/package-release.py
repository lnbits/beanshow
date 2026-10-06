"""Package exact runtime files beneath one safe extension root."""
import hashlib,json,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
config=json.loads((root/'config.json').read_text());out=root/'dist';out.mkdir(exist_ok=True)
archive=out/f"beanshow-{config['version']}.zip"
files=[root/'config.json',root/'manifest.json',root/'THREE-LICENSE.txt']+[p for name in ['ui','static','wasm'] for p in (root/name).rglob('*') if p.is_file()]
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in files:
  assert not p.is_symlink()
  z.write(p,Path('beanshow')/p.relative_to(root))
with zipfile.ZipFile(archive) as z:
 actual=hashlib.sha256(z.read('beanshow/wasm/module.wasm')).hexdigest()
 assert actual==hashlib.sha256((root/'wasm/module.wasm').read_bytes()).hexdigest()
 evidence={'archive':str(archive),'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'componentSha256':actual,'files':len(files)}
(root/'evidence/package.json').write_text(json.dumps(evidence,indent=2)+'\n')
print(json.dumps(evidence))
