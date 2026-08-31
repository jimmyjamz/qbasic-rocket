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
  if (level.kind === 'steam' && !ventSafe && overlaps) {
    if (previous.x <= left) x = left;
    else if (previous.x >= right) x = right;
    // An already admitted character may always leave; no damage or trapping.
  }
  if (overlaps && y < level.obstacleHeight) {
    if (previous.y >= level.obstacleHeight) y = level.obstacleHeight;
    else x = previous.x <= left ? left : right;
  }
  return { x, y, blockedX: x !== proposed.x, blockedY: y !== proposed.y };
}

export function createSurfaceRun(level = SPROUT_LEVEL) {
  let trail = [];
  let clock = 0;
  let ventClock = 0;
  const run = {
    level,
    get vent() { return steamPhase(ventClock); },
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
    npc: { x: level.targetX, y: 0 },
    reset() {
      run.state = 'visible';
      run.progress = run.returnProgress = clock = 0;
      ventClock = 0;
      run.npc = { x: level.targetX, y: 0 };
      trail = [];
    },
    update(dt, player) {
      clock += dt;
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
