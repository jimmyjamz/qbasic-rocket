# RKT-54 — Friendly First Contact vertical slice

Gherkin-7 is a fourth, purple-and-lime destination separate from the three rescue
levels. On the first visit, a lively alien group surrounds the rocket. They block
the garden route without combat. Mission Control explains that their signals may
be warnings and directs the astronaut back aboard.

After boarding, Return to station uses the established animated flight. The
station supply stop then exposes one Collect Translator Badge action. This is a
single mission flag, not a general inventory: it cannot duplicate, does not alter
rescue rewards, and persists only for the browser session.

Returning to Gherkin-7 changes the encounter. Exit, use the translator, and the
aliens explain: “Welcome! Please avoid our moon-pickle garden.” They spread out,
wave and allow peaceful completion. Boarding changes the mission to complete and
enables station return. RKT-54 grants no First Contact reward; RKT-56 owns that.

Reset remains an immediate station return and preserves current session mission
progress, consistent with badges and the existing hub. Reload starts a fresh
session. Gherkin never publishes a rescue target, increments rescues/badges, or
shows a passenger.

## Automated validation

- 15 tests pass, including the expanded full application journey.
- The journey selects the fourth planet, checks hidden rescue state, first-visit
  block/retreat, animated home return, one-time station pickup, return visit,
  translator resolution, boarding/complete state, and unchanged badge count.
- Existing Sprout/Cinder/Frost, station, passenger, service/monkey, vortex and
  Reset/interrupted-return coverage remains green.
- Production build passes with the existing nonblocking bundle-size warning.
- Browser checks cover the real WebGL Gherkin landing/EVA alien encounter and
  post-return station supply UI with no browser errors. The final translate
  presentation and complete visual round trip remain for user playtest.

## Playtest

1. At station choose Gherkin-7. Launch, land and exit. Confirm aliens gather,
   block the mission peacefully, and Mission Control says to retreat.
2. Board and Return to station. Confirm zero rescue/passenger/reward changes.
3. Collect Translator Badge at Supply stop. The button disappears and status
   changes to Translator aboard. Try Reset: it must remain collected.
4. Choose Gherkin-7 again, fly back and exit. Use Translator Badge.
5. Confirm aliens spread out/wave and the moon-pickle garden explanation appears.
   Board, confirm mission complete and return home.
6. Confirm rescues and Space Hero badges did not increment. Launch a rescue
   planet and check its normal flow still works.

Next: RKT-56 adds the First Contact reward. RKT-61 remains deferred.
