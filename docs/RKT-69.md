# RKT-69 — Sneakle first UFO part discovery

This slice continues after RKT-68, where the player discovers the broken UFO on Sneakle-5.

## What it adds

- Adds a visible hatch/underground-room beat after the broken UFO is discovered.
- Changes Sneakle objective progression:
  - **FIND BROKEN UFO**
  - **FIND UFO PART**
  - **UFO PART FOUND**
- Adds a small hatch-room visual treatment with a hatch, back wall, floor, lights, and blinking part.
- Keeps the first UFO part close to the proven UFO/hatch area so the slice remains playable with the current camera/scroller behavior.
- Hides the large **BROKEN UFO · NEEDS PARTS!** sign once the UFO has been discovered so later objectives rely on Mission Control and do not clip offscreen.
- Defers extended underground traversal and hard collision until the room layout is folded into the shared surface view.
- Collects the first UFO part when the astronaut reaches the nearby part marker.
- Suppresses generic rescue/escort UI while Sneakle is in this non-rescue objective flow.

## Scope boundaries

This is the first gameplay step after discovering the broken UFO. It should stay small and forgiving.

Out of scope:

- No UFO repair yet.
- No inventory system.
- No trading yet.
- No UFO flight/warp yet.
- No rocket recovery yet.
- No extended underground traversal in this slice.
- No hard underground blocker in this slice.
- No combat.
- No weapons.
- No health, damage, lives, or fail-state pressure.

## Implementation notes

- Core gameplay state lives in `src/surfaceAdventureState.js`.
- The hatch-room visuals are in `src/sneakleUndergroundPresentation.js` for this slice.
- The Sneakle-specific mission copy is in `src/sneakleObjectiveStatusPresentation.js` so Sneakle does not fall through to generic rescue/escort UI.
- The first part was pulled back near the UFO/hatch after playtesting showed the extended room exceeded the current shared camera/scroller assumptions.
- The original large broken-UFO sign is only for the discovery beat and hides after `ufoDiscovered` so it does not overlap or clip during the part-found state.
- A later slice should rebuild the underground traversal as a first-class shared surface view rather than a helper overlay.

## How to validate manually

1. Start from the station.
2. Choose **Sneakle-5**.
3. Launch and land normally.
4. Press **E** to exit.
5. Confirm tiny aliens steal the rocket.
6. Confirm the astronaut is stranded.
7. Walk right and find the broken UFO.
8. Confirm the objective changes to **FIND UFO PART**.
9. Confirm the large **BROKEN UFO · NEEDS PARTS!** sign hides after the UFO is discovered.
10. Confirm Mission Control does **not** say **Return with Stranded explorer** on Sneakle.
11. Confirm the rescue debug panel does not show an active Sneakle rescue/escort state.
12. Reach the nearby blinking UFO part in the hatch/UFO area.
13. Confirm the astronaut does not need to jetpack offscreen to progress.
14. Confirm the objective changes to **UFO PART FOUND**.
15. Confirm the large broken-UFO sign remains hidden after the part is found and does not clip off the right side of the screen.
16. Confirm the part disappears or is no longer collectable.
17. Confirm the bottom-left/help copy says repair comes in the next slice.
18. Confirm repair/trade/warp/rocket recovery do not happen yet.
19. Spot-check **Gherkin-7** still works.

## Validation completed in chat runtime

Earlier targeted RKT-69 tests passed in the chat runtime before the branch was opened. Full local validation is still required after the latest stale-sign clipping fix.

## Follow-up direction

The next slice should let the player use the found UFO part in a simple repair/trade beat, but still avoid a full inventory system unless the design explicitly needs it. A later polish/design slice should reintroduce a clean, readable underground traversal obstacle after the hatch-room layout is implemented directly in the shared surface view.
