# RKT-75 — Sneakle Flux Capacitor install and UFO launch-ready repair

RKT-75 continues the Sneakle UFO recovery arc after the Cheetos trade.

## Player flow

```text
Cheetos trade completes
→ Flux Capacitor is received
→ objective becomes RETURN TO UFO
→ player brings Flux Capacitor back to the UFO hatch
→ Flux Capacitor installs
→ UFO becomes launch-ready
→ later story handles UFO launch / warp / rocket recovery
```

## Scope

- Keep Flux Capacitor state level-local to Sneakle-5.
- No full inventory UI.
- No shop/currency/crafting grid.
- No UFO warp or stolen-rocket recovery yet.
- Preserve RKT-73 backpack/Cheetos/weird alien trade.
- Render a visibly repaired, upright, launch-ready UFO in the Sneakle overlay once `ufoLaunchReady` is true.
- Hide the old broken UFO scenery and the leftover trade prize after the Flux Capacitor is installed.

## Fast test URLs

```text
http://localhost:5173/?testPlanet=sneakle&testStage=flux
http://localhost:5173/?testPlanet=sneakle&testStage=repaired
http://localhost:5173/?testPlanet=sneakle&testStage=ufo-ready
```

## Manual validation

1. Start at `?testPlanet=sneakle&testStage=flux`.
2. Confirm objective is `RETURN TO UFO`.
3. Move back to the UFO hatch.
4. Confirm objective becomes `UFO READY`.
5. Confirm `?testPlanet=sneakle&testStage=repaired` starts directly at the launch-ready state.
6. Confirm the visible UFO is upright, clean, glowing, smoke-free, and no longer reads as broken.
7. Confirm the `ICKY SLIME + FLUX` trade reward is gone after install.

## Deferred

- Actual UFO takeoff.
- UFO warp-speed sequence.
- Arriving on a previous planet.
- Recovering the stolen rocket.
