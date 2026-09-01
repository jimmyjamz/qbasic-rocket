# RKT-65A — Rocket theft opening

This slice starts the rocket-theft arc without implementing the full repair, UFO, warp, or recovery loop yet.

## What it adds

- A new mischievous alien destination: **Sneakle-5**.
- Sneakle-5 as a normal destination in the shared `planetExplorer` loop.
- A shared `THEFT_LEVEL` in the side-scroller surface engine.
- A visible theft sequence after the astronaut exits the rocket:
  - tiny aliens waddle toward the ship;
  - the rocket waits while they reach and board;
  - the tiny aliens disappear into the ship before liftoff;
  - the rocket launches away without permission;
  - the astronaut remains stranded on the planet.
- A clear stranded state:
  - no rocket boarding;
  - no next launch;
  - side-scroller-style walk/jetpack exploration remains available;
  - player is told to find another way off the planet.

## RKT-65A corrections

The original Sneakle opening used a sidecar presentation hook, which fought the newer shared planet/side-scroller flow. That approach was removed. Sneakle now uses the normal planet selection, rocket flight, landing, exit, and side-scroller movement path.

The theft timing now separates alien boarding from rocket launch movement:

- `theftBoardingProgress` drives the tiny aliens walking to and boarding the rocket.
- `theftProgress` stays at zero until the boarding beat is complete.
- Once rocket launch-away begins, the thief crew is hidden so they read as being inside the ship instead of lagging behind as separate surface objects.

## Guardrails preserved

- No combat.
- No weapons.
- No health, damage, lives, or fail-state pressure.
- No complex inventory.
- No permanent rocket loss.
- Existing rescue planets and Gherkin-7 first-contact state are not rewritten.

## How to validate manually

1. Start from the station.
2. Cycle destinations until Gherkin-7 is selected.
3. Press **Choose next planet** one more time.
4. Confirm **Sneakle-5** appears as the next destination.
5. Launch to Sneakle-5.
6. Confirm only the rocket is visible during blastoff; the astronaut should not drop out or remain fixed on-screen.
7. Confirm the rocket flies to a new purple/yellow planet surface.
8. Press **E** / **Exit rocket**.
9. Confirm the astronaut appears beside the landed rocket.
10. Confirm tiny mischievous aliens waddle to the rocket while the rocket stays grounded.
11. Confirm the aliens disappear into the ship before liftoff.
12. Confirm the rocket flies away and disappears.
13. Confirm the astronaut remains on Sneakle-5.
14. Confirm the buttons show the rocket is unavailable and Mission Control says to find another way off.
15. Walk and jetpack right to confirm stranded exploration scrolls horizontally like the newer planet style.
16. Reset and spot-check rescue planets, station, Gherkin-7, First Contact reward, monkey gag, planet service animation, and vortex/reset.

## Known limitation

This is still only the opening slice. The broken UFO, repair part, warp travel, and rocket recovery are intentionally left for later RKT-65 slices.
