import test from 'node:test';
import assert from 'node:assert/strict';
import {
  THEFT_PLANET,
  ROCKET_THEFT_STATES,
  createRocketTheftRun,
  isRocketUnavailable,
  rocketTheftMissionCopy
} from '../src/rocketTheftOpeningState.js';

test('rocket theft opening uses a distinct mischievous planet', () => {
  assert.equal(THEFT_PLANET.name, 'Sneakle-5');
  assert.equal(THEFT_PLANET.props, 'mischief');
  assert.match(THEFT_PLANET.tagline, /suspicious parking/i);
});

test('rocket theft state moves from selected to stranded without combat state', () => {
  const run = createRocketTheftRun();
  assert.equal(run.state, ROCKET_THEFT_STATES.IDLE);
  run.select();
  assert.equal(run.state, ROCKET_THEFT_STATES.SELECTED);
  run.launch();
  assert.equal(run.state, ROCKET_THEFT_STATES.FLYING);
  run.land();
  assert.equal(run.state, ROCKET_THEFT_STATES.LANDED);
  run.steal();
  assert.equal(run.state, ROCKET_THEFT_STATES.STEALING);
  assert.equal(isRocketUnavailable(run.state), true);
  run.strand();
  assert.equal(run.state, ROCKET_THEFT_STATES.STRANDED);
  assert.equal(isRocketUnavailable(run.state), true);
  assert.doesNotMatch(Object.values(ROCKET_THEFT_STATES).join(' '), /combat|weapon|damage|life/i);
  run.reset();
  assert.equal(run.state, ROCKET_THEFT_STATES.IDLE);
});

test('stranded mission copy directs exploration instead of fighting', () => {
  const stealing = rocketTheftMissionCopy(ROCKET_THEFT_STATES.STEALING);
  assert.match(stealing.objective, /find another way off/i);
  const stranded = rocketTheftMissionCopy(ROCKET_THEFT_STATES.STRANDED);
  assert.match(stranded.objective, /explore/i);
  assert.match(stranded.objective, /no fighting/i);
});
