const modeLabel = document.querySelector('#modeName');
const planetLabel = document.querySelector('#planetName');
const launchButton = document.querySelector('#launchButton');
const actionButton = document.querySelector('#actionButton');
const nextButton = document.querySelector('#nextButton');
const resetButton = document.querySelector('#resetButton');
const helpLabel = document.querySelector('#helpText');

const SERVICE_MS = 2450;
const WRENCH_START_MS = 680;
const HOP_BACK_MS = 1780;

let isServicing = false;
let allowLaunchThrough = false;
let serviceStartedAt = 0;
let serviceTarget = 'next planet';
let serviceAnimationFrame = null;

const serviceOverlay = document.createElement('div');
serviceOverlay.setAttribute('aria-live', 'polite');
serviceOverlay.setAttribute('aria-hidden', 'true');
serviceOverlay.style.position = 'fixed';
serviceOverlay.style.left = '50%';
serviceOverlay.style.bottom = 'clamp(7.2rem, 20vh, 13.5rem)';
serviceOverlay.style.width = 'min(22rem, calc(100vw - 1.5rem))';
serviceOverlay.style.height = '8.6rem';
serviceOverlay.style.transform = 'translateX(-50%) translateY(16px) scale(0.94)';
serviceOverlay.style.opacity = '0';
serviceOverlay.style.pointerEvents = 'none';
serviceOverlay.style.zIndex = '16';
serviceOverlay.style.transition = 'opacity 180ms ease, transform 220ms ease';
serviceOverlay.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
document.body.appendChild(serviceOverlay);

const serviceBubble = document.createElement('div');
serviceBubble.style.position = 'absolute';
serviceBubble.style.left = '50%';
serviceBubble.style.bottom = '0';
serviceBubble.style.display = 'grid';
serviceBubble.style.placeItems = 'center';
serviceBubble.style.width = '5.2rem';
serviceBubble.style.height = '5.2rem';
serviceBubble.style.borderRadius = '999px';
serviceBubble.style.background = 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.28), rgba(104,216,255,0.13) 56%, rgba(3,11,25,0.82))';
serviceBubble.style.border = '1px solid rgba(148, 232, 255, 0.44)';
serviceBubble.style.boxShadow = '0 0 24px rgba(104, 216, 255, 0.22), 0 12px 32px rgba(0, 0, 0, 0.42)';
serviceBubble.style.transform = 'translateX(-50%)';
serviceBubble.style.transition = 'left 260ms ease, bottom 180ms ease';
serviceOverlay.appendChild(serviceBubble);

const mechanic = document.createElement('div');
mechanic.textContent = '🧑‍🚀';
mechanic.style.fontSize = 'clamp(2.2rem, 5vw, 3.2rem)';
mechanic.style.lineHeight = '1';
mechanic.style.transformOrigin = '50% 80%';
serviceBubble.appendChild(mechanic);

const wrench = document.createElement('div');
wrench.textContent = '🔧';
wrench.style.position = 'absolute';
wrench.style.right = '-0.4rem';
wrench.style.top = '-0.22rem';
wrench.style.fontSize = '1.5rem';
wrench.style.opacity = '0';
wrench.style.transform = 'rotate(-25deg) scale(0.82)';
wrench.style.transition = 'opacity 120ms ease, transform 120ms ease';
serviceBubble.appendChild(wrench);

const serviceLabel = document.createElement('div');
serviceLabel.textContent = 'Rocket tune-up';
serviceLabel.style.position = 'absolute';
serviceLabel.style.left = '50%';
serviceLabel.style.bottom = '-0.3rem';
serviceLabel.style.transform = 'translate(-50%, 100%)';
serviceLabel.style.padding = '0.32rem 0.58rem';
serviceLabel.style.borderRadius = '999px';
serviceLabel.style.border = '1px solid rgba(255, 241, 166, 0.36)';
serviceLabel.style.background = 'rgba(3, 11, 25, 0.72)';
serviceLabel.style.color = '#fff8d3';
serviceLabel.style.fontSize = '0.74rem';
serviceLabel.style.fontWeight = '950';
serviceLabel.style.letterSpacing = '0.05em';
serviceLabel.style.textTransform = 'uppercase';
serviceLabel.style.whiteSpace = 'nowrap';
serviceOverlay.appendChild(serviceLabel);

function shouldServicePlanetLaunch() {
  const mode = modeLabel?.textContent?.trim() ?? '';
  const planet = planetLabel?.textContent?.trim() ?? '';
  const action = launchButton?.textContent?.trim() ?? '';

  return mode === 'Landed'
    && planet !== 'Launchpad'
    && /^Fly to\s+/i.test(action)
    && !isServicing;
}

function readTargetFromButton() {
  const action = launchButton?.textContent?.trim() ?? '';
  return action.replace(/^Fly to\s+/i, '').trim() || 'next planet';
}

function setControlsDisabled(disabled) {
  if (launchButton) launchButton.disabled = disabled;
  if (actionButton) actionButton.disabled = disabled;
  if (nextButton) nextButton.disabled = disabled;
}

function startPlanetService(event) {
  if (allowLaunchThrough || !shouldServicePlanetLaunch()) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  isServicing = true;
  serviceStartedAt = performance.now();
  serviceTarget = readTargetFromButton();
  setControlsDisabled(true);

  if (launchButton) launchButton.textContent = 'Servicing rocket...';
  if (actionButton) actionButton.textContent = 'Quick tune-up';
  if (helpLabel) {
    helpLabel.textContent = `Planet launch prep: hop out, tighten the rocket bolts, then launch to ${serviceTarget}.`;
  }

  serviceOverlay.setAttribute('aria-hidden', 'false');
  serviceOverlay.style.opacity = '1';
  serviceOverlay.style.transform = 'translateX(-50%) translateY(0) scale(1)';
  serviceAnimationFrame = requestAnimationFrame(updatePlanetService);
}

function updatePlanetService(now) {
  if (!isServicing) return;

  const elapsed = now - serviceStartedAt;
  const progress = Math.min(elapsed / SERVICE_MS, 1);
  const hop = Math.sin(Math.min(progress, 1) * Math.PI * 3) * 9;
  const wrenchWiggle = Math.sin(now * 0.034) * 24;

  if (elapsed < WRENCH_START_MS) {
    serviceBubble.style.left = '38%';
    serviceBubble.style.bottom = `${16 + Math.max(0, hop)}px`;
    mechanic.style.transform = 'rotate(-8deg) scaleX(-1)';
    wrench.style.opacity = '0.35';
    wrench.style.transform = 'rotate(-25deg) scale(0.82)';
    serviceLabel.textContent = 'Hopping out';
  } else if (elapsed < HOP_BACK_MS) {
    serviceBubble.style.left = '50%';
    serviceBubble.style.bottom = '10px';
    mechanic.style.transform = `rotate(${Math.sin(now * 0.018) * 5}deg)`;
    wrench.style.opacity = '1';
    wrench.style.transform = `rotate(${wrenchWiggle}deg) scale(1.05)`;
    serviceLabel.textContent = 'Tightening rocket bolts';
  } else {
    serviceBubble.style.left = '62%';
    serviceBubble.style.bottom = `${14 + Math.max(0, hop * 0.8)}px`;
    mechanic.style.transform = 'rotate(9deg)';
    wrench.style.opacity = '0.55';
    wrench.style.transform = 'rotate(18deg) scale(0.9)';
    serviceLabel.textContent = 'Hopping back in';
  }

  if (elapsed >= SERVICE_MS) {
    finishPlanetService();
    return;
  }

  serviceAnimationFrame = requestAnimationFrame(updatePlanetService);
}

function finishPlanetService() {
  isServicing = false;
  if (serviceAnimationFrame) cancelAnimationFrame(serviceAnimationFrame);
  serviceAnimationFrame = null;

  serviceOverlay.setAttribute('aria-hidden', 'true');
  serviceOverlay.style.opacity = '0';
  serviceOverlay.style.transform = 'translateX(-50%) translateY(16px) scale(0.94)';

  setControlsDisabled(false);
  allowLaunchThrough = true;
  launchButton?.click();
  setTimeout(() => {
    allowLaunchThrough = false;
  }, 0);
}

function abortPlanetService() {
  if (!isServicing) return;
  isServicing = false;
  if (serviceAnimationFrame) cancelAnimationFrame(serviceAnimationFrame);
  serviceAnimationFrame = null;
  serviceOverlay.setAttribute('aria-hidden', 'true');
  serviceOverlay.style.opacity = '0';
  serviceOverlay.style.transform = 'translateX(-50%) translateY(16px) scale(0.94)';
  setControlsDisabled(false);
}

if (launchButton) {
  launchButton.addEventListener('click', startPlanetService, true);
}

resetButton?.addEventListener('click', abortPlanetService);
