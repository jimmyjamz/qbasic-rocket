# RKT-72 — Sneakle Wobble Coil pickup and return-to-UFO install

RKT-72 adds the next focused repair beat after the Sneakle hatch diagnostic.

## Player flow

```text
INSPECT UFO HATCH
→ FIND MISSING PART
→ collect Wobble Coil away from UFO
→ RETURN TO UFO
→ WOBBLE COIL INSTALLED
```

## Scope

- Adds a visible Wobble Coil pickup away from the broken UFO.
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
4. Move left away from the UFO and find the Wobble Coil.
5. Collect the Wobble Coil.
6. Confirm objective becomes `RETURN TO UFO`.
7. Return to the hatch beside the UFO.
8. Confirm objective becomes `WOBBLE COIL INSTALLED`.

## Guardrails

- No full inventory system.
- No multi-part repair list yet.
- No alien trade yet.
- No UFO warp travel yet.
- No stolen rocket recovery yet.
- No combat, weapons, health, damage, lives, or fail-state pressure.
