import test from 'node:test';
import assert from 'node:assert/strict';
import { createSurfaceRun, resolveSurfaceMovement } from '../src/surfaceAdventureState.js';

test('vine wall blocks both directions, supports landing, and allows jetpack traversal', () => {
  assert.equal(resolveSurfaceMovement({ x: 7.7, y: 0 }, { x: 7.9, y: 0 }).x, 7.76);
  assert.equal(resolveSurfaceMovement({ x: 10.3, y: 0 }, { x: 10.1, y: 0 }).x, 10.24);
  assert.equal(resolveSurfaceMovement({ x: 9, y: 1.6 }, { x: 9, y: 1.4 }).y, 1.5);
  assert.equal(resolveSurfaceMovement({ x: 7.7, y: 2 }, { x: 8, y: 2 }).x, 8);
  assert.equal(resolveSurfaceMovement({ x: 10.3, y: 2 }, { x: 10, y: 2 }).x, 10);
});

test('walking against the wall cannot find the botanist, even after a long wait', () => {
  const run = createSurfaceRun();
  for (let i = 0; i < 3600; i++) run.update(1 / 60, { x: 7.76, y: 0 });
  assert.equal(run.state, 'visible');
  run.update(1 / 60, { x: 19, y: 4 });
  assert.equal(run.state, 'visible', 'must approach the NPC vertically too');
});

for (const fps of [20, 60, 144]) {
  test(`escort replays the obstacle route and completes only at the rocket (${fps} fps)`, () => {
    const run = createSurfaceRun();
    run.update(1 / fps, { x: 19, y: 0 });
    assert.equal(run.state, 'following');
    run.board();
    assert.equal(run.state, 'following', 'cannot board an unfinished rescue');
    for (let i = 0; i < fps * 10; i++) {
      const x = Math.max(0, 19 - i / fps * 2);
      const y = x > 7 && x < 11 ? 2 : 0;
      run.update(1 / fps, { x, y });
      if (run.npc.x > 8 && run.npc.x < 10) assert.equal(run.npc.y, 2, 'escort must not walk through vines');
      if (x > 1.35) assert.notEqual(run.state, 'rescued');
    }
    for (let i = 0; i < fps; i++) run.update(1 / fps, { x: 0, y: 0 });
    assert.equal(run.state, 'rescued');
    assert.equal(run.returnProgress, 100);
    run.board();
    assert.equal(run.state, 'boarded');
    run.update(1, { x: 19, y: 0 });
    assert.equal(run.state, 'boarded', 'completion survives re-exiting without duplicating the reward');
    run.reset();
    assert.equal(run.state, 'visible');
    assert.deepEqual(run.npc, { x: 19, y: 0 });
    assert.equal(run.progress, 0);
    assert.equal(run.returnProgress, 0);
  });
}

test('return requires both astronaut and escort on the ground; reset discards old trail', () => {
  const run = createSurfaceRun();
  run.update(0.05, { x: 19, y: 0 });
  run.update(0.05, { x: 0, y: 0 });
  assert.equal(run.state, 'following');
  for (let i = 0; i < 30; i++) run.update(0.05, { x: 0, y: 2 });
  assert.equal(run.state, 'following');
  run.reset();
  run.update(1, { x: 0, y: 0 });
  assert.equal(run.state, 'visible');
  assert.deepEqual(run.npc, { x: 19, y: 0 });
});
