# RKT-54 — Friendly First Contact vertical slice

Gherkin-7 is a fourth, purple-and-lime authored mini-level separate from the three
rescue levels. On the first visit, seven world-space aliens crowd the rocket door.
The lead alien follows the astronaut upward during jetpack flight, making the
blocked route visible instead of feeling like an invisible wall. The astronaut
can move a few steps in either direction, but cannot pass the crowd
into the garden. Mission Control explains their signals may be warnings and
directs the astronaut back aboard.

After boarding, Return to station uses the established animated flight. The
station supply stop then exposes one Collect Translator Badge action. This is a
single mission flag, not a general inventory: it cannot duplicate, adds exactly
one badge to the session counter, does not alter rescue rewards, and persists
only for the browser session.

Returning to Gherkin-7 changes the same mini-level. On exit, the carried item
translates automatically: the crowd is gone and one world-space alien welcomes
the astronaut: “Welcome! Please avoid our moon-pickle garden.” The path is open.
Boarding changes the mission to complete and
enables station return. The separate First Contact completion reward is added by
RKT-56.

Reset remains an immediate station return and preserves current session mission
progress, consistent with badges and the existing hub. Reload starts a fresh
session. Gherkin never publishes a rescue target, increments rescues, or shows a
passenger.

## Automated validation

- 15 tests pass, including the expanded full application journey.
- The journey selects the fourth planet, checks hidden rescue state, first-visit
  block/retreat, the lead alien following jetpack flight, animated home return,
  one-time station pickup and badge increment, return visit, translator
  resolution, boarding/complete state, and no additional completion reward.
- Existing Sprout/Cinder/Frost, station, passenger, service/monkey, vortex and
  Reset/interrupted-return coverage remains green.
- Production build passes with the existing nonblocking bundle-size warning.
- Browser checks cover the real WebGL Gherkin landing/EVA alien encounter and
  post-return station supply UI with no browser errors. The final translate
  presentation and complete visual round trip remain for user playtest.

## Playtest

1. At station choose Gherkin-7. Launch, land and exit. Confirm aliens gather,
   block the mission peacefully, and Mission Control says to retreat. Jet upward
   and confirm the lead alien rises too, visibly blocking the flight route.
2. Board and Return to station. Confirm zero rescue/passenger/reward changes.
3. Collect Translator Badge at Supply stop. Confirm the badge counter increases
   by exactly one, the button disappears, and status changes to Translator
   aboard. Try Reset: it must remain collected and cannot increment again.
4. Choose Gherkin-7 again, fly back and exit. Translation should be automatic.
5. Confirm only one welcoming alien remains, the path is open, and the moon-pickle garden explanation appears.
   Board, confirm mission complete and return home.
6. Confirm rescues did not increment and resolution adds no second badge beyond
   the Translator Badge. Launch a rescue planet and check its normal flow still
   works.

RKT-56 adds the First Contact reward on top of this slice. RKT-61 remains
deferred.
