const SESSION_REWARD_STATE = {
  rescues: 0,
  badges: 0,
  countedCurrentRescue: false
};

const rewardsCard = document.createElement('div');
rewardsCard.setAttribute('aria-live', 'polite');
rewardsCard.style.position = 'fixed';
rewardsCard.style.left = 'clamp(0.75rem, 2vw, 1.4rem)';
rewardsCard.style.top = 'clamp(0.75rem, 2vw, 1.4rem)';
rewardsCard.style.zIndex = '14';
rewardsCard.style.pointerEvents = 'none';
rewardsCard.style.display = 'flex';
rewardsCard.style.alignItems = 'center';
rewardsCard.style.gap = '0.45rem';
rewardsCard.style.padding = '0.48rem 0.65rem';
rewardsCard.style.borderRadius = '999px';
rewardsCard.style.border = '1px solid rgba(255, 241, 166, 0.34)';
rewardsCard.style.background = 'linear-gradient(135deg, rgba(22, 18, 42, 0.88), rgba(43, 34, 18, 0.76))';
rewardsCard.style.boxShadow = '0 14px 34px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 241, 166, 0.11)';
rewardsCard.style.backdropFilter = 'blur(10px)';
rewardsCard.style.color = '#fff8d3';
rewardsCard.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
rewardsCard.style.transition = 'transform 180ms ease';
document.body.appendChild(rewardsCard);

const rewardsIcon = document.createElement('div');
rewardsIcon.textContent = '🏅';
rewardsIcon.style.fontSize = '1.25rem';
rewardsIcon.style.lineHeight = '1';
rewardsCard.appendChild(rewardsIcon);

const rewardsText = document.createElement('div');
rewardsText.style.fontSize = '0.76rem';
rewardsText.style.fontWeight = '950';
rewardsText.style.letterSpacing = '0.035em';
rewardsText.style.whiteSpace = 'nowrap';
rewardsCard.appendChild(rewardsText);

function renderRewards() {
  rewardsText.textContent = `Rescues: ${SESSION_REWARD_STATE.rescues}  •  Badges: ${SESSION_REWARD_STATE.badges}`;
}

function updateRewardsFromRescueState() {
  const rescueState = document.body.dataset.rescueNpcState ?? 'hidden';

  if ((rescueState === 'rescued' || rescueState === 'boarded') && !SESSION_REWARD_STATE.countedCurrentRescue) {
    SESSION_REWARD_STATE.rescues += 1;
    SESSION_REWARD_STATE.badges += 1;
    SESSION_REWARD_STATE.countedCurrentRescue = true;
    rewardsCard.style.transform = 'scale(1.08)';
    window.setTimeout(() => {
      rewardsCard.style.transform = 'scale(1)';
    }, 220);
  }

  if (rescueState === 'visible' || rescueState === 'hidden') {
    SESSION_REWARD_STATE.countedCurrentRescue = false;
  }

  renderRewards();
}

const observer = new MutationObserver(updateRewardsFromRescueState);
observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-rescue-npc-state']
});

renderRewards();
updateRewardsFromRescueState();
