# QBasic Rocket

A small modern 3D browser demo inspired by a childhood QBasic exercise: draw a rocket, move it up the screen, clear, repeat.

Instead of recreating the old text-only look, this project keeps the same teaching concept and upgrades the presentation with a 3D rocket, animated launch, flames, exhaust particles, lighting, a launch pad, and a star field.

The current slice expands that idea into a tiny planet-exploration loop:

1. launch the rocket;
2. guide it with the mouse while it flies;
3. land on an authored planet;
4. exit as an astronaut;
5. walk and jetpack around the terrain;
6. re-enter the rocket;
7. fly to another planet and repeat.

## Framework choice

This project uses **Vite + Three.js**.

Why this stack works well for the demo:

- **Vite** keeps the project simple and fast to run locally.
- **Three.js** gives enough 3D capability to make the rocket feel modern without adding a full game engine.
- **Vanilla JavaScript** keeps the code approachable for an AI-coding demonstration with your father.

## Requirements

- Node.js 20.19+ or 22.12+ (tested with Node 24)
- npm

## Run it from a fresh clone

```bash
git clone https://github.com/jimmyjamz/qbasic-rocket.git
cd qbasic-rocket
npm install
npm run dev
```

Then open the local URL that Vite prints, usually:

```text
http://localhost:5173
```

## Run it if you already cloned the repo

```bash
cd qbasic-rocket
git pull origin main
npm install
npm run dev
```

## Controls

Rocket mode:

- **Launch button** or **Space**: launch toward the selected planet.
- **Mouse movement**: guide the rocket smoothly during the flight phase.
- **Choose next planet** or **N**: cycle the destination while landed or before launch.

Astronaut mode:

- **Exit Rocket** or **E**: step out after landing.
- **A/D** or **Left/Right arrows**: walk around the planet terrain.
- Hold **Space**: fire the jetpack, lift off the ground, and show animated backpack flames plus exhaust puffs/clouds.
- Release **Space**: coast and descend back toward the terrain.
- Return near the rocket, land, and press **E** or use **Enter Rocket** to climb back in.

## Sprout-9 surface adventure (RKT-58)

Exit on Sprout-9 to enter a short authored side-scrolling trail. Move right with
A/D or arrows, hold Space to jetpack over the raised vine barrier, and reach the
green-suited botanist at the SOS sign. Escort them left over the vines to the
small rocket ground marker. Both characters must return to ground level near the rocket
before E enables boarding. The botanist retraces your route, including jetpack
movement. Flying too high still invokes the existing vortex checkpoint reset.

Sprout-9 is the vine traversal level. Cinder Bean now adds a timed steam vent:
wait during STEAM/WARMING and cross during the six-second GO interval to rescue
the heat-shield mechanic. The vent stays cool while either character is crossing.
Frost Pea retains the accepted rescue baseline. Landing, flight, launch service, rewards, and the next
destination flow remain shared. There is no new platformer engine or station hub.

Run `npm ci`, `npm test`, and `npm run build` to reproduce validation.
See [RKT-58 implementation and playtest notes](docs/RKT-58.md) for details.
See [RKT-58 polish, RKT-59 fix and RKT-60 validation](docs/RKT-60.md) for the latest changes.

## Space station home base (RKT-55)

At the launchpad, the station board previews your selected rescue and shows this
session's Space Hero badges. Choose a destination with the existing controls.
After rescuing and boarding, **Return to station** flies you home while
keeping earned session rewards; direct planet-to-planet travel still works.
The supply stop is a clearly labeled future placeholder. No items or purchases
are available yet. See [hub validation notes](docs/RKT-55.md).
The home board appears after station touchdown; **Reset** remains instant.
See [animated return validation](docs/RKT-63.md).

## Debug configuration

The launch countdown is implemented but skipped by default so repeated testing stays fast.

In `src/planetExplorer.js`, change this constant when you want to test the countdown flow:

```js
const LAUNCH_COUNTDOWN_ENABLED = false;
```

Set it to `true` to show the short `3`, `2`, `1`, `Launch!` countdown before rocket flight. Set it back to `false` when debugging movement, planet landing, jetpack, or black-hole behavior.

## Production build check

```bash
npm run build
npm run preview
```

The current proof of concept may produce a Vite chunk-size warning because Three.js and the game code are bundled together. The build can still complete successfully. Bundle optimization/code splitting is tracked as backlog technical debt rather than blocking gameplay work.

## Demo talking points

The original QBasic idea was essentially:

1. choose a screen position,
2. print the rocket,
3. wait briefly,
4. clear the screen,
5. repeat with the rocket one row higher.

The modern version maps that same loop to a browser animation frame:

1. calculate launch progress,
2. move the 3D rocket upward and across space,
3. update rocket flame and exhaust particles,
4. land on a planet,
5. switch control from rocket to astronaut,
6. apply walking, jetpack thrust, gravity, animated backpack flames, and exhaust puffs,
7. render the next frame.

That makes it a nice example of how the core idea of programming has not changed much, even though the tools and visuals are dramatically better.
