# Verification — Bean Show 0.1.0 — 2026-10-06

Target LNbits: `e13d3e120c928e1db925cc6b5a983eff897f00bd`,
`v1.6.2-rc1-24-ge13d3e120-dirty`. Runtime source was read, not edited.
The requested symlink was added at
`/home/talvasconcelos/Work/lnbits_pg/data/wasm_extensions/beanshow` →
`/home/talvasconcelos/Work/wasm_games/bean-show`.

## What passed

- `npm run build`: pinned Three.js 0.180.0, esbuild 0.25.10 and jco 1.15.4;
  valid component loaded and invoked by this LNbits runtime.
- `npm test`: **256 independent round runs**, eight seeds × two difficulties ×
  sixteen rounds; all finished through actual finish/survival/crown rules, with
  **zero deadline tiebreaks**. Also **12 complete five-round shows** reached a
  single winner. This includes the corrected safe spawns for Roll Out and
  Perfect Match. Seeded replay, finite coordinates, unique qualifiers, movement,
  jump/dive/friction, idle-player elimination, manifest input rejection and
  crown-grab requirements pass.
- Isolated installation from the release ZIP on **port 5021**, then restart on
  the same database. Public manifest and signed-out page: 200; signed-out
  private page: 401; authenticated page and private frame configuration: 200;
  array frame request: 400; manifest and authenticated page after restart: 200.
- Archived, source and installed component hashes match. Every installed runtime
  file also matches its ZIP bytes. No permissions, host calls, wallets or storage
  migrations are requested. No SQLite/PostgreSQL domain-storage test is needed.
- Chromium under the real opaque LNbits iframe/CSP: name and colour selection,
  join, 60-slot lobby, ready, briefing, countdown, W movement, D moving right on
  screen, short Space jump, Shift dive, E crown grab, pause/resume, sound toggle,
  course-browser close, practice replay reset and rendered Continue navigation.
- Another five-round browser show completed, with the player driven by the bot
  policy. It is not a manual human completion.
- 390 × 844 touch emulation: joystick movement plus jump, dive and grab passed.
  Desktop and mobile layouts were inspected. The final browser run reported
  **zero page/CSP/console errors**.
- Screenshots of **all 16 course layouts** were captured and visually reviewed,
  plus the menu, joined lobby, mobile play and visible crown ceremony. Course
  captures use paused aerial practice previews; changed course spawns/hints
  were recaptured. The montage is `all-courses.jpg`.

## Exact artifacts

- Component SHA256:
  `7f7febd83defd12d7b68788dd87be9ba6b3d7f87098e0622d9c45a4fc98828ff`
- ZIP SHA256:
  `13bcb41ac92fc460004600678c0acdf67ddc087ec2ff7a9386372d8f263ff26e`
- Release: `dist/beanshow-0.1.0.zip`, one `beanshow/` root, nine runtime/license
  files, no Python, dependencies, test databases, credentials or symlinks.

Evidence: `bot-results.json`, `browser-results.json`, `runtime-results.json`,
`artifact.json`, `package.json` and the level PNGs.

## What only bots / automation tested

All completed full shows and every complete-course simulation used bot input
for the human slot. The keyboard crown test starts the bean near the crown;
it does not prove a person completed Fall Mountain. Actual rendered keyboard
and emulated touch input were exercised, but **no person has playtested a full
show**. Human movement feel, casual-player win rate, audio listening, physical
phones, Safari/Firefox, controller support and GPU performance are unverified.
Easy is the default and gives a speed advantage and more error-prone rivals;
this is tuning, not a measured casual-player success guarantee.

## Still missing / simplified

These are compact round adaptations, not faithful recreations of every map.
Detailed per-round differences are in README.md. In particular, Slime Climb is
straight, Fall Mountain is flat, Roll Out uses flat conveyor strips, Hex-A-Gone
has three layers, Hit Parade lacks turnstile/push-wall stages, and collisions
are simple capsules/boxes rather than full rigid-body ragdolls. Tip Toe bots
know the hidden route; Perfect Match bots read the fruit state. Their mistakes
are execution/random-route mistakes, not a full model of human perception.

No real multiplayer, matchmaking/room service, saved progression, team or tail
rounds, paid entry, invoices, refunds, escrow, prizes, anti-cheat or trusted
server game simulation exists. Browser results must never authorize money.
The pure fixed-step simulation is separated from input/rendering for a future
trusted server port; that port and payment integration remain separate work.

The existing **port 5000 server returns 404 for Bean Show until it discovers the
new extension on restart**. It was not restarted or otherwise modified. The
verified isolated server at `http://127.0.0.1:5021/ext/beanshow/play` is available
now. After restarting your main LNbits, enable Bean Show from Extensions and
use `/ext/beanshow/play`. No marketplace/public-download installation was tested.
