# Bean Show

Bean Show is an LNbits WebAssembly extension for a colourful, 60-bean knockout
show. One player competes against 59 bots across five rounds for a single crown.

An LNbits user enables the extension and shares its public game link. Players
choose a name, bean colour, and difficulty, then join the lobby and ready up.
The current release is free solo play. **Multiplayer mode is planned.**

## Game flow

1. Enter the lobby with 59 bots and ready up to start the show.
2. Race through obstacle courses, survive hazards, and qualify for the next round.
3. Each round reduces the field until the final decides one winner.
4. Win the final to earn the crown and reach the celebration ceremony.
5. After elimination, spectate the remaining contestants or start a new show.

The course browser lets players practise any of the 16 rounds. Easy difficulty
is selected by default; Normal offers faster, more challenging opponents.
Touch controls and fullscreen are available.

## Controls

| Action | Key |
|---|---|
| Move | WASD or arrow keys |
| Jump | Space |
| Dive | Shift |
| Grab | E |
| Pause | Escape |
| Switch spectator | Tab |

## Extension details

- Extension ID: `beanshow`
- Extension type: `wasm`
- Version: `0.1.2`
- Admin route: `/ext/beanshow`
- Public route: `/ext/beanshow/play`
- WASM module: `wasm/module.wasm`
- Permissions: none
- License: [MIT](LICENSE); bundled Three.js retains its [MIT notice](THREE-LICENSE.txt)

## Build and test

```bash
cd dev
npm ci
npm run build
npm test
python3 package-release.py
```

The build writes the browser bundle to `static/game.js` and the installable
component to `wasm/module.wasm`. The install ZIP is `dist/beanshow-0.1.2.zip`.
