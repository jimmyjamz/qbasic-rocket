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
  assert.equal(run.objective, 'INSPECT UFO HATCH');
  assert.equal(run.state, 'stranded');
});

test('hatch diagnostic panel stays near the visible hatch area but is raised for a jetpack hop', () => {
  assert.ok(THEFT_LEVEL.hatchX < THEFT_LEVEL.ufoX);
  assert.equal(THEFT_LEVEL.obstacleHeight, 0);
  assert.ok(THEFT_LEVEL.obstacleLeft > THEFT_LEVEL.maxX);
  assert.ok(THEFT_LEVEL.hatchPanelX > THEFT_LEVEL.ufoApproachX);
  assert.ok(THEFT_LEVEL.hatchPanelX < THEFT_LEVEL.ufoX + 2.5);
  assert.ok(THEFT_LEVEL.hatchPanelX <= 27.2);
  assert.ok(THEFT_LEVEL.maxX < 30);
  assert.ok(THEFT_LEVEL.hatchPanelMinY > 0.75);
  assert.ok(THEFT_LEVEL.hatchPanelY > THEFT_LEVEL.hatchPanelMinY);
  assert.ok(THEFT_LEVEL.hatchPanelMaxY > THEFT_LEVEL.hatchPanelY);
  assert.ok(THEFT_LEVEL.hatchPanelRadiusX > 0.65);
  assert.ok(THEFT_LEVEL.ufoBodyLeft < THEFT_LEVEL.ufoX);
  assert.ok(THEFT_LEVEL.ufoBodyRight > THEFT_LEVEL.ufoX);
  assert.ok(THEFT_LEVEL.ufoBodyHeight > 0.9);
  assert.ok(THEFT_LEVEL.wobbleCoilX < THEFT_LEVEL.ufoApproachX - 5);
  assert.ok(THEFT_LEVEL.wobbleCoilX > THEFT_LEVEL.minX);
  assert.ok(THEFT_LEVEL.wobbleCoilPlatformXs.length >= 5);
});

test('nearby hatch-area diagnostic panel requires a small jetpack hop to inspect', () => {
  const run = createSurfaceRun(THEFT_LEVEL);
  run.startTheft();
  run.update(THEFT_SEQUENCE_SECONDS, { x: 1, y: 0 });
  run.update(0.16, { x: THEFT_LEVEL.ufoApproachX + 0.05, y: 0 });
  assert.equal(run.ufoDiscovered, true);
  assert.equal(run.ufoHatchInspected, false);
  assert.equal(run.objective, 'INSPECT UFO HATCH');

  const groundIntoUfo = resolveSurfaceMovement(
    { x: THEFT_LEVEL.ufoBodyLeft - THEFT_LEVEL.radius - 0.1, y: 0 },
    { x: THEFT_LEVEL.hatchPanelX - 0.05, y: 0 },
    THEFT_LEVEL,
    false
  );
  assert.equal(groundIntoUfo.blockedX, true);
  assert.ok(groundIntoUfo.x <= THEFT_LEVEL.ufoBodyLeft);

  run.update(0.16, { x: THEFT_LEVEL.hatchPanelX, y: 0 });
  assert.equal(run.ufoHatchInspected, false);
  assert.equal(run.objective, 'INSPECT UFO HATCH');

  const jetpackOverUfo = resolveSurfaceMovement(
    { x: THEFT_LEVEL.ufoBodyLeft - THEFT_LEVEL.radius - 0.1, y: THEFT_LEVEL.ufoBodyHeight + 0.1 },
    { x: THEFT_LEVEL.hatchPanelX - 0.05, y: THEFT_LEVEL.ufoBodyHeight + 0.1 },
    THEFT_LEVEL,
    false
  );
  assert.equal(jetpackOverUfo.blockedX, false);

  run.update(0.16, { x: THEFT_LEVEL.hatchPanelX + THEFT_LEVEL.hatchPanelRadiusX - 0.08, y: THEFT_LEVEL.ufoBodyHeight + 0.1 });
  assert.equal(run.ufoHatchInspected, true);
  assert.equal(run.objective, 'FIND MISSING PART');
  assert.equal(run.state, 'stranded');
});

test('Sneakle Wobble Coil requires an elevated scrap-route pickup before hatch install', () => {
  const run = createSurfaceRun(THEFT_LEVEL);
  run.startTheft();
  run.update(THEFT_SEQUENCE_SECONDS, { x: 1, y: 0 });
  run.update(0.16, { x: THEFT_LEVEL.ufoApproachX + 0.05, y: 0 });
  assert.equal(run.ufoDiscovered, true);
  assert.equal(run.objective, 'INSPECT UFO HATCH');

  run.update(0.16, { x: THEFT_LEVEL.wobbleCoilX, y: THEFT_LEVEL.wobbleCoilY });
  assert.equal(run.wobbleCoilCollected, false);
  assert.equal(run.objective, 'INSPECT UFO HATCH');

  run.update(0.16, { x: THEFT_LEVEL.hatchPanelX + THEFT_LEVEL.hatchPanelRadiusX - 0.08, y: THEFT_LEVEL.ufoBodyHeight + 0.1 });
  assert.equal(run.ufoHatchInspected, true);
  assert.equal(run.objective, 'FIND MISSING PART');

  run.update(0.16, { x: THEFT_LEVEL.wobbleCoilX, y: 0 });
  assert.equal(run.wobbleCoilCollected, false);
  assert.equal(run.objective, 'FIND MISSING PART');

  run.update(0.16, { x: THEFT_LEVEL.wobbleCoilX, y: THEFT_LEVEL.wobbleCoilY });
  assert.equal(run.wobbleCoilCollected, true);
  assert.equal(run.wobbleCoilInstalled, false);
  assert.equal(run.objective, 'RETURN TO UFO');

  run.update(0.16, { x: THEFT_LEVEL.hatchX + 0.1, y: 0 });
  assert.equal(run.wobbleCoilInstalled, true);
  assert.equal(run.objective, 'WOBBLE COIL INSTALLED');
  assert.equal(run.state, 'stranded');
});

test('Sneakle scrap steps catch descending astronaut as one-way platforms', () => {
  const platformIndex = THEFT_LEVEL.wobbleCoilPlatformXs.length - 1;
  const platformX = THEFT_LEVEL.wobbleCoilPlatformXs[platformIndex];
  const platformY = THEFT_LEVEL.wobbleCoilPlatformStartY + platformIndex * THEFT_LEVEL.wobbleCoilPlatformStepY;

  const landing = resolveSurfaceMovement(
    { x: platformX, y: platformY + 0.5 },
    { x: platformX, y: platformY - 0.2 },
    THEFT_LEVEL,
    false
  );
  assert.ok(Math.abs(landing.y - platformY) < 0.0001);
  assert.equal(landing.blockedY, true);

  const miss = resolveSurfaceMovement(
    { x: platformX + 2.4, y: platformY + 0.5 },
    { x: platformX + 2.4, y: platformY - 0.2 },
    THEFT_LEVEL,
    false
  );
  assert.ok(miss.y < platformY);
});

test('theft level preserves side-scroller movement bounds', () => {
  const left = resolveSurfaceMovement({ x: 0, y: 0 }, { x: -99, y: 0 }, THEFT_LEVEL, false);
  const right = resolveSurfaceMovement({ x: 0, y: 0 }, { x: 99, y: 0 }, THEFT_LEVEL, false);
  assert.equal(left.x, THEFT_LEVEL.minX);
  assert.equal(right.x, THEFT_LEVEL.maxX);
});
