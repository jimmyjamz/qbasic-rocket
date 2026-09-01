# RKT-65A — Rocket theft opening

This slice starts the rocket-theft arc without implementing the full repair, UFO, warp, or recovery loop yet.

## What it adds

- A new mischievous alien destination: **Sneakle-5**.
- Sneakle-5 is now wired into the normal `planetExplorer` planet list and shared side-scroller surface flow.
- A new `THEFT_LEVEL` surface type in `surfaceAdventureState.js`.
- Theft visuals in `surfaceAdventureView.js`:
  - purple/yellow Sneakle surface;
  - wobbly towers;
  - tiny mischievous aliens;
  - signs that point the player right after the rocket is stolen.
- A visible theft sequence after the astronaut exits the rocket:
  - tiny aliens waddle toward the ship;
  - the rocket launches away without permission;
  - the astronaut remains stranded on the planet.
- A clear stranded state:
  - no rocket boarding;
  - no next launch;
  - normal side-scroller walk/jetpack exploration remains available;
  - player is told to find another way off the planet.

## Architecture correction

The first Sneakle implementation used `rocketTheftOpeningPresentation.js` as a sidecar Three.js/DOM overlay. That approach fought the newer shared planet/scroller engine and allowed the astronaut to appear fixed outside the rocket during launch.

That sidecar import has been removed. Sneakle now follows the same high-level path as the other planets:

```text
normal planet selection
→ normal rocket flight
→ normal landing
→ normal Exit rocket action
→ shared surfaceAdventure side-scroller level
→ theft sequence inside the surface run/view
→ stranded state disables boarding
```

## Guardrails preserved

- No combat.
- No weapons.
- No health, damage, lives, or fail-state pressure.
- No complex inventory.
- No permanent rocket loss.
- Existing rescue planets and Gherkin-7 first-contact state are preserved.

## How to validate manually

1. Start from the station.
2. Cycle destinations until **Sneakle-5** appears as a normal destination after Gherkin-7.
3. Launch to Sneakle-5.
4. Confirm the normal rocket flight is used.
5. Confirm the astronaut does **not** drop out, hang, or remain fixed outside the rocket during launch.
6. Confirm the rocket lands on a purple/yellow Sneakle surface.
7. Press **E** / **Exit rocket**.
8. Confirm the astronaut appears beside the landed rocket.
9. Confirm tiny mischievous aliens waddle toward the rocket.
10. Confirm the rocket flies away and disappears.
11. Confirm the astronaut remains on Sneakle-5.
12. Confirm the buttons show the rocket is unavailable and the help text says to find another way off.
13. Walk and jetpack right to confirm exploration uses the side-scroller camera and movement style.
14. Reset and spot-check Sprout-9, Cinder Bean, Frost Pea, Gherkin-7, First Contact reward, monkey gag, planet service animation, and vortex/reset.

## Known limitation

This is still only the opening slice. The broken UFO, repair part, warp travel, and rocket recovery are intentionally left for later RKT-65 slices.
