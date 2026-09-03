# RKT-70 — Sneakle hatch diagnostic

This slice fixes the clunky first RKT-70 pass. The player should not find a UFO repair part sitting on the broken UFO itself.

## What it adds

- Keeps the gameplay challenge in the current camera-safe UFO/hatch area.
- Changes the raised target from a **UFO part** into a blinking **hatch diagnostic panel**.
- Requires a small jetpack hop to inspect the panel.
- Ground walking alone should not complete the diagnostic.
- After inspection, the objective becomes **FIND MISSING PART**.
- The missing part is identified as a **Wobble Coil**, which should be found elsewhere in a later slice.

## Intended story flow

1. Rocket is stolen.
2. Player finds the broken UFO.
3. Player jetpacks up to inspect the hatch panel.
4. The UFO diagnostic reveals that a Wobble Coil is missing.
5. Player must search Sneakle next.

## Out of scope

- No actual repair part pickup yet.
- No full underground traversal yet.
- No hard blocker/wall yet.
- No inventory system.
- No repair step yet.
- No trading yet.
- No UFO warp travel yet.
- No rocket recovery yet.
- No combat, weapons, health, damage, lives, or fail-state pressure.

## Manual validation

1. Start from the station.
2. Launch to **Sneakle-5**.
3. Press **E** to exit.
4. Confirm the tiny aliens steal the rocket.
5. Walk right and find the broken UFO.
6. Confirm objective changes to **INSPECT UFO HATCH**.
7. Walk into the hatch/panel area on the ground.
8. Confirm ground walking alone does **not** complete it.
9. Use **Space** / jetpack to hop up to the blinking hatch panel.
10. Confirm objective changes to **FIND MISSING PART**.
11. Confirm no repair/trade/warp/recovery starts yet.
12. Spot-check **Gherkin-7** still works.

## Follow-up direction

Next slice should put the Wobble Coil somewhere else on Sneakle, ideally through a small traversal/trade beat that feels earned without requiring a full inventory system yet.
