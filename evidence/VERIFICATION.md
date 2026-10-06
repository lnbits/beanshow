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
  `73b3ec962b003d23802237f0f62068acf6b38b51dd6483ec3ab2fc9d0ad07578`
- ZIP SHA256:
  `94fa4f9fb4b55eb845b98f64c66e14ea5e0e8f70bdffaaa917bb0705efe37883`
- Release: `dist/beanshow-0.1.0.zip`, one `beanshow/` root, twelve runtime/license/discovery
  files, no Python, dependencies, test databases, credentials or symlinks.

Evidence: `bot-results.json`, `browser-results.json`, `runtime-results.json`,
`artifact.json`, `package.json` and the level PNGs.

## What only bots / automation tested

All completed full shows and every complete-course simulation used bot input
for the human slot. The keyboard crown test starts the bean near the crown;
it does not prove a person completed Fall Mountain. Actual rendered keyboard
and emulated touch input were exercised. The user supplied positive play
feedback, but **I have not observed a human complete a full show**. Casual-player
win rate, audio listening, physical
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

## Owner page and graphics follow-up

`/ext/beanshow` now serves a separate authenticated owner page, with Open Game
and the public player link. Owner navigation and the Copy button's selected-text
fallback were exercised; system clipboard permission was not granted by the
sandbox. No paid-game creation controls or backend were added.

Native fullscreen was verified to fill the parent browser viewport and hide
LNbits header, footer and drawer. The runtime has no per-extension chrome/layout
setting, so automatic hiding on `/play` was not implemented. Players click
Fullscreen; unsupported browsers hide the button.

The player uses an outlined yellow triangle, drawn above the crowd at a fixed
screen size and anchored independently of bean rotation. Shadows use a stationary
course-wide 1024 map with soft filtering, and bean meshes have smoother curves.
Canvas labels use sRGB and bypass tone mapping to preserve contrast. Actual
device shadow jitter and GPU frame rate were not benchmarked.

The full Chromium regression passed with owner navigation, fullscreen,
keyboard/touch controls, a bot-driven five-round show and all 16 recaptured
course previews. The subsequent label colour-space and narrow-screen camera corrections has a separate
focused browser check (`polish-results.json`), including bean visibility on a
390-pixel viewport and resuming the initialized instance. That earlier graphics follow-up did not change simulation rules. Current ZIP/runtime
byte equality is recorded in `final-install.json`.

## Perfect Match and repository manifest follow-up

`manifest.json` now uses the LNQ1/Street Fighter repository-list format with
`id=beanshow`, `organisation=lnbits`, `repository=beanshow`, as requested.
It passes the target runtime's actual `Manifest.parse_raw` schema and is included
in the ZIP. This is an intended repository location; no repository or release
was created or published.

Perfect Match now has three balanced, seeded layouts with 2/4/6 fruit types,
large procedural fruit illustrations, a target card, stage countdowns and
explicit reset cues. Easy gives 8 seconds to memorise and 6 to choose; Normal
uses 6 and 4. Unsafe tiles stay absent for the entire 3-second drop; the full
floor returns during a labelled 2-second reset. Layouts change only when a new
wave starts. All survivors qualify after three waves; a lone survivor may finish
early. Subsequent rounds handle a singleton field correctly. Portrait Match
uses a whole-board camera below the target card and hides the redundant radar;
other rounds retain their existing cameras.

Checks for this update:
- `npm test`: 256 individual bot runs and 12 full shows passed, zero deadlines.
- `ROUND_FILTER=match npm test`: another 16 Match bot runs and 12 shows passed,
  plus exact phase boundaries, floor consistency, unchanged layouts within waves,
  2/4/6 fruit availability, all-survivor completion and singleton progression.
- `MATCH_ONLY=1 node browser-check.mjs`: real LNbits iframe/CSP, memory/target/
  drop/reset/new-wave rendering, radar holes, bot-driven practice completion,
  mobile target-card fit; zero errors. Six updated screenshots were reviewed.
- `node match-final-check.mjs`: final portrait camera, bean visibility and final
  wave results cue; screenshot captured, zero page errors.
- Rebuilt WASM loaded through the existing isolated server lifecycle; signed-out
  public API returns the updated 60-second Match definition and play page 200;
  signed-out owner page remains 401. Final source/ZIP/installed bytes match for
  all 12 files. Development symlink unchanged. Main LNbits was not restarted.

Screenshots use paused timeline setups, including artificial phase jumps; they
verify presentation, not human survival. Bot runs test actual continuous physics.
The updated Match has not been manually completed by a human here. All earlier
human-play, physical-device, audio, GPU, multiplayer and payment limitations remain.
