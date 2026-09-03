# RKT-70 — Sneakle traversal and harder UFO part pickup

This slice builds on the merged Sneakle rocket-theft, broken-UFO, and first-part discovery work.

## What it adds

- Keeps the first UFO part in the current camera-safe UFO/hatch area.
- Raises the blinking part onto a small hatch-room ledge.
- Requires a small jetpack hop before the part can be collected.
- Prevents normal ground walking from immediately collecting the part.
- Updates Sneakle mission copy so the player is asked to reach the ledge, not just walk into the part.

## Why this scope

The earlier extended underground-room attempt exposed camera/scroller assumptions that are not ready for a longer rightward traversal. RKT-70 makes the part feel earned without reopening that fragile path.

## Out of scope

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
6. Confirm objective changes to **FIND UFO PART**.
7. Walk into the nearby hatch/part area on the ground.
8. Confirm ground walking alone does **not** collect the part.
9. Use **Space** / jetpack to hop up to the blinking part.
10. Confirm objective changes to **UFO PART FOUND**.
11. Confirm no repair/trade/warp/recovery starts yet.
12. Spot-check **Gherkin-7** still works.

## Follow-up direction

A later slice should rebuild the larger underground room directly inside the shared surface-view system before adding longer traversal, puzzles, or more demanding obstacles.
