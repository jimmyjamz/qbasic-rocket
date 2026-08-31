# RKT-55 — Space Station Hub Foundation

The launchpad now has a compact home-base panel: mission board, selected planet,
session rescue/Space Hero badge totals, and a clearly unavailable future supply
stop. Existing Choose next planet and launch controls drive the board; no second
destination state was introduced. The original crew and rocket scene remain.

After completing a rescue and boarding, Return to station becomes available.
It uses the established Reset action and its cleanup listeners: immediate return
to the launchpad, fresh mission state, initial Sprout destination, and retained
session rewards. This foundation does not animate a return flight. Direct onward
planet travel remains available. Returning home never awards a badge itself.

The hub hides during launch, flight, landing, EVA and vortex. Existing mission
tracker/presentation takes over there. Debug and duplicate mission instructions
are hidden at home; the supply stop is a noninteractive placeholder, not an item
pickup or an inventory system. Rewards are in memory only; reload starts fresh.

## Validation

- `npm test`: 12 passing tests. Full-app simulation now also checks initial hub,
  destination/objective changes, launch visibility, return eligibility, Cinder
  rescue -> home with two earned rewards -> Frost launch, cleanup and crew.
- Existing Sprout/Cinder traversal, service/monkey, escort, rewards, passenger,
  summary, boarding, vortex and reset checks still pass.
- `npm run build` passes with the existing nonblocking bundle-size warning.
- Browser: home panel/crew layout, destination selection, and launch checked.
  Full visual return-after-rescue playtest remains for user acceptance; automated
  application tests use real Three.js transforms with rendering stubbed.

## Playtest

1. Start at the station. Check mission, destination, zero session badges and
   supply placeholder. Choose Cinder or Frost and check mission text changes.
2. Launch: hub disappears, crew/monkey and normal flight remain intact.
3. Rescue and board on Sprout or Cinder. Check one rescue/badge, passenger and
   summary. Return to station must appear only after boarding, not during EVA.
4. Return to station: crew reappears, earned badges remain, no stale rescue NPC,
   passenger or summary. Select another destination and launch again.
5. Instead of returning home, fly directly onward: existing service flow remains.
6. Invoke vortex during escort: no new reward and no premature home screen.
   Reset returns home; reload begins a fresh reward session.

## Product decisions

RKT-58/59/60 are Done and accepted from playtest. RKT-60's blocking steam and
occupied COOL interval stay unchanged. RKT-61 is deferred. No ice, alien or
inventory behavior is added here. Next: RKT-62, then RKT-54, then RKT-56.

This branch builds on the accepted but not yet merged RKT-58/59/60 feature branch.
Review the hub diff against that branch; merge the prerequisite PR first.
