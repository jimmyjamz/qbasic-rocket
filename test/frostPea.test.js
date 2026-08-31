import test from 'node:test';
import assert from 'node:assert/strict';
import { FROST_LEVEL, createSurfaceRun, resolveSurfaceMovement } from '../src/surfaceAdventureState.js';

test('Frost requires pickaxe and a short break action before passing its ice column', () => {
  const run = createSurfaceRun(FROST_LEVEL);
  const left = FROST_LEVEL.obstacleLeft - FROST_LEVEL.radius;
  let result = resolveSurfaceMovement({ x: left - 1, y: 0 }, { x: 13, y: 0 }, FROST_LEVEL, run.columnBroken);
  assert.equal(result.x, left);
  run.update(0.1, { x: 5, y: 0 });
  assert.equal(run.hasPickaxe, true);
  assert.equal(run.objective, 'BREAK ICE COLUMN');
  run.update(0.3, { x: left, y: 0 });
  assert.equal(run.columnBroken, false);
  run.update(0.4, { x: left, y: 0 });
  assert.equal(run.columnBroken, true);
  result = resolveSurfaceMovement({ x: left, y: 0 }, { x: 13, y: 0 }, FROST_LEVEL, run.columnBroken);
  assert.equal(result.x, 13);
});

test('Frost reset restores its local item, column, target and route', () => {
  const run = createSurfaceRun(FROST_LEVEL);
  run.update(0.1, { x: 5, y: 0 });
  run.update(0.7, { x: FROST_LEVEL.obstacleLeft, y: 0 });
  run.update(0.1, { x: FROST_LEVEL.targetX, y: 0 });
  assert.equal(run.state, 'following');
  run.reset();
  assert.equal(run.hasPickaxe, false);
  assert.equal(run.columnBroken, false);
  assert.equal(run.breakProgress, 0);
  assert.equal(run.objective, 'FIND PICKAXE');
  assert.deepEqual(run.npc, { x: FROST_LEVEL.targetX, y: 0 });
  assert.equal(run.state, 'visible');
});

test('ice movement response is slower than normal walking response', () => {
  const step = (velocity, direction, dt, response) => velocity + (direction * 2.6 - velocity) * (1 - Math.exp(-response * dt));
  let iceVelocity = 0;
  let normalVelocity = 0;
  for (let i = 0; i < 10; i++) {
    iceVelocity = step(iceVelocity, 1, 0.05, 2.8);
    normalVelocity = step(normalVelocity, 1, 0.05, 12);
  }
  assert.ok(iceVelocity < normalVelocity, 'ice accelerates gently');
  const coasting = step(iceVelocity, 0, 0.05, 1.55);
  const normalStop = step(normalVelocity, 0, 0.05, 12);
  assert.ok(coasting > normalStop, 'ice keeps a visible skid after release');
});
