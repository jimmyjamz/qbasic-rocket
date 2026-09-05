import test from 'node:test';
import assert from 'node:assert/strict';
import {
  THEFT_LEVEL,
  THEFT_SEQUENCE_SECONDS,
  createSurfaceRun,
  resolveSurfaceMovement
} from '../src/surfaceAdventureState.js';

function completeWobbleCoilRepair() {
  const run = createSurfaceRun(THEFT_LEVEL);
  run.startTheft();
  run.update(THEFT_SEQUENCE_SECONDS, { x: 1, y: 0 });
  run.update(0.16, { x: THEFT_LEVEL.ufoApproachX + 0.05, y: 0 });
  run.update(0.16, {
    x: THEFT_LEVEL.hatchPanelX + THEFT_LEVEL.hatchPanelRadiusX - 0.08,
    y: THEFT_LEVEL.ufoBodyHeight + 0.1
  });

  const shelfLanding = resolveSurfaceMovement(
    { x: THEFT_LEVEL.wobbleCoilX, y: THEFT_LEVEL.wobbleCoilY + 0.5 },
    { x: THEFT_LEVEL.wobbleCoilX, y: THEFT_LEVEL.wobbleCoilY - 0.2 },
    THEFT_LEVEL,
    false
  );
  run.update(0.16, shelfLanding);
  run.update(0.16, { x: THEFT_LEVEL.hatchX + 0.1, y: 0 });

  assert.equal(run.wobbleCoilInstalled, true);
  assert.equal(run.objective, 'FIND BACKPACK');
  return run;
}

test('Sneakle trade coordinates keep backpack and alien away from the UFO repair hatch', () => {
  assert.ok(THEFT_LEVEL.backpackX < THEFT_LEVEL.wobbleCoilX);
  assert.ok(THEFT_LEVEL.tradeAlienX > THEFT_LEVEL.wobbleCoilX);
  assert.ok(THEFT_LEVEL.tradeAlienX < THEFT_LEVEL.ufoApproachX);
  assert.ok(THEFT_LEVEL.backpackRadius > 0.5);
  assert.ok(THEFT_LEVEL.tradeAlienRadius > 0.8);
});

test('Sneakle backpack becomes the next objective only after the Wobble Coil is installed', () => {
  const run = completeWobbleCoilRepair();

  run.update(0.16, { x: THEFT_LEVEL.backpackX + THEFT_LEVEL.backpackRadius + 0.4, y: 0 });
  assert.equal(run.backpackRecovered, false);
  assert.equal(run.hasCheetos, false);
  assert.equal(run.objective, 'FIND BACKPACK');

  run.update(0.16, { x: THEFT_LEVEL.backpackX, y: 0 });
  assert.equal(run.backpackRecovered, true);
  assert.equal(run.hasCheetos, true);
  assert.equal(run.objective, 'TRADE CHEETOS');
});

test('Sneakle weird alien trades Cheetos for Icky Sticky Slime and Flux Capacitor', () => {
  const run = completeWobbleCoilRepair();
  run.update(0.16, { x: THEFT_LEVEL.backpackX, y: 0 });
  assert.equal(run.objective, 'TRADE CHEETOS');

  run.update(0.16, { x: THEFT_LEVEL.tradeAlienX - THEFT_LEVEL.tradeAlienRadius - 0.25, y: 0 });
  assert.equal(run.cheetosTraded, false);
  assert.equal(run.stickySlimeReceived, false);
  assert.equal(run.fluxCapacitorCollected, false);

  run.update(0.16, { x: THEFT_LEVEL.tradeAlienX, y: 0 });
  assert.equal(run.cheetosTraded, true);
  assert.equal(run.hasCheetos, false);
  assert.equal(run.stickySlimeReceived, true);
  assert.equal(run.fluxCapacitorCollected, true);
  assert.equal(run.objective, 'FLUX CAPACITOR FOUND');
  assert.equal(run.state, 'stranded');
});
