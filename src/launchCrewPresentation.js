const loopStatusLabel = document.querySelector('#loopStatus');
const modeLabel = document.querySelector('#modeName');
const launchButton = document.querySelector('#launchButton');

const RUN_AWAY_VISIBLE_MS = 1350;
let launchCrewState = 'hidden';
let runAwayStartedAt = null;

const launchCrewOverlay = document.createElement('div');
launchCrewOverlay.setAttribute('aria-hidden', 'true');
launchCrewOverlay.style.position = 'fixed';
launchCrewOverlay.style.left = '50%';
launchCrewOverlay.style.bottom = '15vh';
launchCrewOverlay.style.width = 'min(58vw, 640px)';
launchCrewOverlay.style.height = '120px';
launchCrewOverlay.style.transform = 'translateX(-50%)';
launchCrewOverlay.style.pointerEvents = 'none';
launchCrewOverlay.style.zIndex = '9';
launchCrewOverlay.style.transition = 'opacity 220ms ease';
launchCrewOverlay.style.opacity = '1';
document.body.appendChild(launchCrewOverlay);

const crewMembers = [
  { emoji: '🧑‍🔬', tool: '🔧', label: 'Fuel check', x: 18, runX: -38, delay: 0 },
  { emoji: '👩‍🔬', tool: '📋', label: 'Checklist', x: 39, runX: -24, delay: 80 },
  { emoji: '🧑‍🔬', tool: '🧪', label: 'Mixture', x: 61, runX: 124, delay: 140 },
  { emoji: '👨‍🔬', tool: '📡', label: 'Telemetry', x: 82, runX: 138, delay: 220 }
].map((member, index) => createCrewMember(member, index));

function createCrewMember(member, index) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = `${member.x}%`;
  wrapper.style.top = `${22 + (index % 2) * 18}px`;
  wrapper.style.transform = 'translateX(-50%)';
  wrapper.style.transition = `left 900ms cubic-bezier(0.2, 0.7, 0.2, 1) ${member.delay}ms, transform 220ms ease, opacity 300ms ease`;
  wrapper.style.textAlign = 'center';
  wrapper.style.filter = 'drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))';
  wrapper.dataset.homeX = `${member.x}%`;
  wrapper.dataset.runX = `${member.runX}%`;
  wrapper.dataset.phase = `${index * 0.7}`;

  const character = document.createElement('div');
  character.textContent = member.emoji;
  character.style.fontSize = 'clamp(1.85rem, 4vw, 3.1rem)';
  character.style.lineHeight = '1';
  character.style.transition = 'transform 160ms ease';
  wrapper.appendChild(character);

  const tool = document.createElement('div');
  tool.textContent = member.tool;
  tool.style.position = 'absolute';
  tool.style.right = '-0.75rem';
  tool.style.top = '-0.35rem';
  tool.style.fontSize = 'clamp(1rem, 2.2vw, 1.55rem)';
  tool.style.transition = 'transform 180ms ease';
  wrapper.appendChild(tool);

  const label = document.createElement('div');
  label.textContent = member.label;
  label.style.marginTop = '0.25rem';
  label.style.padding = '0.18rem 0.42rem';
  label.style.border = '1px solid rgba(148, 232, 255, 0.42)';
  label.style.borderRadius = '999px';
  label.style.background = 'rgba(3, 11, 25, 0.55)';
  label.style.color = '#dff9ff';
  label.style.font = '700 clamp(0.56rem, 1.1vw, 0.76rem) ui-sans-serif, system-ui, sans-serif';
  label.style.letterSpacing = '0.04em';
  label.style.textTransform = 'uppercase';
  label.style.whiteSpace = 'nowrap';
  wrapper.appendChild(label);

  launchCrewOverlay.appendChild(wrapper);
  return { wrapper, character, tool, label };
}

function canRunAwayFromStationPrep() {
  return launchCrewState === 'prep' || (launchCrewState === 'run' && runAwayStartedAt !== null);
}

function getRawLaunchCrewState() {
  const modeText = modeLabel?.textContent?.trim() ?? '';
  const statusText = loopStatusLabel?.textContent?.trim() ?? '';
  const buttonText = launchButton?.textContent?.trim() ?? '';
  const launchStarted = modeText === 'Countdown'
    || statusText.startsWith('T-')
    || statusText === 'Launch!'
    || modeText === 'In flight'
    || statusText.includes('Mouse guided flight')
    || buttonText.startsWith('Flying to');

  if (launchStarted) {
    return canRunAwayFromStationPrep() ? 'run' : 'hidden';
  }

  if (modeText === 'Rocket') {
    return 'prep';
  }

  return 'hidden';
}

function updateLaunchCrewState(now) {
  const nextState = getRawLaunchCrewState();

  if (nextState !== launchCrewState) {
    launchCrewState = nextState;
    runAwayStartedAt = nextState === 'run' ? now : null;
  }

  if (launchCrewState === 'run' && runAwayStartedAt !== null && now - runAwayStartedAt > RUN_AWAY_VISIBLE_MS) {
    return 'hidden';
  }

  return launchCrewState;
}

function updateLaunchCrewPresentation() {
  const now = performance.now();
  const state = updateLaunchCrewState(now);
  launchCrewOverlay.style.opacity = state === 'hidden' ? '0' : '1';
  launchCrewOverlay.setAttribute('aria-hidden', state === 'hidden' ? 'true' : 'false');

  crewMembers.forEach(({ wrapper, character, tool, label }, index) => {
    const phase = Number(wrapper.dataset.phase ?? 0);
    const prepBob = Math.sin(now * 0.004 + phase) * 3;

    if (state === 'prep') {
      wrapper.style.left = wrapper.dataset.homeX;
      wrapper.style.opacity = '1';
      wrapper.style.transform = `translateX(-50%) translateY(${prepBob}px)`;
      character.style.transform = `rotate(${Math.sin(now * 0.005 + phase) * 4}deg)`;
      tool.style.transform = `rotate(${Math.sin(now * 0.008 + phase) * 18}deg)`;
      label.textContent = index % 2 === 0 ? 'Fuel check' : 'Checklist';
      return;
    }

    if (state === 'run') {
      wrapper.style.left = wrapper.dataset.runX;
      wrapper.style.opacity = '1';
      wrapper.style.transform = `translateX(-50%) translateY(${Math.sin(now * 0.04 + phase) * 7}px) rotate(${index % 2 === 0 ? -7 : 7}deg)`;
      character.style.transform = `scaleX(${Number.parseFloat(wrapper.dataset.runX ?? '0') < 0 ? -1 : 1}) rotate(${Math.sin(now * 0.045 + phase) * 9}deg)`;
      tool.style.transform = `rotate(${Math.sin(now * 0.05 + phase) * 28}deg)`;
      label.textContent = 'Clear out!';
      return;
    }

    wrapper.style.opacity = '0';
  });
}

function tickLaunchCrew() {
  updateLaunchCrewPresentation();
  requestAnimationFrame(tickLaunchCrew);
}

if (loopStatusLabel && modeLabel) {
  const observer = new MutationObserver(updateLaunchCrewPresentation);
  observer.observe(loopStatusLabel, { childList: true, characterData: true, subtree: true });
  observer.observe(modeLabel, { childList: true, characterData: true, subtree: true });
  tickLaunchCrew();
}
