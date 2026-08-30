const modeLabel = document.querySelector('#modeName');
const planetLabel = document.querySelector('#planetName');

const rescueState = {
  progress: 0,
  located: false,
  lastMode: '',
  lastPlanet: '',
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
rescueOverlay.style.transition = 'opacity 220ms ease, transform 260ms ease, filter 220ms ease';
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
npcCharacter.textContent = '🧑‍🚀';
npcCharacter.style.fontSize = 'clamp(2.1rem, 5vw, 3.35rem)';
npcCharacter.style.lineHeight = '1';
npcCharacter.style.transformOrigin = '50% 80%';
npcBubble.appendChild(npcCharacter);

const signal = document.createElement('div');
signal.textContent = 'SOS';
signal.style.position = 'absolute';
signal.style.right = '-0.55rem';
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
npcLabel.textContent = 'Stranded explorer';
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

function isRescueVisibleMode(mode, planet) {
  return planet !== 'Launchpad' && (mode === 'Landed' || mode === 'Astronaut EVA');
}

function resetRescueProgress() {
  rescueState.progress = 0;
  rescueState.located = false;
  document.body.dataset.rescueNpcState = 'visible';
}

function updateRescueProgress(mode) {
  if (mode !== 'Astronaut EVA' || rescueState.located) return;

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
    document.body.dataset.rescueNpcState = 'located';
  }
}

function updateRescueBeacon() {
  const mode = getMode();
  const planet = getPlanet();
  const now = performance.now();
  const shouldShow = isRescueVisibleMode(mode, planet);
  const changedPlanet = rescueState.lastPlanet && planet !== rescueState.lastPlanet;
  const justLanded = rescueState.lastMode === 'In flight' && mode === 'Landed';

  if (shouldShow && (changedPlanet || justLanded || !document.body.dataset.rescueNpcState || document.body.dataset.rescueNpcState === 'hidden')) {
    resetRescueProgress();
  }

  if (!shouldShow) {
    rescueOverlay.style.opacity = '0';
    rescueOverlay.style.transform = 'translateY(12px) scale(0.92)';
    rescueOverlay.setAttribute('aria-hidden', 'true');
    document.body.dataset.rescueNpcState = 'hidden';
    rescueState.progress = 0;
    rescueState.located = false;
  } else {
    updateRescueProgress(mode);

    const found = rescueState.located || document.body.dataset.rescueNpcState === 'located';
    const pulse = 1 + Math.sin(now * 0.006) * 0.08;
    const bob = Math.sin(now * 0.004) * 5;
    const approachScale = 0.92 + rescueState.progress / 100 * 0.2;
    const opacity = mode === 'Landed' ? 0.88 : 1;

    rescueOverlay.style.opacity = `${opacity}`;
    rescueOverlay.style.transform = `translateY(${bob}px) scale(${found ? 1.14 : approachScale})`;
    rescueOverlay.setAttribute('aria-hidden', 'false');
    beaconPulse.style.transform = `translate(-50%, -50%) scale(${found ? 1.28 : pulse})`;
    beaconPulse.style.borderColor = found ? 'rgba(121, 255, 178, 0.72)' : 'rgba(104, 216, 255, 0.55)';
    beaconPulse.style.opacity = found ? '0.9' : '0.45';
    npcCharacter.style.transform = `rotate(${Math.sin(now * 0.006) * (found ? 8 : 4)}deg)`;
    signal.textContent = found ? 'FOUND' : 'SOS';
    signal.style.background = found ? 'rgba(34, 197, 94, 0.92)' : 'rgba(255, 70, 88, 0.9)';
    npcLabel.textContent = found ? 'Explorer found!' : mode === 'Landed' ? 'SOS beacon detected' : 'Stranded explorer';
    document.body.dataset.rescueNpcState = found ? 'located' : 'visible';
    document.body.dataset.rescueNpcProgress = `${Math.round(rescueState.progress)}`;
  }

  rescueState.lastMode = mode;
  rescueState.lastPlanet = planet;
  requestAnimationFrame(updateRescueBeacon);
}

requestAnimationFrame(updateRescueBeacon);
