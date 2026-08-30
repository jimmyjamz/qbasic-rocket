const modeLabel = document.querySelector('#modeName');
const loopStatusLabel = document.querySelector('#loopStatus');
const launchButton = document.querySelector('#launchButton');
const resetButton = document.querySelector('#resetButton');

const MONKEY_LAUNCH_GAG_ENABLED = true;
const MONKEY_THROW_TARGET = 'planet'; // Future option: 'aliens'
const MONKEY_GAG_DURATION_MS = 2650;
const BANANA_THROW_TIMES_MS = [320, 780, 1240];
const BANANA_LIFETIME_MS = 1900;

let wasLaunching = false;
let gagActive = false;
let gagStartedAt = 0;
let nextThrowIndex = 0;
let animationFrame = null;
const bananas = [];

const monkeyOverlay = document.createElement('div');
monkeyOverlay.setAttribute('aria-live', 'polite');
monkeyOverlay.setAttribute('aria-hidden', 'true');
monkeyOverlay.style.position = 'fixed';
monkeyOverlay.style.left = '50%';
monkeyOverlay.style.top = 'clamp(11rem, 34vh, 20rem)';
monkeyOverlay.style.transform = 'translate(-50%, 18px) scale(0.86)';
monkeyOverlay.style.opacity = '0';
monkeyOverlay.style.pointerEvents = 'none';
monkeyOverlay.style.zIndex = '18';
monkeyOverlay.style.transition = 'opacity 180ms ease, transform 220ms ease';
monkeyOverlay.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
document.body.appendChild(monkeyOverlay);

const windowFrame = document.createElement('div');
windowFrame.style.position = 'relative';
windowFrame.style.display = 'grid';
windowFrame.style.placeItems = 'center';
windowFrame.style.width = '5.8rem';
windowFrame.style.height = '4.2rem';
windowFrame.style.borderRadius = '46% 46% 42% 42% / 55% 55% 40% 40%';
windowFrame.style.background = 'radial-gradient(circle at 45% 32%, rgba(248, 250, 252, 0.24), rgba(104, 216, 255, 0.22) 42%, rgba(10, 22, 46, 0.88) 74%)';
windowFrame.style.border = '0.18rem solid rgba(255, 70, 88, 0.95)';
windowFrame.style.boxShadow = '0 0 24px rgba(104, 216, 255, 0.28), 0 14px 34px rgba(0, 0, 0, 0.44), inset 0 0 18px rgba(255, 255, 255, 0.08)';
monkeyOverlay.appendChild(windowFrame);

const monkey = document.createElement('div');
monkey.textContent = '🐒';
monkey.style.fontSize = 'clamp(2rem, 5vw, 3.1rem)';
monkey.style.lineHeight = '1';
monkey.style.transformOrigin = '50% 85%';
monkey.style.transition = 'transform 100ms linear';
windowFrame.appendChild(monkey);

const bananaHand = document.createElement('div');
bananaHand.textContent = '🍌';
bananaHand.style.position = 'absolute';
bananaHand.style.right = '-0.6rem';
bananaHand.style.top = '0.38rem';
bananaHand.style.fontSize = '1.45rem';
bananaHand.style.opacity = '0';
bananaHand.style.transform = 'rotate(-32deg) scale(0.78)';
bananaHand.style.transition = 'opacity 120ms ease, transform 120ms ease';
windowFrame.appendChild(bananaHand);

const monkeyLabel = document.createElement('div');
monkeyLabel.textContent = 'Monkey business!';
monkeyLabel.style.position = 'absolute';
monkeyLabel.style.left = '50%';
monkeyLabel.style.bottom = '-0.32rem';
monkeyLabel.style.transform = 'translate(-50%, 100%)';
monkeyLabel.style.padding = '0.26rem 0.5rem';
monkeyLabel.style.borderRadius = '999px';
monkeyLabel.style.border = '1px solid rgba(255, 241, 166, 0.38)';
monkeyLabel.style.background = 'rgba(3, 11, 25, 0.78)';
monkeyLabel.style.color = '#fff8d3';
monkeyLabel.style.fontSize = '0.68rem';
monkeyLabel.style.fontWeight = '950';
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

function setOverlayVisible(visible) {
  monkeyOverlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
  monkeyOverlay.style.opacity = visible ? '1' : '0';
  monkeyOverlay.style.transform = visible
    ? 'translate(-50%, 0) scale(1)'
    : 'translate(-50%, 18px) scale(0.86)';
}

function startMonkeyGag(now) {
  if (!MONKEY_LAUNCH_GAG_ENABLED || gagActive) return;

  gagActive = true;
  gagStartedAt = now;
  nextThrowIndex = 0;
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
  node.style.fontSize = '1.45rem';
  node.style.pointerEvents = 'none';
  node.style.zIndex = '17';
  node.style.filter = 'drop-shadow(0 8px 10px rgba(0, 0, 0, 0.34))';
  node.style.willChange = 'transform, opacity';
  document.body.appendChild(node);

  const direction = nextThrowIndex % 2 === 0 ? -1 : 1;
  bananas.push({
    node,
    start: now,
    startX: window.innerWidth / 2 + 36,
    startY: window.innerHeight * 0.36 + 16,
    velocityX: direction * (130 + nextThrowIndex * 18),
    velocityY: -150 - nextThrowIndex * 12,
    gravity: 390,
    spin: direction * (260 + nextThrowIndex * 35)
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
    const bob = Math.sin(now * 0.018) * 4;
    const wave = Math.sin(now * 0.032) * 9;

    monkey.style.transform = `translateY(${bob}px) rotate(${wave}deg)`;
    bananaHand.style.opacity = elapsed < 1500 ? '1' : '0';
    bananaHand.style.transform = `rotate(${-32 + Math.sin(now * 0.044) * 34}deg) scale(${elapsed < 1500 ? 1.04 : 0.78})`;

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
