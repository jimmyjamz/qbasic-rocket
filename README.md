# QBasic Rocket

A small modern 3D browser demo inspired by a childhood QBasic exercise: draw a rocket, move it up the screen, clear, repeat.

Instead of recreating the old text-only look, this project keeps the same teaching concept and upgrades the presentation with a 3D rocket, animated launch, flames, exhaust particles, lighting, a launch pad, and a star field.

## Framework choice

This project uses **Vite + Three.js**.

Why this stack works well for the demo:

- **Vite** keeps the project simple and fast to run locally.
- **Three.js** gives enough 3D capability to make the rocket feel modern without adding a full game engine.
- **Vanilla JavaScript** keeps the code approachable for an AI-coding demonstration with your father.

## Requirements

- Node.js 20 or newer
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

## Production build check

```bash
npm run build
npm run preview
```

## Demo talking points

The original QBasic idea was essentially:

1. choose a screen position,
2. print the rocket,
3. wait briefly,
4. clear the screen,
5. repeat with the rocket one row higher.

The modern version maps that same loop to a browser animation frame:

1. calculate launch progress,
2. move the 3D rocket upward,
3. update flame and exhaust particles,
4. update the camera and HUD,
5. render the next frame.

That makes it a nice example of how the core idea of programming has not changed much, even though the tools and visuals are dramatically better.
