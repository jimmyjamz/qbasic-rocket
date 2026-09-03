import test from 'node:test';
import assert from 'node:assert/strict';
import { getDevTestStartRequest, primeSneakleRunForStage } from '../src/devTestStart.js';
import { surfaceAdventure, THEFT_LEVEL, createSurfaceRun } from '../src/surfaceAdventureState.js';

test('dev test-start URL accepts local Sneakle hatch shortcut', () => {
  const request = getDevTestStartRequest(new URL('http://localhost:5173/?testPlanet=sneakle&testStage=hatch'));
  assert.deepEqual(request, { planet: 'sneakle', stage: 'hatch' });
});

test('dev test-start URL is ignored on non-local hosts', () => {
  const request = getDevTestStartRequest(new URL('https://example.com/?testPlanet=sneakle&testStage=hatch'));
  assert.equal(request, null);
});

test('dev Sneakle hatch stage primes theft run to UFO inspection objective', () => {
  surfaceAdventure.run = createSurfaceRun(THEFT_LEVEL);
  const run = primeSneakleRunForStage('hatch');

  assert.equal(run.level.kind, 'theft');
  assert.equal(run.state, 'stranded');
  assert.equal(run.ufoDiscovered, true);
  assert.equal(run.ufoHatchInspected, false);
  assert.equal(run.objective, 'INSPECT UFO HATCH');
});
