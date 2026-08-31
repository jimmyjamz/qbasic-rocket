# RKT-58 — Planet surface rescue foundation

Reviewed the Jira story and the accepted repository baseline at `ed49a8e`.
Only Sprout-9 receives an authored level; RKT-55 and first-contact work are untouched.

## Implementation

- The level is anchored to the actual landing X coordinate. Exiting reveals a
  24-unit playable trail, rocket return ring/sign, one solid vine barrier, and one
  world-space botanist. The camera scrolls and the exploration HUD becomes compact.
- Existing A/D, arrow, Space jetpack and E controls remain. The wall blocks walking
  from either side and supports landing on top. No extra physics dependency.
- Sprout-9 progress uses world position instead of the legacy held-key timers.
  The astronaut must reach the target at ground level; the botanist then replays
  the player's route with a 0.65-second delay. Returning requires both characters
  grounded within the existing 1.35-unit rocket boarding radius.
- `surfaceAdventureState.js` owns layout, collision resolution, and the small
  rescue state machine. `surfaceAdventureView.js` owns reusable Three.js scenery.
  `planetExplorer.js` activates it only on Sprout-9 and coordinates movement,
  camera, boarding, launch, and reset.
- `rescueNpcPresentation.js` bridges the new state into the existing `visible →
  following → rescued → boarded` data attributes, so the mission tracker, badge,
  counter, passenger, completion overlay and summary use the same pipeline.
  The old floating NPC overlay is hidden on Sprout-9 to avoid a duplicate target.
- Re-exiting after a completed rescue preserves `boarded`; it cannot award another
  badge. New landings, global Reset, and vortex checkpoints clear the trail and
  escort state. Session reward totals retain the baseline behavior.
- Station crew, rocket steering, planet launch service, monkey gag, and the other
  two planet rescues are unchanged. Keyboard state clears on focus loss.
- Added a dependency lockfile and development-only DOM tests; Node requirement
  matches the resolved Vite version. No additional production dependencies.

## Validation performed

On Node 24.19.0:

- `npm test`: seven tests pass. Collision in both directions, landing on vines,
  blocked progress, vertical proximity, escort path and completion at 20/60/144
  FPS, premature boarding, reboarding, and stale-trail reset are covered.
- The integration test loads the actual complete application with a simulated
  DOM and animation clock. It uses real Three.js geometry and transforms, with
  only GPU rendering replaced. It drives keyboard/button input through station
  launch, monkey visibility, Sprout rescue, return, badge/counter, boarding,
  summary, re-exit/reboard, planet service, Cinder rescue, onward Frost landing,
  vortex during a Sprout escort, fresh checkpoint entry and global reset.
- `npm run build`: passes. The already documented large-bundle warning remains
  non-blocking; this story does not attempt bundle optimization.
- In-app browser: real WebGL rendering, station launch, Sprout landing/exit,
  rocket marker and compact HUD inspected at 1280×720; no console errors.

The automated integration test is not a GPU playthrough. A complete visual
playtest, especially escort animation feel and smaller viewports, remains for
review using the checklist below. No outstanding focused gameplay bug was
identified in the checks performed.

## Review playtest

1. `npm ci`, `npm test`, `npm run build`, then `npm run dev`.
2. Launch to Sprout-9. Check station crew, mouse steering and rocket-attached
   monkey/bananas. Land left or right of center to check the level anchor.
3. Press E. Verify a clear return ring at the rocket, compact HUD and a trail
   extending right. Boarding must stay disabled until the botanist is safe.
4. Walk right without Space. The vine barrier must stop the astronaut and rescue
   progress must not continue to completion while blocked.
5. Hold Space plus right briefly to cross the vines; release Space and land. Check
   the camera scrolls smoothly and the green-suited botanist/SOS is in the world.
6. Reach the botanist. Verify the tracker changes to escort. Return left; cross
   the same vines with the jetpack and check the botanist follows over them.
7. Land at the rocket ring and let the botanist catch up. Verify exactly one
   completion/badge/counter increment; E becomes available. Board and check the
   passenger indicator and three-line mission summary.
8. Exit and board again: no duplicate reward. Fly onward: the mechanic's tune-up
   precedes launch, monkey gag still runs, and Cinder's mission starts fresh.
   Complete the existing Cinder/Frost rescues and return to Sprout for a fresh run.
9. On Sprout, trigger the high-altitude vortex both before finding the botanist
   and during escort. Verify landed checkpoint, cleared rescue/return progress,
   no stale passenger, and a fresh botanist on the next exit.
10. Reset during exploration, escort and flight. Verify station crew returns,
    no surface scenery or bananas linger, and launch routing starts at Sprout.
    Repeat at a smaller window size and check control/marker legibility.
