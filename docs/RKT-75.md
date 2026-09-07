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

## Deferred

- Actual UFO takeoff.
- UFO warp-speed sequence.
- Arriving on a previous planet.
- Recovering the stolen rocket.
