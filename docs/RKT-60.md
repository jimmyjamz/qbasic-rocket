# RKT-58 polish, RKT-59 vortex, and RKT-60 Cinder Bean

## Delivered scope

The cleanup was implemented and tested before the Cinder slice (cleanup commit
9542a2a). World instruction signs are roughly half their former width, help copy
is shorter, and the mission/help panels are compact during surface exploration.
A thin ground outline plus a small “ROCKET · E” sign replaces the upright ring.

RKT-59 adds NPC pull-in movement, rotation and shrinking to the existing vortex
sequence. Surface NPCs animate in world coordinates; Frost's legacy overlay
animates toward the projected vortex. Rescue progress pauses during the sequence.
The existing checkpoint reset still owns the reset; no new reward/reset system.
Visible and following NPCs participate; already-boarded passengers remain aboard.

Cinder Bean now has its own copper trail, rock props, orange-suited heat-shield
mechanic, and one timed steam vent. Sprout's vine trail remains the first level;
Frost retains the baseline rescue behavior.

## Vent rules

- Four seconds “WAIT · STEAM”: visible rising steam blocks new entry from either side.
- Six seconds “GO · COOL”: steam disappears and entry opens.
- One second “WAIT · WARMING”: smaller puffs warn of the next steam burst; new entry closes.
- Text and color distinguish phases. No damage, health, inventory or combat.
- If the astronaut or following NPC is still crossing at the end of GO, the vent
  stays cool until they clear it. Waiting outside does not hold it open.
- The mechanic retraces the astronaut's admitted route; the return trip uses the
  same vent and generous timing. Both must be grounded near the rocket to finish.
- Vent time advances only during normal exploration. Vortex and Reset restore a
  fresh vent cycle and NPC, clearing escort history without awarding a rescue.

## Automated validation

`npm test` passes 12 tests, including steam phase boundaries, blocking both ways,
safe crossing, no trapping, and player/escort grace at 20/60/144 FPS.
The full application simulation uses real Three.js transforms with GPU rendering
stubbed. It validates Sprout and Cinder rescue completion, rewards, passenger,
summary, reboarding, planet service, onward Frost landing, and vortex behavior on
all three planets. Tests assert NPC movement/shrinking, progress freeze, no extra
badges, reset transforms and fresh escort state. `npm run build` passes; the
existing non-blocking bundle-size warning remains.

Browser checks cover real WebGL startup, Cinder landing/exit and the compact HUD
and return marker. Complete visual escort/vortex playtesting remains for review;
the automated sequence checks are not a GPU playthrough.

## Review steps

1. On `feat/rkt-58-surface-level`, pull updates, run `npm ci`, `npm test`, and
   `npm run dev -- --port 5174 --strictPort`. Stop an older server on that port first.
2. Launch to Sprout and exit. Check smaller signs/help, subtle ground marker,
   vine crossing, botanist rescue, one badge, boarding and summary.
3. Launch to Cinder (or select it at the station). Exit and walk right. Wait at
   the steaming vent, cross on GO, reach the mechanic and return left.
4. Stop briefly inside during GO and let the mechanic catch up on return: the
   vent must stay cool until both have cleared. No damage or failed mission.
5. Board: check one additional rescue/badge, mechanic passenger and summary.
   Re-exit/reboard: no duplicate reward. Fly to Frost: check service and monkey gag.
6. Invoke the vortex during escort on Sprout and Cinder. NPC must move/spin/shrink
   toward it, with no completion/badge. Re-exit after reset: full-size fresh NPC,
   zero return progress, and fresh Cinder vent cycle. Also check Frost's overlay.
7. Reset during waiting, crossing, escort and flight. No stale NPC, steam or
   banana objects at the station. Repeat with an offset landing position.

No station hub or alien/item implementation was added. Next roadmap:
RKT-55 → RKT-54 → RKT-56.
