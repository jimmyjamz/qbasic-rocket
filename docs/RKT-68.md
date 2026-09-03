# RKT-68 — Sneakle map and broken UFO discovery

This slice continues the RKT-65 rocket-theft arc after the validated Sneakle-5 opening.

## What it adds

- Extends Sneakle-5 as an authored side-scroller map after the rocket is stolen.
- Changes the stranded objective to **FIND BROKEN UFO**.
- Adds a longer Sneakle traversal space with lighter environmental clueing.
- Adds a visible broken UFO landmark near the right side of the level.
- Positions the broken UFO so the astronaut approaches and stands beside it instead of walking inside the saucer.
- Uses one combined UFO-area sign: **BROKEN UFO · NEEDS PARTS!**.
- Automatically marks the UFO discovered from the left-side approach point.
- Changes the objective to **FIND UFO PARTS** after discovery.

## Signposting direction

RKT-68 should avoid over-explaining the path. The UFO, one combined UFO-area sign, and HUD objective should carry most of the guidance. Keep only light environmental hints, such as odd footprints or alien props, instead of repeated map/keep-going signs.

## Guardrails preserved

- Sneakle remains inside the shared `surfaceAdventure` side-scroller flow.
- No combat.
- No weapons.
- No health, damage, lives, or fail-state pressure.
- No inventory system yet.
- No repair, trade, warp, or rocket recovery yet.

## Follow-up direction

The next slice should introduce light traversal difficulty rather than another straight walk-right objective. A good next beat is a stairwell or entrance leading to an underground alien space room where the player must use the jetpack over/through simple obstacles to reach the first UFO part.

## How to validate manually

1. Start from the station.
2. Choose **Sneakle-5**.
3. Launch and land normally.
4. Press **E** to exit.
5. Confirm tiny aliens steal the rocket and leave the astronaut stranded.
6. Confirm the objective becomes **FIND BROKEN UFO**.
7. Walk/jetpack right through the Sneakle map.
8. Confirm there are no repeated **BLORP MAP** / **KEEP GOING** guidance signs.
9. Confirm a clearly broken UFO appears near the right side of the level.
10. Confirm the astronaut can stand beside the UFO instead of visually inside the saucer.
11. Confirm there is one nearby combined sign: **BROKEN UFO · NEEDS PARTS!**.
12. Approach the UFO from the left edge.
13. Confirm the objective changes to **FIND UFO PARTS**.
14. Confirm nothing repairs, warps, or recovers the rocket yet.
15. Spot-check Gherkin-7 still works.

## Known limitation

This is discovery only. RKT-65C/RKT-69 should handle parts, trade, repair, and eventual UFO travel.
