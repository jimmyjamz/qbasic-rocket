# RKT-71 — Dev test-start shortcuts

RKT-71 adds local/dev-only URL shortcuts so manual validation can jump directly into useful planet and mission states.

## Why

Sneakle testing was too slow because each validation loop required:

1. Select Sneakle-5.
2. Launch.
3. Wait through flight and landing.
4. Exit the rocket.
5. Wait through theft.
6. Walk to the UFO.
7. Reproduce hatch/collision behavior.

## Supported URLs

```text
http://localhost:5173/?testPlanet=sneakle
http://localhost:5173/?testPlanet=sneakle&testStage=landed
http://localhost:5173/?testPlanet=sneakle&testStage=stranded
http://localhost:5173/?testPlanet=sneakle&testStage=ufo
http://localhost:5173/?testPlanet=sneakle&testStage=hatch
```

## Stage behavior

- `testPlanet=sneakle` selects Sneakle-5 from the launchpad.
- `testStage=landed` starts landed on Sneakle-5 before EVA.
- `testStage=stranded` starts after rocket theft.
- `testStage=ufo` starts after broken UFO discovery.
- `testStage=hatch` starts near the hatch diagnostic setup with objective `INSPECT UFO HATCH`.

## Guardrails

- Only runs on localhost / local dev hosts.
- Invalid or absent query params preserve normal startup.
- Does not remove or alter normal launch, landing, theft, or rescue flows.
