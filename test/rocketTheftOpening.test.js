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
  assert.equal(THEFT_LEVEL.maxX, 30);
  assert.equal(THEFT_LEVEL.ufoX, 25);
  assert.ok(THEFT_LEVEL.ufoApproachX < THEFT_LEVEL.ufoX);
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
  assert.equal(run.objective, 'FIND UFO PARTS');
  assert.equal(run.state, 'stranded');
});

test('theft level preserves side-scroller movement bounds', () => {
  const left = resolveSurfaceMovement({ x: 0, y: 0 }, { x: -99, y: 0 }, THEFT_LEVEL, false);
  const right = resolveSurfaceMovement({ x: 0, y: 0 }, { x: 99, y: 0 }, THEFT_LEVEL, false);
  assert.equal(left.x, THEFT_LEVEL.minX);
  assert.equal(right.x, THEFT_LEVEL.maxX);
});
