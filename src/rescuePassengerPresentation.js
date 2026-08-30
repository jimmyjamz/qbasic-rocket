const modeLabel = document.querySelector('#modeName');
const planetLabel = document.querySelector('#planetName');

let passengerAboard = false;
let passengerRole = 'Explorer';
let passengerEmoji = '🧑‍🚀';

const passengerCard = document.createElement('div');
passengerCard.setAttribute('aria-live', 'polite');
passengerCard.setAttribute('aria-hidden', 'true');
passengerCard.style.position = 'fixed';
passengerCard.style.left = 'clamp(0.75rem, 2vw, 1.4rem)';
passengerCard.style.bottom = 'clamp(0.75rem, 2vw, 1.4rem)';
passengerCard.style.zIndex = '13';
passengerCard.style.pointerEvents = 'none';
passengerCard.style.display = 'flex';
passengerCard.style.alignItems = 'center';
passengerCard.style.gap = '0.55rem';
passengerCard.style.padding = '0.55rem 0.7rem';
passengerCard.style.borderRadius = '999px';
passengerCard.style.border = '1px solid rgba(121, 255, 178, 0.34)';
passengerCard.style.background = 'linear-gradient(135deg, rgba(6, 20, 32, 0.86), rgba(18, 42, 40, 0.76))';
passengerCard.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.34), 0 0 20px rgba(121, 255, 178, 0.12)';
passengerCard.style.backdropFilter = 'blur(10px)';
passengerCard.style.color = '#eafff0';
passengerCard.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
passengerCard.style.opacity = '0';
passengerCard.style.transform = 'translateY(10px) scale(0.96)';
passengerCard.style.transition = 'opacity 220ms ease, transform 260ms ease';
document.body.appendChild(passengerCard);

const passengerEmojiEl = document.createElement('div');
passengerEmojiEl.textContent = passengerEmoji;
passengerEmojiEl.style.fontSize = '1.55rem';
passengerEmojiEl.style.lineHeight = '1';
passengerCard.appendChild(passengerEmojiEl);

const passengerCopy = document.createElement('div');
passengerCopy.style.display = 'grid';
passengerCopy.style.gap = '0.05rem';
passengerCard.appendChild(passengerCopy);

const passengerTitle = document.createElement('div');
passengerTitle.textContent = 'Passenger aboard';
passengerTitle.style.fontSize = '0.68rem';
passengerTitle.style.fontWeight = '1000';
passengerTitle.style.letterSpacing = '0.08em';
passengerTitle.style.textTransform = 'uppercase';
passengerTitle.style.color = '#79ffb2';
passengerCopy.appendChild(passengerTitle);

const passengerDetail = document.createElement('div');
passengerDetail.textContent = passengerRole;
passengerDetail.style.fontSize = '0.82rem';
passengerDetail.style.fontWeight = '850';
passengerDetail.style.color = '#f0fff6';
passengerCopy.appendChild(passengerDetail);

function getMode() {
  return modeLabel?.textContent?.trim() ?? '';
}

function getPlanet() {
  return planetLabel?.textContent?.trim() ?? '';
}

function refreshPassengerData() {
  const rescueState = document.body.dataset.rescueNpcState ?? 'hidden';
  const role = document.body.dataset.rescueNpcRole;
  const emoji = document.body.dataset.rescueNpcEmoji;

  if (role) passengerRole = role;
  if (emoji) passengerEmoji = emoji;

  if (rescueState === 'boarded') {
    passengerAboard = true;
  }

  if (rescueState === 'visible' || getPlanet() === 'Launchpad') {
    passengerAboard = false;
  }
}

function renderPassengerCard() {
  refreshPassengerData();

  const mode = getMode();
  const planet = getPlanet();
  const show = passengerAboard && planet !== 'Launchpad' && mode !== 'Astronaut EVA';

  passengerEmojiEl.textContent = passengerEmoji;
  passengerDetail.textContent = passengerRole;
  passengerCard.setAttribute('aria-hidden', show ? 'false' : 'true');
  passengerCard.style.opacity = show ? '1' : '0';
  passengerCard.style.transform = show ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)';
}

const observer = new MutationObserver(renderPassengerCard);
observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-rescue-npc-state', 'data-rescue-npc-role', 'data-rescue-npc-emoji']
});

[modeLabel, planetLabel].forEach((label) => {
  if (!label) return;
  const labelObserver = new MutationObserver(renderPassengerCard);
  labelObserver.observe(label, { childList: true, characterData: true, subtree: true });
});

renderPassengerCard();
