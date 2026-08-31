# RKT-62 — Frost Pea slippery ice and pickaxe rescue

Frost Pea is the third authored surface level and the final easy rescue before
first contact. It adds gentle acceleration and coasting, a visible pickaxe, an
ice column that blocks progress, and the frozen explorer beyond it.

The pickaxe is a single level-local quest item. Walking over it picks it up and
shows it beside the astronaut. Keep moving into the marked column for about 0.65
seconds; its shards separate/shrink, the column clears, and the mission advances
to the explorer. There is no precision input, inventory screen or item choice.

The explorer replays the admitted route on return. The broken column stays open
for that attempt. Vortex and Reset recreate the pickaxe, intact column, explorer
and empty route before completion, with no reward. Normal rescue, badge,
passenger, boarding, onward flight and animated station return remain shared.

## Validation

- 15 tests pass: three focused Frost tests plus the expanded full-app sequence.
- Focused checks cover intact-column blocking, pickup, timed break, passage,
  reset, and the relative acceleration/coasting behavior.
- The full application simulation reaches Frost through the station, performs
  the pickup/break/rescue/escort/board flow, earns exactly the third badge, and
  validates Frost NPC vortex/reset. Existing Sprout, Cinder, station, service,
  monkey, return flight and interrupted return checks remain green.
- Production build passes with the existing nonblocking bundle-size warning.
- Browser checks cover real WebGL Frost landing/EVA, distinct icy presentation,
  pickup and rocket markers, initial guidance, and no console errors. Movement,
  breaking and full escort feel still require user playtest.

## Playtest

1. At the station, choose Frost Pea, launch, land and exit.
2. Tap/release A and D. Confirm acceleration and skid are noticeable but easy to
   correct, with no pits or damage.
3. Skate right to PICKAXE. Confirm it moves beside the astronaut and the help/
   mission changes to BREAK ICE COLUMN.
4. Push right at BREAK ICE for a brief moment. Confirm visible cracking/clearing,
   then pass it and reach the frozen explorer.
5. Escort left. Confirm the open column does not trap either character, then
   rescue, board and receive exactly one additional badge/passenger/summary.
6. Return to station, retain rewards, choose another planet and relaunch.
7. Before completion, repeat with vortex and Reset after pickup and during the
   break. Confirm fresh pickaxe/column/explorer, no reward, and clean retry.

RKT-61 remains deferred. Next: RKT-54, then RKT-56.
