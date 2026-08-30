let completionHideTimeout = null;
let hasCelebratedCurrentRescue = false;

const completionOverlay = document.createElement('div');
completionOverlay.setAttribute('aria-live', 'polite');
completionOverlay.setAttribute('aria-hidden', 'true');
completionOverlay.style.position = 'fixed';
completionOverlay.style.left = '50%';
completionOverlay.style.top = '18vh';
completionOverlay.style.transform = 'translate(-50%, -18px) scale(0.92)';
completionOverlay.style.opacity = '0';
completionOverlay.style.pointerEvents = 'none';
completionOverlay.style.zIndex = '24';
completionOverlay.style.width = 'min(32rem, calc(100vw - 2rem))';
completionOverlay.style.padding = '1rem 1.15rem';
completionOverlay.style.borderRadius = '1.4rem';
completionOverlay.style.border = '1px solid rgba(255, 241, 166, 0.45)';
completionOverlay.style.background = 'linear-gradient(135deg, rgba(18, 28, 57, 0.94), rgba(38, 24, 66, 0.82))';
completionOverlay.style.boxShadow = '0 24px 70px rgba(0, 0, 0, 0.42), 0 0 38px rgba(255, 241, 166, 0.2), inset 0 0 28px rgba(255, 255, 255, 0.06)';
completionOverlay.style.backdropFilter = 'blur(12px)';
completionOverlay.style.color = '#fffbe8';
completionOverlay.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
completionOverlay.style.textAlign = 'center';
completionOverlay.style.transition = 'opacity 220ms ease, transform 300ms cubic-bezier(0.2, 0.9, 0.2, 1)';
document.body.appendChild(completionOverlay);

const sparkleRow = document.createElement('div');
sparkleRow.textContent = '✨ 🚀 ✨';
sparkleRow.style.fontSize = 'clamp(1.4rem, 4vw, 2.4rem)';
sparkleRow.style.lineHeight = '1';
completionOverlay.appendChild(sparkleRow);

const completionTitle = document.createElement('div');
completionTitle.textContent = 'Rescue Complete!';
completionTitle.style.marginTop = '0.45rem';
completionTitle.style.fontSize = 'clamp(1.45rem, 4.8vw, 2.65rem)';
completionTitle.style.fontWeight = '1000';
completionTitle.style.letterSpacing = '0.03em';
completionOverlay.appendChild(completionTitle);

const completionCopy = document.createElement('div');
completionCopy.textContent = 'The stranded explorer is safe. Return to the rocket and keep the planet loop going.';
completionCopy.style.margin = '0.45rem auto 0';
completionCopy.style.maxWidth = '25rem';
completionCopy.style.color = '#fdf4c6';
completionCopy.style.fontSize = 'clamp(0.86rem, 1.65vw, 1rem)';
completionCopy.style.lineHeight = '1.4';
completionOverlay.appendChild(completionCopy);

const rewardBadge = document.createElement('div');
rewardBadge.textContent = '+1 SPACE HERO BADGE';
rewardBadge.style.display = 'inline-block';
rewardBadge.style.marginTop = '0.75rem';
rewardBadge.style.padding = '0.34rem 0.7rem';
rewardBadge.style.borderRadius = '999px';
rewardBadge.style.background = 'rgba(255, 241, 166, 0.16)';
rewardBadge.style.border = '1px solid rgba(255, 241, 166, 0.34)';
rewardBadge.style.color = '#fff7bf';
rewardBadge.style.fontSize = '0.72rem';
rewardBadge.style.fontWeight = '1000';
rewardBadge.style.letterSpacing = '0.12em';
completionOverlay.appendChild(rewardBadge);

function showCompletionOverlay() {
  completionOverlay.setAttribute('aria-hidden', 'false');
  completionOverlay.style.opacity = '1';
  completionOverlay.style.transform = 'translate(-50%, 0) scale(1)';

  if (completionHideTimeout) {
    window.clearTimeout(completionHideTimeout);
  }

  completionHideTimeout = window.setTimeout(() => {
    completionOverlay.style.opacity = '0';
    completionOverlay.style.transform = 'translate(-50%, -18px) scale(0.92)';
    completionOverlay.setAttribute('aria-hidden', 'true');
  }, 5200);
}

function updateCompletionPresentation() {
  const rescueState = document.body.dataset.rescueNpcState ?? 'hidden';

  if (rescueState === 'rescued') {
    if (!hasCelebratedCurrentRescue) {
      hasCelebratedCurrentRescue = true;
      showCompletionOverlay();
    }
    return;
  }

  hasCelebratedCurrentRescue = false;
}

const observer = new MutationObserver(updateCompletionPresentation);
observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-rescue-npc-state']
});

updateCompletionPresentation();
