# RKT-56 — First Contact Friend badge reward

Completing the peaceful Gherkin-7 encounter now earns a distinct First Contact
Friend badge. The Translator Badge still increments the session badge counter
when collected; returning with it, receiving the alien welcome, and boarding the
rocket completes the mission and adds exactly one more badge.

The completion is visible in three places:

- the contact card changes to “Mission complete — First Contact Friend!”;
- the mission summary confirms peaceful contact and the earned badge;
- the station badge wall names the First Contact Friend badge after returning.

The reward is session-only and protected from duplicate increments. It does not
change rescue totals, create a passenger, or affect existing Space Hero rewards.

## Validation

1. Complete the first Gherkin visit and collect the Translator Badge at station.
   Confirm the badge counter increases once.
2. Return to Gherkin, exit, and confirm the single alien welcomes you.
3. Board the rocket. Confirm the mission-complete card and summary appear and the
   badge counter increases exactly once more.
4. Return to station. Confirm the badge wall says First Contact Friend earned.
5. Revisit/reset as available and confirm the reward never duplicates. Rescue
   totals and passenger indicators must remain unchanged.
