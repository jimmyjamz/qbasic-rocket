import test from 'node:test';
import assert from 'node:assert/strict';
import {
  THEFT_LEVEL,
  THEFT_BOARDING_PROGRESS,
  THEFT_LAUNCH_PROGRESS,
  THEFT_SEQUENCE_SECONDS,
  createSurfaceRun,
  resolveSurfaceMovement
} from '../src/surfaceAdventureState.js';

test('Sneakle is a normal surface level, not a sidecar planet', () => {
  assert.equal(THEFT_LEVEL.name, 'Sneakle-5');
  assert.equal(THEFT_LEVEL.kind, 'theft');
  assert.equal(THEFT_LEVEL.maxX, 27.5);
  assert.equal(THEFT_LEVEL.ufoX, 25);
  assert.equal(THEFT_LEVEL.ufoApproachX, 21.7);
  assert.ok(THEFT_BOARDING_PROGRESS < THEFT_LAUNCH_PROGRESS);
});

test('rocket theft starts after surface exit and strands the astronaut without combat state', () => {
  const run = createSurfaceRun(THEFT_LEVEL);
  assert.equal(run.state, 'visible');
  assert.equal(run.objective, 'SCOUT LANDING ZONE');
  run.startTheft();
  assert.equal(run.state, 'stealing');
  assert.equal(run.objective, 'ROCKET THEFT!');
  run.update(THEFT_SEQUENCE_SECONDS * THEFT_BOARDING_PROGRESS, { x: 1, y: 0 });
  assert.equal(run.state, 'stealing');
  assert.equal(run.theftProgress, 0);
  assert.ok(run.theftBoardingProgress >= 1);
  run.update(THEFT_SEQUENCE_SECONDS, { x: 1, y: 0 });
  assert.equal(run.state, 'stranded');
  assert.equal(run.objective, 'FIND BROKEN UFO');
  assert.doesNotMatch([THEFT_LEVEL.kind, run.state, run.objective].join(' '), /combat|weapon|damage|life/i);
});

test('thief crew should disappear into the rocket when launch-away begins', () => {
  const run = createSurfaceRun(THEFT_LEVEL);
  run.startTheft();
  run.update(THEFT_SEQUENCE_SECONDS * THEFT_BOARDING_PROGRESS, { x: 1, y: 0 });
  assert.equal(run.theftProgress, 0);
  assert.equal(run.theftBoardingProgress, 1);
  assert.equal(run.state === 'stealing' && run.theftProgress <= 0.001, true);

  run.update(THEFT_SEQUENCE_SECONDS * (THEFT_LAUNCH_PROGRESS - THEFT_BOARDING_PROGRESS + 0.03), { x: 1, y: 0 });
  assert.ok(run.theftProgress > 0);
  assert.equal(run.state === 'stealing' && run.theftProgress <= 0.001, false);
});

test('stranded Sneakle traversal discovers the broken UFO from the left-side approach point', () => {
  const run = createSurfaceRun(THEFT_LEVEL);
  run.startTheft();
  run.update(THEFT_SEQUENCE_SECONDS, { x: 1, y: 0 });
  assert.equal(run.state, 'stranded');
  assert.equal(run.objective, 'FIND BROKEN UFO');
  assert.equal(run.ufoDiscovered, false);

  run.update(0.16, { x: THEFT_LEVEL.ufoApproachX - 0.2, y: 0 });
  assert.equal(run.ufoDiscovered, false);
  assert.equal(run.objective, 'FIND BROKEN UFO');

  run.update(0.16, { x: THEFT_LEVEL.ufoApproachX + 0.05, y: 0 });
  assert.equal(run.ufoDiscovered, true);
  assert.equal(run.objective, 'FIND UFO PART');
  assert.equal(run.state, 'stranded');
});

test('first UFO part stays near the visible hatch area until extended traversal is rebuilt', () => {
  assert.ok(THEFT_LEVEL.hatchX < THEFT_LEVEL.ufoX);
  assert.equal(THEFT_LEVEL.obstacleHeight, 0);
  assert.ok(THEFT_LEVEL.obstacleLeft > THEFT_LEVEL.maxX);
  assert.ok(THEFT_LEVEL.partX > THEFT_LEVEL.ufoApproachX);
  assert.ok(THEFT_LEVEL.partX < THEFT_LEVEL.ufoX + 2.5);
  assert.ok(THEFT_LEVEL.partX <= 27.2);
  assert.ok(THEFT_LEVEL.maxX < 30);
});

test('nearby hatch-area UFO part can be collected without extended rightward traversal', () => {
  const run = createSurfaceRun(THEFT_LEVEL);
  run.startTheft();
  run.update(THEFT_SEQUENCE_SECONDS, { x: 1, y: 0 });
  run.update(0.16, { x: THEFT_LEVEL.ufoApproachX + 0.05, y: 0 });
  assert.equal(run.ufoDiscovered, true);
  assert.equal(run.ufoPartCollected, false);
  assert.equal(run.objective, 'FIND UFO PART');

  const clearEntrance = resolveSurfaceMovement(
    { x: THEFT_LEVEL.ufoX - 0.25, y: 0 },
    { x: THEFT_LEVEL.partX - 0.45, y: 0 },
    THEFT_LEVEL,
    false
  );
  assert.equal(clearEntrance.blockedX, false);
  assert.ok(clearEntrance.x > THEFT_LEVEL.ufoX - 0.25);

  run.update(0.16, { x: THEFT_LEVEL.partX + 0.05, y: 0 });
  assert.equal(run.ufoPartCollected, true);
  assert.equal(run.objective, 'UFO PART FOUND');
  assert.equal(run.state, 'stranded');
});

test('theft level preserves side-scroller movement bounds', () => {
  const left = resolveSurfaceMovement({ x: 0, y: 0 }, { x: -99, y: 0 }, THEFT_LEVEL, false);
  const right = resolveSurfaceMovement({ x: 0, y: 0 }, { x: 99, y: 0 }, THEFT_LEVEL, false);
  assert.equal(left.x, THEFT_LEVEL.minX);
  assert.equal(right.x, THEFT_LEVEL.maxX);
});
