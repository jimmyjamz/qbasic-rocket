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
  kind: 'theft', name: 'Sneakle-5', npcLabel: 'FIND ANOTHER WAY OFF →',
  minX: -2, maxX: 24, targetX: 18, obstacleLeft: 99, obstacleRight: 100,
  obstacleHeight: 0, radius: 0.24
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
  let theftProgress = 0;
  const run = {
    level,
    get hasPickaxe() { return hasPickaxe; },
    get columnBroken() { return columnBroken; },
    get breakProgress() { return breakProgress; },
    get objective() {
      if (level.kind === 'theft') {
        if (run.state === 'stealing') return 'ROCKET THEFT!';
        if (run.state === 'stranded') return 'FIND ANOTHER WAY OFF';
        return 'SCOUT LANDING ZONE';
      }
      return columnBroken ? 'RESCUE EXPLORER' : hasPickaxe ? 'BREAK ICE COLUMN' : 'FIND PICKAXE';
    },
    get vent() { return steamPhase(ventClock); },
    get contactStage() { return contactStage; },
    get theftProgress() { return theftProgress; },
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
        theftProgress = 0;
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
      theftProgress = 0;
    },
    update(dt, player) {
      clock += dt;
      run.player = { x: player.x, y: player.y };
      if (level.kind === 'theft') {
        if (run.state === 'stealing') {
          theftProgress = Math.min(1, theftProgress + dt / THEFT_SEQUENCE_SECONDS);
          run.progress = Math.round(theftProgress * 100);
          if (theftProgress >= 1) run.state = 'stranded';
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
