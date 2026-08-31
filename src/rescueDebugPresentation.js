const DEBUG_RESCUE_READOUT_ENABLED = true;

const debugCard = document.createElement('div');
debugCard.id = 'rescueDebug';
debugCard.setAttribute('aria-live', 'polite');
debugCard.setAttribute('aria-hidden', DEBUG_RESCUE_READOUT_ENABLED ? 'false' : 'true');
debugCard.style.position = 'fixed';
debugCard.style.left = 'clamp(0.75rem, 2vw, 1.4rem)';
debugCard.style.top = 'clamp(3.55rem, 7.25vh, 4.7rem)';
debugCard.style.zIndex = '14';
debugCard.style.pointerEvents = 'none';
debugCard.style.display = DEBUG_RESCUE_READOUT_ENABLED ? 'grid' : 'none';
debugCard.style.gap = '0.12rem';
debugCard.style.minWidth = '13rem';
debugCard.style.padding = '0.46rem 0.58rem';
debugCard.style.borderRadius = '0.72rem';
debugCard.style.border = '1px solid rgba(148, 232, 255, 0.24)';
debugCard.style.background = 'rgba(4, 10, 22, 0.64)';
debugCard.style.backdropFilter = 'blur(8px)';
debugCard.style.boxShadow = '0 10px 26px rgba(0, 0, 0, 0.24)';
debugCard.style.color = 'rgba(234, 252, 255, 0.78)';
debugCard.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';
debugCard.style.fontSize = '0.62rem';
debugCard.style.lineHeight = '1.32';
document.body.appendChild(debugCard);

const debugTitle = document.createElement('div');
debugTitle.textContent = 'RESCUE DEBUG';
debugTitle.style.fontWeight = '900';
debugTitle.style.letterSpacing = '0.12em';
debugTitle.style.color = 'rgba(139, 233, 255, 0.86)';
debugCard.appendChild(debugTitle);

const stateLine = document.createElement('div');
const roleLine = document.createElement('div');
const progressLine = document.createElement('div');
const returnLine = document.createElement('div');
[stateLine, roleLine, progressLine, returnLine].forEach((line) => debugCard.appendChild(line));

function renderDebugReadout() {
  if (!DEBUG_RESCUE_READOUT_ENABLED) return;

  const rescueState = document.body.dataset.rescueNpcState ?? 'hidden';
  const role = document.body.dataset.rescueNpcRole ?? 'n/a';
  const findProgress = document.body.dataset.rescueNpcProgress ?? '0';
  const returnProgress = document.body.dataset.rescueNpcReturnProgress ?? '0';
  const planet = document.body.dataset.rescueNpcPlanet ?? 'n/a';

  stateLine.textContent = `state: ${rescueState}`;
  roleLine.textContent = `target: ${role} @ ${planet}`;
  progressLine.textContent = `find: ${findProgress}%`;
  returnLine.textContent = `return: ${returnProgress}%`;
}

const observer = new MutationObserver(renderDebugReadout);
observer.observe(document.body, {
  attributes: true,
  attributeFilter: [
    'data-rescue-npc-state',
    'data-rescue-npc-role',
    'data-rescue-npc-planet',
    'data-rescue-npc-progress',
    'data-rescue-npc-return-progress'
  ]
});

renderDebugReadout();
