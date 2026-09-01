# RKT-56 — First Contact Friend badge reward

Completing the peaceful Gherkin-7 encounter now earns a distinct First Contact
Friend badge. The Translator Badge still increments the session badge counter
when collected. On the return trip the player must walk to the moon-pickle gate,
press E to use the translator, enter the cleared garden, approach the remaining
alien, and press E to exchange a welcome. Returning to the rocket and boarding
then completes the mission and adds exactly one more badge.

The completion is visible in three places:

- the contact card changes to “Mission complete — First Contact Friend!”;
- the mission summary confirms peaceful contact and the earned badge;
- the station badge wall names the First Contact Friend badge after returning.

The reward is session-only and protected from duplicate increments. It does not
change rescue totals, create a passenger, or affect existing Space Hero rewards.

## Validation

1. Complete the first Gherkin visit and collect the Translator Badge at station.
   Confirm the badge counter increases once.
2. Return to Gherkin, exit, and follow the crowd-lined path to the moon-pickle
   gate. Press E and confirm the gate opens and the crowd clears.
3. Approach the single garden keeper and press E. Confirm the translated welcome,
   then return left to the rocket.
4. Board the rocket. Confirm the mission-complete card and summary appear and the
   badge counter increases exactly once more.
5. Return to station. Confirm the badge wall says First Contact Friend earned.
6. Revisit/reset as available and confirm the reward never duplicates. Rescue
   totals and passenger indicators must remain unchanged.
