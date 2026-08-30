const modeLabel = document.querySelector('#modeName');
const planetLabel = document.querySelector('#planetName');

const RESCUE_PROFILES = {
  'Sprout-9': {
    role: 'Lost botanist',
    emoji: '🧑‍🌾',
    signal: 'SEED SOS',
    found: 'Botanist found!',
    following: 'Botanist following!',
    safe: 'Botanist safe!',
    landed: 'Lost botanist beacon detected',
    eva: 'Lost botanist'
  },
  'Cinder Bean': {
    role: 'Heat-shield mechanic',
    emoji: '🧑‍🔧',
    signal: 'HEAT SOS',
    found: 'Mechanic found!',
    following: 'Mechanic following!',
    safe: 'Mechanic safe!',
    landed: 'Heat-shield mechanic detected',
    eva: 'Heat-shield mechanic'
  },
  'Frost Pea': {
    role: 'Frozen explorer',
    emoji: '🥶',
    signal: 'ICE SOS',
    found: 'Explorer thawed!',
    following: 'Explorer following!',
    safe: 'Explorer safe!',
    landed: 'Frozen explorer beacon detected',
    eva: 'Frozen explorer'
  }
};

const DEFAULT_PROFILE = {
  role: 'Stranded explorer',
  emoji: '🧑‍🚀',
  signal: 'SOS',
  found: 'Explorer found!',
  following: 'Following you!',
  safe: 'Explorer safe!',
  landed: 'SOS beacon detected',
  eva: 'Stranded explorer'
};

const rescueState = {
  progress: 0,
  returnProgress: 0,
  located: false,
  rescued: false,
  boarded: false,
  lastMode: '',
  lastPlanet: '',
  lastCheckpointResetToken: '',
  keys: new Set()
};

const rescueOverlay = document.createElement('div');
rescueOverlay.id = 'rescueNpcBeacon';
rescueOverlay.setAttribute('aria-live', 'polite');
rescueOverlay.style.position = 'fixed';
rescueOverlay.style.right = 'clamp(5.5rem, 18vw, 18rem)';
rescueOverlay.style.bottom = 'clamp(8.5rem, 24vh, 16rem)';
rescueOverlay.style.zIndex = '10';
rescueOverlay.style.pointerEvents = 'none';
rescueOverlay.style.textAlign = 'center';
rescueOverlay.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
rescueOverlay.style.transition = 'right 420ms ease, opacity 220ms ease, transform 260ms ease, filter 220ms ease';
rescueOverlay.style.opacity = '0';
rescueOverlay.style.transform = 'translateY(12px) scale(0.92)';
rescueOverlay.style.filter = 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.45))';
document.body.appendChild(rescueOverlay);

const beaconPulse = document.createElement('div');
beaconPulse.style.position = 'absolute';
beaconPulse.style.left = '50%';
beaconPulse.style.top = '42%';
beaconPulse.style.width = '5.6rem';
beaconPulse.style.height = '5.6rem';
beaconPulse.style.border = '2px solid rgba(104, 216, 255, 0.55)';
beaconPulse.style.borderRadius = '999px';
beaconPulse.style.transform = 'translate(-50%, -50%) scale(1)';
beaconPulse.style.opacity = '0.7';
rescueOverlay.appendChild(beaconPulse);

const npcBubble = document.createElement('div');
npcBubble.style.position = 'relative';
npcBubble.style.display = 'grid';
npcBubble.style.placeItems = 'center';
npcBubble.style.width = '5.25rem';
npcBubble.style.height = '5.25rem';
npcBubble.style.margin = '0 auto';
npcBubble.style.borderRadius = '999px';
npcBubble.style.background = 'radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.22), rgba(104, 216, 255, 0.08) 58%, rgba(3, 11, 25, 0.78))';
npcBubble.style.border = '1px solid rgba(148, 232, 255, 0.44)';
npcBubble.style.boxShadow = '0 0 24px rgba(104, 216, 255, 0.26), inset 0 0 20px rgba(255, 255, 255, 0.08)';
rescueOverlay.appendChild(npcBubble);

const npcCharacter = document.createElement('div');
npcCharacter.textContent = DEFAULT_PROFILE.emoji;
npcCharacter.style.fontSize = 'clamp(2.1rem, 5vw, 3.35rem)';
npcCharacter.style.lineHeight = '1';
npcCharacter.style.transformOrigin = '50% 80%';
npcBubble.appendChild(npcCharacter);

const followIndicator = document.createElement('div');
followIndicator.textContent = '↩';
followIndicator.style.position = 'absolute';
followIndicator.style.left = '-0.7rem';
followIndicator.style.bottom = '-0.35rem';
followIndicator.style.display = 'none';
followIndicator.style.width = '1.55rem';
followIndicator.style.height = '1.55rem';
followIndicator.style.borderRadius = '999px';
followIndicator.style.background = 'rgba(34, 197, 94, 0.92)';
followIndicator.style.color = '#ffffff';
followIndicator.style.fontSize = '1rem';
followIndicator.style.fontWeight = '1000';
followIndicator.style.lineHeight = '1.55rem';
npcBubble.appendChild(followIndicator);

const signal = document.createElement('div');
signal.textContent = DEFAULT_PROFILE.signal;
signal.style.position = 'absolute';
signal.style.right = '-0.85rem';
signal.style.top = '-0.25rem';
signal.style.padding = '0.18rem 0.34rem';
signal.style.borderRadius = '999px';
signal.style.background = 'rgba(255, 70, 88, 0.9)';
signal.style.color = '#ffffff';
signal.style.fontSize = '0.6rem';
signal.style.fontWeight = '1000';
signal.style.letterSpacing = '0.06em';
npcBubble.appendChild(signal);

const npcLabel = document.createElement('div');
npcLabel.textContent = DEFAULT_PROFILE.eva;
npcLabel.style.marginTop = '0.45rem';
npcLabel.style.padding = '0.34rem 0.58rem';
npcLabel.style.borderRadius = '999px';
npcLabel.style.background = 'rgba(3, 11, 25, 0.72)';
npcLabel.style.border = '1px solid rgba(148, 232, 255, 0.35)';
npcLabel.style.color = '#eafcff';
npcLabel.style.fontSize = 'clamp(0.66rem, 1.25vw, 0.82rem)';
npcLabel.style.fontWeight = '900';
npcLabel.style.letterSpacing = '0.04em';
npcLabel.style.textTransform = 'uppercase';
npcLabel.style.whiteSpace = 'nowrap';
rescueOverlay.appendChild(npcLabel);

const returnMeter = document.createElement('div');
returnMeter.style.width = '8rem';
returnMeter.style.maxWidth = '36vw';
returnMeter.style.height = '0.46rem';
returnMeter.style.margin = '0.45rem auto 0';
returnMeter.style.border = '1px solid rgba(148, 232, 255, 0.32)';
returnMeter.style.borderRadius = '999px';
returnMeter.style.background = 'rgba(255, 255, 255, 0.08)';
returnMeter.style.overflow = 'hidden';
returnMeter.style.display = 'none';
rescueOverlay.appendChild(returnMeter);

const returnMeterFill = document.createElement('div');
returnMeterFill.style.height = '100%';
returnMeterFill.style.width = '0%';
returnMeterFill.style.borderRadius = '999px';
returnMeterFill.style.background = 'linear-gradient(90deg, #68d8ff, #79ffb2)';
returnMeterFill.style.transition = 'width 120ms linear';
returnMeter.appendChild(returnMeterFill);

window.addEventListener('keydown', (event) => {
  rescueState.keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  rescueState.keys.delete(event.code);
});

function getMode() {
  return modeLabel?.textContent?.trim() ?? '';
}

function getPlanet() {
  return planetLabel?.textContent?.trim() ?? '';
}

function getProfile(planet = getPlanet()) {
  return RESCUE_PROFILES[planet] ?? DEFAULT_PROFILE;
}

function publishRescueProfile(planet = getPlanet()) {
  const profile = getProfile(planet);
  document.body.dataset.rescueNpcPlanet = planet;
  document.body.dataset.rescueNpcRole = profile.role;
  document.body.dataset.rescueNpcEmoji = profile.emoji;
  return profile;
}

function isRescueVisibleMode(mode, planet) {
  return planet !== 'Launchpad' && (mode === 'Landed' || mode === 'Astronaut EVA');
}

function resetRescueProgress() {
  rescueState.progress = 0;
  rescueState.returnProgress = 0;
  rescueState.located = false;
  rescueState.rescued = false;
  rescueState.boarded = false;
  publishRescueProfile();
  document.body.dataset.rescueNpcState = 'visible';
  document.body.dataset.rescueNpcProgress = '0';
  document.body.dataset.rescueNpcReturnProgress = '0';
}

function hideRescueProgress() {
  rescueState.progress = 0;
  rescueState.returnProgress = 0;
  rescueState.located = false;
  rescueState.rescued = false;
  rescueState.boarded = false;
  document.body.dataset.rescueNpcState = 'hidden';
  document.body.dataset.rescueNpcProgress = '0';
  document.body.dataset.rescueNpcReturnProgress = '0';
}

function applyCheckpointReset(planet = getPlanet()) {
  rescueState.progress = 0;
  rescueState.returnProgress = 0;
  rescueState.located = false;
  rescueState.rescued = false;
  rescueState.boarded = false;
  publishRescueProfile(planet);
  document.body.dataset.rescueNpcState = 'hidden';
  document.body.dataset.rescueNpcProgress = '0';
  document.body.dataset.rescueNpcReturnProgress = '0';
  renderHiddenOverlay();
}

function consumeCheckpointReset(planet = getPlanet()) {
  const token = document.body.dataset.rescueNpcCheckpointReset ?? '';
  if (!token || token === rescueState.lastCheckpointResetToken) return false;

  rescueState.lastCheckpointResetToken = token;
  applyCheckpointReset(planet);
  return true;
}

function boardRescuedExplorer() {
  rescueState.progress = 100;
  rescueState.returnProgress = 100;
  rescueState.located = true;
  rescueState.rescued = true;
  rescueState.boarded = true;
  publishRescueProfile();
  document.body.dataset.rescueNpcState = 'boarded';
  document.body.dataset.rescueNpcProgress = '100';
  document.body.dataset.rescueNpcReturnProgress = '100';
}

function updateFindProgress(mode) {
  if (mode !== 'Astronaut EVA' || rescueState.located || rescueState.rescued || rescueState.boarded) return;

  const movingTowardBeacon = rescueState.keys.has('KeyD') || rescueState.keys.has('ArrowRight');
  const movingAwayFromBeacon = rescueState.keys.has('KeyA') || rescueState.keys.has('ArrowLeft');
  const jetpacking = rescueState.keys.has('Space');

  if (movingTowardBeacon) {
    rescueState.progress += jetpacking ? 1.8 : 1.25;
  } else if (movingAwayFromBeacon) {
    rescueState.progress -= 0.85;
  } else {
    rescueState.progress -= 0.12;
  }

  rescueState.progress = Math.max(0, Math.min(100, rescueState.progress));

  if (rescueState.progress >= 100) {
    rescueState.located = true;
    rescueState.returnProgress = 0;
  }
}

function updateReturnProgress(mode) {
  if (mode !== 'Astronaut EVA' || !rescueState.located || rescueState.rescued || rescueState.boarded) return;

  const movingTowardRocket = rescueState.keys.has('KeyA') || rescueState.keys.has('ArrowLeft');
  const movingAwayFromRocket = rescueState.keys.has('KeyD') || rescueState.keys.has('ArrowRight');
  const jetpacking = rescueState.keys.has('Space');

  if (movingTowardRocket) {
    rescueState.returnProgress += jetpacking ? 1.55 : 1.25;
  } else if (movingAwayFromRocket) {
    rescueState.returnProgress -= 0.65;
  } else {
    rescueState.returnProgress -= 0.06;
  }

  rescueState.returnProgress = Math.max(0, Math.min(100, rescueState.returnProgress));

  if (rescueState.returnProgress >= 100) {
    rescueState.rescued = true;
  }
}

function getDatasetState() {
  if (rescueState.boarded) return 'boarded';
  if (rescueState.rescued) return 'rescued';
  if (rescueState.located) return 'following';
  return 'visible';
}

function renderHiddenOverlay() {
  rescueOverlay.style.opacity = '0';
  rescueOverlay.style.transform = 'translateY(12px) scale(0.92)';
  rescueOverlay.setAttribute('aria-hidden', 'true');
  followIndicator.style.display = 'none';
  returnMeter.style.display = 'none';
}

function updateRescueBeacon() {
  const mode = getMode();
  const planet = getPlanet();
  const now = performance.now();
  const shouldShow = isRescueVisibleMode(mode, planet);
  const changedPlanet = rescueState.lastPlanet && planet !== rescueState.lastPlanet;
  const justLanded = rescueState.lastMode === 'In flight' && mode === 'Landed';
  const justBoardedAfterRescue = rescueState.lastMode === 'Astronaut EVA' && mode === 'Landed' && rescueState.rescued;
  const profile = publishRescueProfile(planet);
  const checkpointResetConsumed = consumeCheckpointReset(planet);

  if (!checkpointResetConsumed && justBoardedAfterRescue) {
    boardRescuedExplorer();
  }

  if (shouldShow && !rescueState.boarded && (checkpointResetConsumed || changedPlanet || justLanded || !document.body.dataset.rescueNpcState || document.body.dataset.rescueNpcState === 'hidden')) {
    resetRescueProgress();
  }

  if (!shouldShow) {
    renderHiddenOverlay();
    hideRescueProgress();
  } else if (rescueState.boarded) {
    renderHiddenOverlay();
    document.body.dataset.rescueNpcState = 'boarded';
    document.body.dataset.rescueNpcProgress = '100';
    document.body.dataset.rescueNpcReturnProgress = '100';
  } else {
    updateFindProgress(mode);
    updateReturnProgress(mode);

    const datasetState = getDatasetState();
    const following = datasetState === 'following';
    const rescued = datasetState === 'rescued';
    const pulse = 1 + Math.sin(now * 0.006) * 0.08;
    const bob = Math.sin(now * 0.004) * 5;
    const approachScale = 0.92 + rescueState.progress / 100 * 0.2;
    const returnScale = 1.06 + Math.sin(now * 0.008) * 0.035;
    const opacity = mode === 'Landed' ? 0.88 : 1;
    const preferredRight = following || rescued ? 18 + rescueState.returnProgress * 0.3 : 18;

    rescueOverlay.style.right = `clamp(5.5rem, ${preferredRight}vw, 31rem)`;
    rescueOverlay.style.opacity = `${opacity}`;
    rescueOverlay.style.transform = `translateY(${bob}px) scale(${rescued ? 1.18 : following ? returnScale : approachScale})`;
    rescueOverlay.setAttribute('aria-hidden', 'false');
    beaconPulse.style.transform = `translate(-50%, -50%) scale(${rescued ? 1.46 : following ? 1.34 : pulse})`;
    beaconPulse.style.borderColor = rescued
      ? 'rgba(255, 241, 166, 0.86)'
      : following
        ? 'rgba(121, 255, 178, 0.72)'
        : 'rgba(104, 216, 255, 0.55)';
    beaconPulse.style.opacity = rescued ? '1' : following ? '0.9' : '0.45';
    npcCharacter.textContent = profile.emoji;
    npcCharacter.style.transform = `rotate(${Math.sin(now * 0.006) * (following || rescued ? 8 : 4)}deg)`;
    followIndicator.style.display = following || rescued ? 'block' : 'none';
    signal.textContent = rescued ? 'SAFE' : following ? 'FOUND' : profile.signal;
    signal.style.background = rescued
      ? 'rgba(255, 177, 66, 0.94)'
      : following
        ? 'rgba(34, 197, 94, 0.92)'
        : 'rgba(255, 70, 88, 0.9)';
    npcLabel.textContent = rescued
      ? `${profile.safe} Board the rocket.`
      : following
        ? profile.following
        : mode === 'Landed'
          ? profile.landed
          : profile.eva;
    returnMeter.style.display = following || rescued ? 'block' : 'none';
    returnMeterFill.style.width = rescued ? '100%' : `${Math.round(rescueState.returnProgress)}%`;
    document.body.dataset.rescueNpcState = datasetState;
    document.body.dataset.rescueNpcProgress = `${Math.round(rescueState.progress)}`;
    document.body.dataset.rescueNpcReturnProgress = `${Math.round(rescueState.returnProgress)}`;
  }

  rescueState.lastMode = mode;
  rescueState.lastPlanet = planet;
  requestAnimationFrame(updateRescueBeacon);
}

requestAnimationFrame(updateRescueBeacon);
