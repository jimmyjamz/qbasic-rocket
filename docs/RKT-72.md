# RKT-72 — Sneakle Wobble Coil pickup and return-to-UFO install

RKT-72 adds the next focused repair beat after the Sneakle hatch diagnostic.

## Player flow

```text
INSPECT UFO HATCH
→ FIND MISSING PART
→ climb elevated scrap route
→ collect Wobble Coil
→ RETURN TO UFO
→ WOBBLE COIL INSTALLED
```

## Scope

- Adds a visible Wobble Coil pickup away from the broken UFO.
- Places the Wobble Coil on an elevated scrap route so it is not collected by ordinary left/right ground walking.
- Requires jetpack movement to reach the Wobble Coil.
- The Wobble Coil cannot be collected before the hatch diagnostic identifies the missing part.
- Collecting the Wobble Coil changes the objective to `RETURN TO UFO`.
- Returning to the hatch area installs the Wobble Coil.
- Installing the Wobble Coil changes the objective to `WOBBLE COIL INSTALLED`.

## Fast test URL

Use the RKT-71 shortcut while `npm run dev` is running:

```text
http://localhost:5173/?testPlanet=sneakle&testStage=hatch
```

## Manual validation path

1. Open the hatch shortcut.
2. Jetpack to the blinking hatch panel.
3. Confirm objective becomes `FIND MISSING PART`.
4. Move left away from the UFO.
5. Find the elevated scrap-hop route and Wobble Coil.
6. Confirm walking under the Wobble Coil does not collect it.
7. Use the jetpack to reach the elevated Wobble Coil.
8. Confirm objective becomes `RETURN TO UFO`.
9. Return to the hatch beside the UFO.
10. Confirm objective becomes `WOBBLE COIL INSTALLED`.

## Guardrails

- No full inventory system.
- No multi-part repair list yet.
- No alien trade yet.
- No UFO warp travel yet.
- No stolen rocket recovery yet.
- No combat, weapons, health, damage, lives, or fail-state pressure.
