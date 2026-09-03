import { surfaceAdventure, THEFT_LEVEL, THEFT_SEQUENCE_SECONDS } from './surfaceAdventureState.js';

export function getDevTestStartRequest(location = window.location) {
  const params = new URLSearchParams(location.search);
  if (!params.has('testPlanet') && !params.has('testStage')) return null;

  const host = location.hostname;
  if (!['', 'localhost', '127.0.0.1', '::1'].includes(host)) return null;

  const planet = normalizeToken(params.get('testPlanet') ?? 'sneakle');
  const stage = normalizeToken(params.get('testStage') ?? 'select');

  if (!['sneakle', 'sneakle5'].includes(planet)) return null;
  if (!['select', 'ready', 'landed', 'stranded', 'ufo', 'hatch'].includes(stage)) {
    return { planet: 'sneakle', stage: 'select' };
  }

  return { planet: 'sneakle', stage };
}

export function normalizeToken(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function primeSneakleRunForStage(stage) {
  const run = surfaceAdventure.run;

  if (stage === 'stranded' || stage === 'ufo' || stage === 'hatch') {
    run.startTheft();
    run.update(THEFT_SEQUENCE_SECONDS + 0.1, { x: 1.05, y: 0 });
  }

  if (stage === 'ufo' || stage === 'hatch') {
    run.update(0.16, { x: THEFT_LEVEL.ufoApproachX + 0.05, y: 0 });
  }

  return run;
}
