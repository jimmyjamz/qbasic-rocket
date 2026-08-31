import test from 'node:test';
import assert from 'node:assert/strict';
import { CINDER_LEVEL, createSurfaceRun, resolveSurfaceMovement, steamPhase } from '../src/surfaceAdventureState.js';

test('steam has four seconds WAIT, six seconds GO and one second warming warning', () => {
  assert.equal(steamPhase(0).safe, false);
  assert.equal(steamPhase(3.99).safe, false);
  assert.equal(steamPhase(4).safe, true);
  assert.equal(steamPhase(4).remaining, 6);
  assert.equal(steamPhase(9.99).safe, true);
  assert.match(steamPhase(10).label, /WARMING/);
  assert.equal(steamPhase(10).remaining, 1);
  assert.equal(steamPhase(11).safe, false);
});

test('unsafe vent blocks both directions, safe vent allows crossing, no damage or trapping', () => {
  assert.equal(resolveSurfaceMovement({ x: 8.7, y: 0 }, { x: 8.9, y: 0 }, CINDER_LEVEL, false).x, 8.76);
  assert.equal(resolveSurfaceMovement({ x: 11.3, y: 0 }, { x: 11.1, y: 0 }, CINDER_LEVEL, false).x, 11.24);
  assert.equal(resolveSurfaceMovement({ x: 8.7, y: 0 }, { x: 8.9, y: 0 }, CINDER_LEVEL, true).x, 8.9);
  assert.equal(resolveSurfaceMovement({ x: 10, y: 0 }, { x: 10.1, y: 0 }, CINDER_LEVEL, false).x, 10.1);
});

for (const fps of [20, 60, 144]) test(`safe window stays open for crossing and escort at ${fps} FPS`, () => {
  const run = createSurfaceRun(CINDER_LEVEL);
  for (let i = 0; i < fps * 5; i++) run.tick(1 / fps, { x: 0, y: 0 });
  for (let i = 0; i < fps * 8; i++) run.tick(1 / fps, { x: 10, y: 0 });
  assert.equal(run.vent.safe, true);
  run.state = 'following';
  run.npc.x = 10;
  for (let i = 0; i < fps * 2; i++) run.tick(1 / fps, { x: 12, y: 0 });
  assert.equal(run.vent.safe, true);
  run.npc.x = 12;
  for (let i = 0; i < fps * 2; i++) run.tick(1 / fps, { x: 12, y: 0 });
  assert.equal(run.vent.safe, false);
  run.reset();
  assert.equal(run.vent.safe, false);
  assert.equal(run.npc.x, 21);
  assert.equal(run.state, 'visible');
});
