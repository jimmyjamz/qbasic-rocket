# RKT-65A — Rocket theft opening

This slice starts the rocket-theft arc without implementing the full repair, UFO, warp, or recovery loop yet.

## What it adds

- A new mischievous alien destination: **Sneakle-5**.
- A station-board target after Gherkin-7 for the new planet.
- A theft-specific presentation module that keeps the existing rescue and first-contact engine untouched.
- A visible theft sequence after the astronaut exits the rocket:
  - tiny aliens waddle toward the ship;
  - the rocket launches away without permission;
  - the astronaut remains stranded on the planet.
- A small Mission Control card for the theft arc.
- A clear stranded state:
  - no rocket boarding;
  - no next launch;
  - side-scroller-style walk/jetpack exploration remains available;
  - player is told to find another way off the planet.

## RKT-65A correction

The Sneakle opening was reworked after playtest feedback so the astronaut no longer drops out or remains fixed during the blastoff segment. During the Sneakle launch, the astronaut is explicitly hidden/reset until landing, then exits only after the player presses **E**.

The stranded exploration space is also widened and camera-follow behavior is tuned to feel closer to the current side-scroller planet style instead of the older short walk-around prototype.

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
10. Confirm tiny mischievous aliens board the rocket.
11. Confirm the rocket flies away and disappears.
12. Confirm the astronaut remains on Sneakle-5.
13. Confirm the buttons show the rocket is unavailable and Mission Control says to find another way off.
14. Walk and jetpack right to confirm stranded exploration scrolls horizontally like the newer planet style.
15. Reset and spot-check rescue planets, station, Gherkin-7, First Contact reward, monkey gag, planet service animation, and vortex/reset.

## Known limitation

This is still only the opening slice. The broken UFO, repair part, warp travel, and rocket recovery are intentionally left for later RKT-65 slices.

A deeper architecture cleanup can still promote Sneakle from the temporary theft-specific presentation hook into the shared `surfaceAdventure` level list if we want every future theft arc slice to use the exact same engine path as Sprout/Cinder/Frost/Gherkin.
