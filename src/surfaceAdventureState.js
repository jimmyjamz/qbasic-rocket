// Authored local coordinates, relative to the rocket and astronaut ground height.
export const SPROUT_LEVEL = Object.freeze({
  kind: 'vines', name: 'Sprout-9', npcLabel: 'BOTANIST · SOS',
  minX: -2, maxX: 22, targetX: 19, obstacleLeft: 8, obstacleRight: 10,
  obstacleHeight: 1.5, radius: 0.24
});
export const CINDER_LEVEL = Object.freeze({
  kind: 'steam', name: 'Cinder Bean', npcLabel: 'MECHANIC · SOS',
  minX: -2, maxX: 24, targetX: 21, obstacleLeft: 9, obstacleRight: 11,
  obstacleHeight: 0, radius: 0.24
});
export const FROST_LEVEL = Object.freeze({
  kind: 'ice', name: 'Frost Pea', npcLabel: 'EXPLORER · FROZEN',
  minX: -2, maxX: 24, targetX: 21, pickaxeX: 5, obstacleLeft: 11.4,
  obstacleRight: 12.6, obstacleHeight: 3.2, radius: 0.24
});
export const CONTACT_LEVEL = Object.freeze({
  kind: 'aliens', name: 'Gherkin-7', npcLabel: 'WELCOME, FRIEND',
  minX: -2, maxX: 14, targetX: 11.5, gateX: 8.5, obstacleLeft: 2.7, obstacleRight: 3.5,
  obstacleHeight: 0, radius: 0.24
});
export const THEFT_LEVEL = Object.freeze({
  kind: 'theft', name: 'Sneakle-5', npcLabel: 'BROKEN UFO · NEEDS PARTS!',
  minX: -2, maxX: 27.5, targetX: 25, ufoX: 25, ufoApproachX: 21.7,
  hatchX: 22.2, hatchPanelX: 25.6, hatchPanelY: 1.45, hatchPanelMinY: 0.85,
  hatchPanelMaxY: 5.0, hatchPanelRadiusX: 1.05, missingPartLabel: 'WOBBLE COIL', clueX: 10.5,
  // RKT-70 uses a raised hatch diagnostic panel, not a repair part sitting on the UFO.
  // The inspection zone is forgiving so a kid-friendly hover near the blinking panel works.
  // Extended underground traversal and hard blockers remain deferred.
  obstacleLeft: 99, obstacleRight: 100, obstacleHeight: 0, radius: 0.24
});

export const THEFT_SEQUENCE_SECONDS = 4.2;
export const THEFT_BOARDING_PROGRESS = 0.58;
export const THEFT_LAUNCH_PROGRESS = 0.68;

export function steamPhase(clock) {
  const phase = clock % 11;
  if (phase < 4) return { safe: false, label: 'WAIT · STEAM', remaining: 4 - phase };
  if (phase < 10) return { safe: true, label: 'GO · COOL', remaining: 10 - phase };
  return { safe: false, label: 'WAIT · WARMING', remaining: 11 - phase };
}

export function resolveSurfaceMovement(previous, proposed, level = SPROUT_LEVEL, ventSafe = false) {
  let x = Math.max(level.minX, Math.min(level.maxX, proposed.x));
  let y = Math.max(0, proposed.y);
  const left = level.obstacleLeft - level.radius;
  const right = level.obstacleRight + level.radius;
  const overlaps = x > left && x < right;
  if (level.kind === 'aliens' && !ventSafe) x = Math.min(x, level.obstacleLeft - level.radius);
  if (level.kind === 'ice' && !ventSafe) {
    if (previous.x <= left && x > left) x = left;
    else if (previous.x >= right && x < right) x = right;
    else if (overlaps) x = previous.x <= left ? left : right;
  }
  if (level.kind === 'steam' && !ventSafe && overlaps) {
    if (previous.x <= left) x = left;
    else if (previous.x >= right) x = right;
    // An already admitted character may always leave; no damage or trapping.
  }
  if (overlaps && y < level.obstacleHeight && level.kind !== 'steam' && !(level.kind === 'ice' && ventSafe)) {
    if (previous.y >= level.obstacleHeight) y = level.obstacleHeight;
    else x = previous.x <= left ? left : right;
  }
  return { x, y, blockedX: x !== proposed.x, blockedY: y !== proposed.y };
}

export function createSurfaceRun(level = SPROUT_LEVEL) {
  let trail = [];
  let clock = 0;
  let ventClock = 0;
  let hasPickaxe = false;
  let columnBroken = false;
  let breakProgress = 0;
  let contactStage = 'blocked';
  let theftClock = 0;
  let theftProgress = 0;
  let theftBoardingProgress = 0;
  let ufoDiscovered = false;
  let ufoHatchInspected = false;
  const run = {
    level,
    get hasPickaxe() { return hasPickaxe; },
    get columnBroken() { return columnBroken; },
    get breakProgress() { return breakProgress; },
    get objective() {
      if (level.kind === 'theft') {
        if (run.state === 'stealing') return 'ROCKET THEFT!';
        if (ufoHatchInspected) return 'FIND MISSING PART';
        if (ufoDiscovered) return 'INSPECT UFO HATCH';
        if (run.state === 'stranded') return 'FIND BROKEN UFO';
        return 'SCOUT LANDING ZONE';
      }
      return columnBroken ? 'RESCUE EXPLORER' : hasPickaxe ? 'BREAK ICE COLUMN' : 'FIND PICKAXE';
    },
    get vent() { return steamPhase(ventClock); },
    get contactStage() { return contactStage; },
    get theftProgress() { return theftProgress; },
    get theftBoardingProgress() { return theftBoardingProgress; },
    get ufoDiscovered() { return ufoDiscovered; },
    get ufoHatchInspected() { return ufoHatchInspected; },
    get theftArea() { return ufoDiscovered ? 'underground' : 'surface'; },
    get canInspectUfo() {
      return level.kind === 'theft' && run.state === 'stranded' &&
        run.player.x >= (level.ufoApproachX ?? level.ufoX - 1.4) &&
        run.player.x <= level.ufoX + 1.8 &&
        run.player.y < 0.9;
    },
    get canInspectHatchPanel() {
      if (level.kind !== 'theft' || run.state !== 'stranded' || !ufoDiscovered || ufoHatchInspected) return false;
      const panelMinY = level.hatchPanelMinY ?? 0;
      const panelMaxY = level.hatchPanelMaxY ?? 5.0;
      const panelRadiusX = level.hatchPanelRadiusX ?? 1.05;
      return Math.abs(run.player.x - level.hatchPanelX) < panelRadiusX &&
        run.player.y >= panelMinY &&
        run.player.y <= panelMaxY;
    },
    get canEnterGarden() { return level.kind === 'aliens' && contactStage === 'gate' && Math.abs(run.player.x - level.gateX) < 1.6 && run.player.y < 0.75; },
    get canWelcome() { return level.kind === 'aliens' && contactStage === 'garden' && Math.abs(run.player.x - level.targetX) < 1.25 && run.player.y < 0.75; },
    prepareContact(hasTranslator, completed = false) {
      contactStage = completed ? 'welcomed' : hasTranslator ? 'gate' : 'blocked';
    },
    enterGarden() { if (run.canEnterGarden) contactStage = 'garden'; },
    welcome() { if (run.canWelcome) contactStage = 'welcomed'; },
    startTheft() {
      if (level.kind === 'theft' && run.state === 'visible') {
        run.state = 'stealing';
        theftClock = 0;
        theftProgress = 0;
        theftBoardingProgress = 0;
        ufoDiscovered = false;
        ufoHatchInspected = false;
      }
    },
    tick(dt, player) {
      if (level.kind !== 'steam') return;
      const occupied = (point) => point.x > level.obstacleLeft - level.radius + 0.001 && point.x < level.obstacleRight + level.radius - 0.001;
      const phase = ventClock % 11;
      const crossing = occupied(player) || (run.state === 'following' && occupied(run.npc));
      if (phase >= 4 && phase < 10 && phase + dt >= 10 && crossing) {
        ventClock += Math.max(0, 9.99 - phase);
      } else ventClock += dt;
    },
    state: 'visible', progress: 0, returnProgress: 0,
    player: { x: 0, y: 0 },
    npc: { x: level.targetX, y: 0 },
    reset() {
      run.state = 'visible';
      run.progress = run.returnProgress = clock = 0;
      ventClock = 0;
      run.npc = { x: level.targetX, y: 0 };
      run.player = { x: 0, y: 0 };
      trail = [];
      hasPickaxe = false;
      columnBroken = false;
      breakProgress = 0;
      contactStage = 'blocked';
      theftClock = 0;
      theftProgress = 0;
      theftBoardingProgress = 0;
      ufoDiscovered = false;
      ufoHatchInspected = false;
    },
    update(dt, player) {
      clock += dt;
      run.player = { x: player.x, y: player.y };
      if (level.kind === 'theft') {
        if (run.state === 'stealing') {
          theftClock = Math.min(THEFT_SEQUENCE_SECONDS, theftClock + dt);
          const overallProgress = theftClock / THEFT_SEQUENCE_SECONDS;
          theftBoardingProgress = Math.min(1, overallProgress / THEFT_BOARDING_PROGRESS);
          theftProgress = overallProgress < THEFT_LAUNCH_PROGRESS
            ? 0
            : Math.min(1, (overallProgress - THEFT_LAUNCH_PROGRESS) / (1 - THEFT_LAUNCH_PROGRESS));
          run.progress = Math.round(overallProgress * 100);
          if (overallProgress >= 1) run.state = 'stranded';
        } else if (run.state === 'stranded') {
          if (!ufoDiscovered) {
            run.progress = Math.max(0, Math.min(99, player.x / (level.ufoApproachX ?? level.ufoX) * 100));
            if (run.canInspectUfo) {
              ufoDiscovered = true;
              run.progress = 0;
            }
          } else if (!ufoHatchInspected) {
            const roomStart = level.ufoApproachX ?? level.hatchX ?? level.ufoX;
            run.progress = Math.max(0, Math.min(99, (player.x - roomStart) / (level.hatchPanelX - roomStart) * 100));
            if (run.canInspectHatchPanel) {
              ufoHatchInspected = true;
              run.progress = 100;
            }
          } else {
            run.progress = 100;
          }
        }
        return;
      }
      if (level.kind === 'aliens') return;
      if (level.kind === 'ice') {
        if (!hasPickaxe && Math.abs(player.x - level.pickaxeX) < 0.7 && player.y < 0.75) hasPickaxe = true;
        const atColumn = player.x >= level.obstacleLeft - level.radius - 0.35 && player.x <= level.obstacleRight + level.radius + 0.35 && player.y < 0.75;
        if (hasPickaxe && !columnBroken && atColumn) {
          breakProgress = Math.min(1, breakProgress + dt / 0.65);
          if (breakProgress >= 1) columnBroken = true;
        }
      }
      if (run.state === 'visible') {
        run.progress = Math.max(0, Math.min(99, player.x / level.targetX * 100));
        if (Math.abs(player.x - run.npc.x) < 0.85 && Math.abs(player.y) < 0.75) {
          run.state = 'following';
          run.progress = 100;
        }
      }
      if (run.state !== 'following') return;
      // Replay the actual traversed route, including jetpack travel over the vines.
      // Time-based delay keeps escort behavior independent of display frame rate.
      trail.push({ x: player.x, y: player.y, time: clock });
      while (trail.length && trail[0].time <= clock - 0.65) {
        const point = trail.shift();
        run.npc = { x: point.x, y: point.y };
      }
      run.returnProgress = Math.max(0, Math.min(99, (1 - player.x / level.targetX) * 100));
      if (Math.abs(player.x) < 1.35 && player.y <= 0.18 &&
          Math.abs(run.npc.x) < 1.35 && run.npc.y <= 0.18) {
        run.state = 'rescued';
        run.returnProgress = 100;
      }
    },
    board() { if (run.state === 'rescued') run.state = 'boarded'; }
  };
  return run;
}

// Shared bridge to the existing rescue presentation; no DOM or Three.js dependency.
export const surfaceAdventure = { enabled: false, active: false, run: createSurfaceRun(), vortex: { active: false, progress: 0, x: 0, y: 0 } };
