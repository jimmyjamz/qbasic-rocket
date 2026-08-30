const modeLabel = document.querySelector('#modeName');
const loopStatusLabel = document.querySelector('#loopStatus');
const launchButton = document.querySelector('#launchButton');
const resetButton = document.querySelector('#resetButton');

const MONKEY_LAUNCH_GAG_ENABLED = true;
const MONKEY_THROW_TARGET = 'planet'; // Future option: 'aliens'
const MONKEY_GAG_DURATION_MS = 2650;
const BANANA_THROW_TIMES_MS = [320, 780, 1240];
const BANANA_LIFETIME_MS = 1900;
const ROCKET_WINDOW_START_Y_VH = 48;
const ROCKET_WINDOW_ASCENT_Y_VH = 42;

let wasLaunching = false;
let gagActive = false;
let gagStartedAt = 0;
let nextThrowIndex = 0;
let animationFrame = null;
let lastWindowPoint = { x: window.innerWidth / 2, y: window.innerHeight * 0.48 };
const bananas = [];

const monkeyOverlay = document.createElement('div');
monkeyOverlay.setAttribute('aria-live', 'polite');
monkeyOverlay.setAttribute('aria-hidden', 'true');
monkeyOverlay.style.position = 'fixed';
monkeyOverlay.style.left = '50%';
monkeyOverlay.style.top = `${ROCKET_WINDOW_START_Y_VH}vh`;
monkeyOverlay.style.width = '3rem';
monkeyOverlay.style.height = '3rem';
monkeyOverlay.style.display = 'grid';
monkeyOverlay.style.placeItems = 'center';
monkeyOverlay.style.transform = 'translate(-50%, -50%) scale(0.62)';
monkeyOverlay.style.opacity = '0';
monkeyOverlay.style.pointerEvents = 'none';
monkeyOverlay.style.zIndex = '18';
monkeyOverlay.style.transition = 'opacity 120ms ease, transform 160ms ease';
monkeyOverlay.style.filter = 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.42))';
document.body.appendChild(monkeyOverlay);

const monkey = document.createElement('div');
monkey.textContent = '🐒';
monkey.style.fontSize = 'clamp(1.35rem, 3vw, 2.15rem)';
monkey.style.lineHeight = '1';
monkey.style.transformOrigin = '50% 85%';
monkey.style.transition = 'transform 80ms linear';
monkeyOverlay.appendChild(monkey);

const bananaHand = document.createElement('div');
bananaHand.textContent = '🍌';
bananaHand.style.position = 'absolute';
bananaHand.style.right = '-0.2rem';
bananaHand.style.top = '0.28rem';
bananaHand.style.fontSize = '1.05rem';
bananaHand.style.opacity = '0';
bananaHand.style.transform = 'rotate(-32deg) scale(0.78)';
bananaHand.style.transition = 'opacity 90ms ease, transform 90ms ease';
monkeyOverlay.appendChild(bananaHand);

const monkeyLabel = document.createElement('div');
monkeyLabel.textContent = 'Monkey business!';
monkeyLabel.style.position = 'absolute';
monkeyLabel.style.left = '50%';
monkeyLabel.style.bottom = '-0.55rem';
monkeyLabel.style.transform = 'translate(-50%, 100%)';
monkeyLabel.style.padding = '0.2rem 0.42rem';
monkeyLabel.style.borderRadius = '999px';
monkeyLabel.style.border = '1px solid rgba(255, 241, 166, 0.36)';
monkeyLabel.style.background = 'rgba(3, 11, 25, 0.72)';
monkeyLabel.style.color = '#fff8d3';
monkeyLabel.style.font = '950 0.58rem ui-sans-serif, system-ui, sans-serif';
monkeyLabel.style.letterSpacing = '0.05em';
monkeyLabel.style.textTransform = 'uppercase';
monkeyLabel.style.whiteSpace = 'nowrap';
monkeyOverlay.appendChild(monkeyLabel);

function isLaunchState() {
  const mode = modeLabel?.textContent?.trim() ?? '';
  const status = loopStatusLabel?.textContent?.trim() ?? '';
  const action = launchButton?.textContent?.trim() ?? '';

  return mode === 'Countdown'
    || mode === 'In flight'
    || status.startsWith('T-')
    || status === 'Launch!'
    || status.includes('Mouse guided flight')
    || action.startsWith('Flying to');
}

function getWindowPoint(elapsed = 0) {
  const progress = Math.min(elapsed / MONKEY_GAG_DURATION_MS, 1);
  const yVh = ROCKET_WINDOW_START_Y_VH + (ROCKET_WINDOW_ASCENT_Y_VH - ROCKET_WINDOW_START_Y_VH) * progress;
  const x = window.innerWidth / 2 + Math.sin(progress * Math.PI * 1.4) * 10;
  const y = window.innerHeight * (yVh / 100);
  return { x, y };
}

function setOverlayVisible(visible) {
  monkeyOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
  monkeyOverlay.style.opacity = visible ? '1' : '0';
}

function startMonkeyGag(now) {
  if (!MONKEY_LAUNCH_GAG_ENABLED || gagActive) return;

  gagActive = true;
  gagStartedAt = now;
  nextThrowIndex = 0;
  lastWindowPoint = getWindowPoint(0);
  setOverlayVisible(true);
  monkeyLabel.textContent = MONKEY_THROW_TARGET === 'aliens' ? 'Alien snack attack!' : 'Monkey business!';
}

function finishMonkeyGag() {
  gagActive = false;
  setOverlayVisible(false);
  bananaHand.style.opacity = '0';
}

function createBanana(now) {
  const node = document.createElement('div');
  node.textContent = '🍌';
  node.setAttribute('aria-hidden', 'true');
  node.style.position = 'fixed';
  node.style.left = '0';
  node.style.top = '0';
  node.style.fontSize = '1.18rem';
  node.style.pointerEvents = 'none';
  node.style.zIndex = '17';
  node.style.filter = 'drop-shadow(0 8px 10px rgba(0, 0, 0, 0.34))';
  node.style.willChange = 'transform, opacity';
  document.body.appendChild(node);

  const direction = nextThrowIndex % 2 === 0 ? -1 : 1;
  bananas.push({
    node,
    start: now,
    startX: lastWindowPoint.x + direction * 14,
    startY: lastWindowPoint.y + 4,
    velocityX: direction * (150 + nextThrowIndex * 18),
    velocityY: -110 - nextThrowIndex * 12,
    gravity: 410,
    spin: direction * (290 + nextThrowIndex * 35)
  });
}

function updateBananas(now) {
  for (let index = bananas.length - 1; index >= 0; index -= 1) {
    const banana = bananas[index];
    const elapsed = now - banana.start;
    const seconds = elapsed / 1000;
    const x = banana.startX + banana.velocityX * seconds;
    const y = banana.startY + banana.velocityY * seconds + 0.5 * banana.gravity * seconds * seconds;
    const opacity = Math.max(0, 1 - elapsed / BANANA_LIFETIME_MS);
    const scale = 1 + Math.sin(seconds * Math.PI * 3) * 0.08;

    banana.node.style.transform = `translate(${x}px, ${y}px) rotate(${banana.spin * seconds}deg) scale(${scale})`;
    banana.node.style.opacity = `${opacity}`;

    if (elapsed >= BANANA_LIFETIME_MS) {
      banana.node.remove();
      bananas.splice(index, 1);
    }
  }
}

function clearBananas() {
  while (bananas.length > 0) {
    bananas.pop().node.remove();
  }
}

function updateMonkeyGag(now) {
  if (!MONKEY_LAUNCH_GAG_ENABLED) {
    finishMonkeyGag();
    clearBananas();
    return;
  }

  const launching = isLaunchState();
  if (launching && !wasLaunching) {
    startMonkeyGag(now);
  }
  wasLaunching = launching;

  if (gagActive) {
    const elapsed = now - gagStartedAt;
    const bob = Math.sin(now * 0.018) * 2.4;
    const wave = Math.sin(now * 0.034) * 9;
    const point = getWindowPoint(elapsed);
    lastWindowPoint = point;

    monkeyOverlay.style.left = `${point.x}px`;
    monkeyOverlay.style.top = `${point.y}px`;
    monkeyOverlay.style.transform = `translate(-50%, -50%) translateY(${bob}px) scale(0.72)`;
    monkey.style.transform = `rotate(${wave}deg)`;
    bananaHand.style.opacity = elapsed < 1500 ? '1' : '0';
    bananaHand.style.transform = `rotate(${-32 + Math.sin(now * 0.044) * 34}deg) scale(${elapsed < 1500 ? 1 : 0.78})`;

    while (nextThrowIndex < BANANA_THROW_TIMES_MS.length && elapsed >= BANANA_THROW_TIMES_MS[nextThrowIndex]) {
      createBanana(now);
      nextThrowIndex += 1;
    }

    if (elapsed >= MONKEY_GAG_DURATION_MS || !launching) {
      finishMonkeyGag();
    }
  }

  updateBananas(now);
  animationFrame = requestAnimationFrame(updateMonkeyGag);
}

function resetMonkeyGag() {
  finishMonkeyGag();
  clearBananas();
  wasLaunching = false;
}

resetButton?.addEventListener('click', resetMonkeyGag);
animationFrame = requestAnimationFrame(updateMonkeyGag);
