# RKT-63 — Animated return flight and station landing

User-approved follow-up to the RKT-55 foundation, before RKT-62. Return to station
now launches from the current landing position, follows the existing flight arc,
switches scenery at the apex, and descends to the station pad. Steering and
landing alignment reuse the existing flight implementation. The station crew
appears on approach, but the hub opens only after touchdown.

Return is available only after rescue and boarding, outside launch service.
The passenger profile and boarded state stay fixed during the trip; no additional
rescue or badge is awarded. At touchdown the established Reset action performs
station/presentation cleanup and retains session rewards. Reset pressed during
flight still returns home immediately and cancels the trip.

Normal planet launch/service, next-destination, vortex and rescue behavior remain
unchanged. This story does not add ice, heat consequences, items or persistence.

## Validation

- All 12 tests pass. The full-app sequence asserts ascent from the planet,
  passenger/role retention, station scenery and crew on approach, hidden hub
  before touchdown, earned reward preservation, and a subsequent Frost launch.
- Additional sequences interrupt return at one and five seconds, checking an
  immediate clean home state and no delayed landing or duplicate reward.
- Production build passes with the existing bundle-size warning.
- These are application simulation tests with GPU rendering stubbed; visual
  return-flight feel still needs playtest acceptance.

## Playtest

1. Rescue on Sprout or Cinder, return and board. Confirm your badge and passenger.
2. Choose Return to station. Rocket should rise from the planet, fly, then
   descend to the station. Passenger should keep the same identity throughout.
3. Check station hub appears only once landed; rewards are unchanged and the
   passenger indicator clears. Choose a new destination and launch again.
4. Repeat and press Reset during takeoff, then on another run during approach:
   instant home, no delayed arrival, no extra badge, and relaunch still works.
5. Also check direct onward travel still uses the existing service sequence.

RKT-61 remains deferred. Next target: RKT-62, then RKT-54 and RKT-56.
