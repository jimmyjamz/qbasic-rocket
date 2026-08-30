const loopStatusLabel = document.querySelector('#loopStatus');

const countdownOverlay = document.createElement('div');
countdownOverlay.setAttribute('aria-live', 'polite');
countdownOverlay.setAttribute('aria-hidden', 'true');
countdownOverlay.style.position = 'fixed';
countdownOverlay.style.inset = '0';
countdownOverlay.style.display = 'flex';
countdownOverlay.style.alignItems = 'center';
countdownOverlay.style.justifyContent = 'center';
countdownOverlay.style.pointerEvents = 'none';
countdownOverlay.style.zIndex = '20';
countdownOverlay.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
countdownOverlay.style.fontWeight = '900';
countdownOverlay.style.letterSpacing = '0.08em';
countdownOverlay.style.textTransform = 'uppercase';
countdownOverlay.style.opacity = '0';
countdownOverlay.style.transform = 'scale(0.85)';
countdownOverlay.style.transition = 'opacity 180ms ease, transform 360ms cubic-bezier(0.2, 0.9, 0.2, 1), color 240ms ease, text-shadow 240ms ease';
countdownOverlay.style.textAlign = 'center';
countdownOverlay.style.padding = '1rem';
countdownOverlay.style.color = '#f8fafc';
document.body.appendChild(countdownOverlay);

const countdownStyles = {
  'T-3': {
    text: '3',
    size: 'clamp(6rem, 22vw, 15rem)',
    scale: '1.18',
    color: '#ff2f2f',
    shadow: '0 0 24px rgba(255, 47, 47, 0.9), 0 0 72px rgba(255, 47, 47, 0.58)'
  },
  'T-2': {
    text: '2',
    size: 'clamp(5rem, 17vw, 11rem)',
    scale: '1.06',
    color: '#ff8a2d',
    shadow: '0 0 20px rgba(255, 138, 45, 0.82), 0 0 52px rgba(255, 138, 45, 0.42)'
  },
  'T-1': {
    text: '1',
    size: 'clamp(4rem, 12vw, 8rem)',
    scale: '0.98',
    color: '#fff1a6',
    shadow: '0 0 16px rgba(255, 241, 166, 0.74), 0 0 34px rgba(255, 241, 166, 0.32)'
  },
  'Launch!': {
    text: 'Launch!',
    size: 'clamp(2.4rem, 7vw, 5rem)',
    scale: '0.92',
    color: '#f8fafc',
    shadow: '0 0 14px rgba(104, 216, 255, 0.7), 0 0 26px rgba(104, 216, 255, 0.28)'
  }
};

function updateCountdownOverlay() {
  if (!loopStatusLabel) return;

  const statusText = loopStatusLabel.textContent?.trim() ?? '';
  const style = countdownStyles[statusText];

  if (!style) {
    countdownOverlay.style.opacity = '0';
    countdownOverlay.style.transform = 'scale(0.82)';
    countdownOverlay.setAttribute('aria-hidden', 'true');
    return;
  }

  countdownOverlay.textContent = style.text;
  countdownOverlay.style.fontSize = style.size;
  countdownOverlay.style.color = style.color;
  countdownOverlay.style.textShadow = style.shadow;
  countdownOverlay.style.opacity = '1';
  countdownOverlay.style.transform = `scale(${style.scale})`;
  countdownOverlay.setAttribute('aria-hidden', 'false');
}

if (loopStatusLabel) {
  const observer = new MutationObserver(updateCountdownOverlay);
  observer.observe(loopStatusLabel, { childList: true, characterData: true, subtree: true });
  updateCountdownOverlay();
}
