# Bean Show

An unofficial Fall Guys inspired solo knockout game, packaged as an LNbits WASM
extension. One human and 59 bots enter a join/ready lobby; five selected rounds
reduce the field to one winner and a crown ceremony. Original procedural meshes,
locally bundled Three.js, and synthesised Web Audio. Easy is selected by default.

## Play

After installation, the extension's Open action lands on the authenticated
owner page at `/ext/beanshow`. It provides Open Game and the public player link.
Open `/ext/beanshow/play` for signed-out free play. Enter a name, choose a bean colour, join the
lobby, then ready up. WASD/arrows move, Space jumps, Shift dives, E grabs,
Escape pauses. Tab switches spectators after elimination. The course browser
lets you practise every round. Losing still lets you watch the show finish.
Touch controls are provided for small/coarse-pointer screens.
The yellow triangle marks your bean through crowds and stays the same screen
size during jumps, dives and camera movement. Narrow-screen cameras follow
your bean to keep it in view. Fullscreen hides the surrounding
LNbits header, footer and drawer; click its button to enter or leave it.
The current runtime has no extension-level setting to hide that chrome
automatically, so fullscreen needs a player click and browser support.

## Install / build

Target: LNbits checkout `/home/talvasconcelos/Work/lnbits_pg`, commit
`e13d3e120c928e1db925cc6b5a983eff897f00bd`, version
`v1.6.2-rc1-24-ge13d3e120-dirty`. The game does not modify this checkout.
Extension ID `beanshow`, version `0.1.0`, no permissions and no storage migrations.
The WASM export `show-manifest` supplies the public round manifest; the browser
connects through the LNbits MessageChannel bridge before enabling lobby join.

The release ZIP is `dist/beanshow-0.1.0.zip`, with one `beanshow/` root, suitable
for this runtime's WASM archive layout. For a manual local install, extract that
root beneath your configured WASM extensions directory and enable `beanshow`
in LNbits. No remote repository or marketplace release was created.

The symlink beside Sat Heist is only for local development and your testing.
Release installations use the separate ZIP; the archive contains no symlinks.

```sh
cd bean-show/dev
npm ci
npm run build
npm test
python3 package-release.py
/home/talvasconcelos/Work/lnbits_pg/.venv/bin/python runtime-check.py
# While the isolated server is up, in another terminal:
npm run visual
```

The isolated harness installs the ZIP, checks public/authenticated routes,
restarts the same data directory, and leaves a test server at port 5021.
Use `runtime-check.py --serve` to reopen an already verified test instance.
The normal check resets its disposable test data; `--serve` preserves it.
The browser check uses the existing Playwright installation in the target
LNbits checkout. `node build.mjs --ui` rebuilds only the browser bundle.
The final component and archive hashes are in `evidence/`.

## Course adaptations

| Round | Implemented mechanics | Deliberate differences |
|---|---|---|
| The Whirlygig | Spinning sweepers, knockback, central fan and side routes | Compact flat route; fan uses a horizontal collider |
| Dizzy Heights | Rotating discs, gaps and moving balls | Six disc rows; circular floor approximation |
| Door Dash | Hidden breakable doors, solid decoys and crowd collisions | Four rows; doors vanish instead of ragdoll debris |
| Gate Crash | Timed gates and a final jump gap | Five lanes; gates switch collider state rather than rising smoothly |
| See Saw | Load-dependent tilt, sliding and platform gaps | Ten platforms; forgiving checkpoints |
| Tip Toe | Hidden connected safe path, revealed safe tiles and collapsing decoys | Rectangular grid; bots know the path but make execution mistakes |
| Slime Climb | Rising slime, elevated route and lateral pushers | Straight ascending course, not the original switchbacks |
| Hit Parade | Pendulum hazards and crowd collisions | Pendulum-focused race; turnstiles/push-wall stages missing |
| Jump Club | Lower and upper rotating bars, jumping and knockback | Elimination quota; simplified bean collisions |
| Block Party | Approaching walls with openings and low jump hurdles | Compact repeating obstacle sequence |
| Roll Out | Five conveyor strips with moving gaps and lane switching | Flat strip approximation, not cylindrical rotating geometry |
| Perfect Match | Six fruit types, memorise/choose/drop phases | Text-labelled fruit tiles rather than illustrations |
| Hex-A-Gone | Shared disappearing tiles and three stacked layers | Three layers instead of the original full arena |
| Thin Ice | Three cracks per tile, last survivor wins | Flat compact ice arena; colour changes rather than crack textures |
| Jump Showdown | Rotating bars, six sequentially falling sectors | Fixed sector order rather than the original randomness |
| Fall Mountain | Moving balls, pendulums and a vertically moving crown requiring grab | Flat race instead of the full original mountain layout |

These are recognisable mechanical adaptations, not copies of the original maps,
physics, assets or complete round catalogue. No team games, tail games or content
progression are implemented. Fall Guys belongs to its respective creators.
The lobby reference was inspected for presentation only:
[reference page](https://royal-pebble-6azj.here.now/). Its name/assets were not used.
Official inspiration for disappearing tiles:
[Fall Guys Survival Update](https://www.fallguys.com/news/fall-guys-survival-update).

## Difficulty and honest test boundary

Easy gives the player a speed advantage and slower, more error-prone bots.
Normal increases bot speed and reduces their route/jump mistakes. Bots share the physics,
hazards, finish line and elimination rules with the player; they can bump each
other, choose bad routes, mistime jumps and fall. An idle player still
loses. Hard deadlines ensure termination and explicitly declare their progress /
height / falls tiebreak; they never pretend a crown was grabbed.

Completion simulations control all 60 contestants with the bot policy, including
the human slot. They do not establish how fun the controls feel to a person or
how often a casual human wins. Keyboard interaction checks test real DOM input
in Chromium; a crown-grab check starts near the crown using a test setup pose.
The five-round rendered check advances the player with bot input. Screenshot
previews show course layouts; they are not evidence of manual completion.
See `evidence/VERIFICATION.md` for measured results and remaining gaps.

## Future multiplayer and money

`dev/sim.js` is a fixed-step deterministic simulation, separate from Three.js,
DOM input and audio. Each show has a seed, selected rounds, contestant IDs,
qualifiers and result history. This separation allows the same rules to be
ported to trusted server simulation with websocket input and snapshots.

This release is **free solo play only**. Its browser-controlled results are
untrusted. It has no real multiplayer room service, websocket synchronization,
paid entries, invoices, wallets, escrow, refunds, settlement or prizes. It does
not submit client wins for money. Before paid/multiplayer release, add trusted
simulation using capabilities actually present in the selected runtime,
validate inputs, persist authoritative results, and verify idempotent payment
admission/settlement/refunds. Peer relay alone does not make outcomes trustworthy.
