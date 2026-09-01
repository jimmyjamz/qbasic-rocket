const modeLabel = document.querySelector('#modeName');
const launchButton = document.querySelector('#launchButton');

let lastKnownRole = 'Explorer';
let lastKnownPlanet = 'Planet';
let summaryVisible = false;

const summaryCard = document.createElement('aside');
summaryCard.setAttribute('aria-live', 'polite');
summaryCard.setAttribute('aria-hidden', 'true');
summaryCard.style.position = 'fixed';
summaryCard.style.right = 'clamp(0.75rem, 2vw, 1.4rem)';
summaryCard.style.top = 'clamp(4.4rem, 9vh, 6.2rem)';
summaryCard.style.width = 'min(22rem, calc(100vw - 1.5rem))';
summaryCard.style.zIndex = '15';
summaryCard.style.pointerEvents = 'none';
summaryCard.style.padding = '0.74rem 0.86rem';
summaryCard.style.borderRadius = '1rem';
summaryCard.style.border = '1px solid rgba(255, 241, 166, 0.35)';
summaryCard.style.background = 'linear-gradient(135deg, rgba(24, 20, 49, 0.88), rgba(48, 38, 21, 0.76))';
summaryCard.style.boxShadow = '0 18px 44px rgba(0, 0, 0, 0.34), 0 0 22px rgba(255, 241, 166, 0.11)';
summaryCard.style.backdropFilter = 'blur(10px)';
summaryCard.style.color = '#fff8d3';
summaryCard.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
summaryCard.style.opacity = '0';
summaryCard.style.transform = 'translateY(-10px) scale(0.97)';
summaryCard.style.transition = 'opacity 220ms ease, transform 260ms ease';
document.body.appendChild(summaryCard);

const summaryEyebrow = document.createElement('div');
summaryEyebrow.textContent = 'Mission Summary';
summaryEyebrow.style.fontSize = '0.65rem';
summaryEyebrow.style.fontWeight = '1000';
summaryEyebrow.style.letterSpacing = '0.13em';
summaryEyebrow.style.textTransform = 'uppercase';
summaryEyebrow.style.color = '#fff1a6';
summaryCard.appendChild(summaryEyebrow);

const summaryTitle = document.createElement('div');
summaryTitle.textContent = 'Rescue loop complete';
summaryTitle.style.marginTop = '0.28rem';
summaryTitle.style.fontSize = 'clamp(0.96rem, 1.9vw, 1.18rem)';
summaryTitle.style.fontWeight = '1000';
summaryTitle.style.color = '#fffbe8';
summaryCard.appendChild(summaryTitle);

const checklist = document.createElement('div');
checklist.style.display = 'grid';
checklist.style.gap = '0.28rem';
checklist.style.marginTop = '0.56rem';
summaryCard.appendChild(checklist);

const checklistItems = [
  document.createElement('div'),
  document.createElement('div'),
  document.createElement('div')
];

checklistItems.forEach((item) => {
  item.style.fontSize = '0.78rem';
  item.style.fontWeight = '850';
  item.style.color = '#fff6cc';
  checklist.appendChild(item);
});

function readState() {
  const role = document.body.dataset.rescueNpcRole;
  const planet = document.body.dataset.rescueNpcPlanet;
  if (role) lastKnownRole = role;
  if (planet) lastKnownPlanet = planet;

  return {
    rescueState: document.body.dataset.rescueNpcState ?? 'hidden',
    role: lastKnownRole,
    planet: lastKnownPlanet,
    mode: modeLabel?.textContent?.trim() ?? '',
    launchAction: launchButton?.textContent?.trim() ?? 'Fly to next planet'
  };
}

function shouldShowSummary(state) {
  return (state.rescueState === 'boarded' || document.body.dataset.firstContactState === 'complete') && state.mode === 'Landed';
}

function renderSummary() {
  const state = readState();
  summaryVisible = shouldShowSummary(state);

  const contactComplete = document.body.dataset.firstContactState === 'complete';
  summaryTitle.textContent = contactComplete ? 'Peaceful first contact complete' : `${state.role} secured`;
  checklistItems[0].textContent = contactComplete ? '✓ Alien welcome translated' : `✓ Rescue completed on ${state.planet}`;
  checklistItems[1].textContent = contactComplete ? '✓ First Contact Friend badge earned' : '✓ Space Hero badge earned';
  checklistItems[2].textContent = `Next: ${state.launchAction.match(/^(Launch|Fly)/i) ? state.launchAction : 'Fly to the next planet'}`;

  summaryCard.setAttribute('aria-hidden', summaryVisible ? 'false' : 'true');
  summaryCard.style.opacity = summaryVisible ? '1' : '0';
  summaryCard.style.transform = summaryVisible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.97)';
}

const bodyObserver = new MutationObserver(renderSummary);
bodyObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['data-rescue-npc-state', 'data-rescue-npc-role', 'data-rescue-npc-planet', 'data-first-contact-state', 'data-first-contact-badge']
});

[modeLabel, launchButton].forEach((label) => {
  if (!label) return;
  const observer = new MutationObserver(renderSummary);
  observer.observe(label, { childList: true, characterData: true, subtree: true });
});

renderSummary();
