const modeLabel = document.querySelector('#modeName');
const planetLabel = document.querySelector('#planetName');
const throttleLabel = document.querySelector('#throttle');
const loopStatusLabel = document.querySelector('#loopStatus');
const launchButton = document.querySelector('#launchButton');
const actionButton = document.querySelector('#actionButton');
const helpLabel = document.querySelector('#helpText');

const missionCard = document.createElement('aside');
missionCard.id = 'missionTracker';
missionCard.setAttribute('aria-live', 'polite');
missionCard.style.position = 'fixed';
missionCard.style.right = 'clamp(0.75rem, 2vw, 1.4rem)';
missionCard.style.bottom = 'clamp(0.75rem, 2vw, 1.4rem)';
missionCard.style.width = 'min(28rem, calc(100vw - 1.5rem))';
missionCard.style.zIndex = '12';
missionCard.style.pointerEvents = 'none';
missionCard.style.padding = '0.85rem 0.95rem';
missionCard.style.borderRadius = '1.1rem';
missionCard.style.border = '1px solid rgba(148, 232, 255, 0.28)';
missionCard.style.background = 'linear-gradient(135deg, rgba(5, 15, 34, 0.86), rgba(17, 24, 49, 0.68))';
missionCard.style.boxShadow = '0 18px 46px rgba(0, 0, 0, 0.34), inset 0 0 18px rgba(104, 216, 255, 0.06)';
missionCard.style.backdropFilter = 'blur(10px)';
missionCard.style.color = '#eafcff';
missionCard.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
missionCard.style.transition = 'transform 260ms ease, opacity 220ms ease';
missionCard.style.transform = 'translateY(0)';
missionCard.style.opacity = '1';

document.body.appendChild(missionCard);

const missionHeader = document.createElement('div');
missionHeader.style.display = 'flex';
missionHeader.style.alignItems = 'center';
missionHeader.style.justifyContent = 'space-between';
missionHeader.style.gap = '0.65rem';
missionCard.appendChild(missionHeader);

const missionEyebrow = document.createElement('div');
missionEyebrow.textContent = 'Mission Control';
missionEyebrow.style.fontSize = '0.68rem';
missionEyebrow.style.fontWeight = '900';
missionEyebrow.style.letterSpacing = '0.14em';
missionEyebrow.style.textTransform = 'uppercase';
missionEyebrow.style.color = '#8be9ff';
missionHeader.appendChild(missionEyebrow);

const missionBadge = document.createElement('div');
missionBadge.textContent = 'POC';
missionBadge.style.padding = '0.18rem 0.46rem';
missionBadge.style.borderRadius = '999px';
missionBadge.style.background = 'rgba(104, 216, 255, 0.12)';
missionBadge.style.border = '1px solid rgba(104, 216, 255, 0.26)';
missionBadge.style.color = '#c9f7ff';
missionBadge.style.fontSize = '0.64rem';
missionBadge.style.fontWeight = '900';
missionBadge.style.letterSpacing = '0.1em';
missionHeader.appendChild(missionBadge);

const missionTitle = document.createElement('div');
missionTitle.style.marginTop = '0.45rem';
missionTitle.style.fontSize = 'clamp(1rem, 2.2vw, 1.3rem)';
missionTitle.style.fontWeight = '900';
missionTitle.style.lineHeight = '1.15';
missionCard.appendChild(missionTitle);

const missionObjective = document.createElement('div');
missionObjective.style.marginTop = '0.42rem';
missionObjective.style.color = '#d8f7ff';
missionObjective.style.fontSize = 'clamp(0.82rem, 1.55vw, 0.98rem)';
missionObjective.style.lineHeight = '1.35';
missionCard.appendChild(missionObjective);

const missionProgress = document.createElement('div');
missionProgress.style.marginTop = '0.72rem';
missionProgress.style.display = 'grid';
missionProgress.style.gridTemplateColumns = 'repeat(4, 1fr)';
missionProgress.style.gap = '0.32rem';
missionCard.appendChild(missionProgress);

const progressSteps = ['Target', 'Launch', 'Land', 'Explore'].map((label) => {
  const step = document.createElement('div');
  step.textContent = label;
  step.style.padding = '0.28rem 0.3rem';
  step.style.borderRadius = '0.55rem';
  step.style.textAlign = 'center';
  step.style.fontSize = '0.62rem';
  step.style.fontWeight = '900';
  step.style.letterSpacing = '0.04em';
  step.style.textTransform = 'uppercase';
  missionProgress.appendChild(step);
  return step;
});

function readUiState() {
  return {
    mode: modeLabel?.textContent?.trim() ?? '',
    planet: planetLabel?.textContent?.trim() ?? '',
    throttle: throttleLabel?.textContent?.trim() ?? '',
    status: loopStatusLabel?.textContent?.trim() ?? '',
    launchAction: launchButton?.textContent?.trim() ?? '',
    contextAction: actionButton?.textContent?.trim() ?? '',
    help: helpLabel?.textContent?.trim() ?? '',
    rescueState: document.body.dataset.rescueNpcState ?? 'hidden',
    rescueProgress: Number(document.body.dataset.rescueNpcProgress ?? 0),
    rescueReturnProgress: Number(document.body.dataset.rescueNpcReturnProgress ?? 0),
    rescueRole: document.body.dataset.rescueNpcRole ?? 'stranded explorer'
  };
}

function getNextLaunchCopy(state) {
  const launchText = state.launchAction || 'Fly to next planet';
  return launchText.match(/^(Launch|Fly)/i) ? launchText : 'Fly to the next planet';
}

function getRescueRole(state) {
  return state.rescueRole || 'stranded explorer';
}

function getMissionCopy(state) {
  const rescueRole = getRescueRole(state);

  if (state.status === 'Vortex reset' || state.throttle === 'Checkpoint') {
    return {
      title: 'Recover from the vortex',
      objective: 'Checkpoint restored. Re-enter the rocket or try exploring again.',
      badge: 'Reset',
      step: 3
    };
  }

  if (state.mode === 'Countdown') {
    return {
      title: 'Launch sequence armed',
      objective: 'Crew is clearing the pad. Watch the countdown and prepare for liftoff.',
      badge: 'T-Minus',
      step: 1
    };
  }

  if (state.mode === 'In flight') {
    if (document.body.dataset.stationReturn === 'flying') {
      return { title: 'Bring your explorer home', objective: 'Fly to the Space Station. Your earned badges are safe; the home board opens after landing.', badge: 'Homebound', step: 1 };
    }
    return {
      title: 'Reach the destination planet',
      objective: 'Guide the rocket through space and stay ready for the landing burn.',
      badge: 'Flight',
      step: 1
    };
  }

  if (state.mode === 'Landed') {
    if (state.planet === 'Gherkin-7' && document.body.dataset.firstContactState === 'complete') {
      return { title: 'First contact complete', objective: 'First Contact Friend earned! Return to the station or continue exploring.', badge: 'Friend', step: 3 };
    }
    if (state.rescueState === 'boarded') {
      return {
        title: 'Mission handoff complete',
        objective: `${rescueRole} secured. ${getNextLaunchCopy(state)} when ready.`,
        badge: 'Next loop',
        step: 3
      };
    }

    if (state.rescueState === 'rescued') {
      return {
        title: 'Board the rocket',
        objective: `The ${rescueRole.toLowerCase()} is safe. Board the rocket to lock in the rescue and continue the planet loop.`,
        badge: 'Board',
        step: 3
      };
    }

    if (state.rescueState === 'following') {
      return {
        title: `${rescueRole} is with you`,
        objective: `Return the ${rescueRole.toLowerCase()} to the rocket. Full boarding animation comes later.`,
        badge: 'Escort',
        step: 3
      };
    }

    if (state.rescueState === 'visible') {
      return {
        title: `${rescueRole} needs help`,
        objective: `An SOS beacon is active on ${state.planet || 'this planet'}. Exit the rocket and move toward the marker.`,
        badge: 'Rescue',
        step: 2
      };
    }

    return {
      title: `Explore ${state.planet || 'the planet'}`,
      objective: 'Exit the rocket, test the suit, and scout the landing zone for future missions.',
      badge: 'Landed',
      step: 2
    };
  }

  if (state.mode === 'Astronaut EVA') {
    if (state.throttle === 'Danger' || state.status.startsWith('Vortex warning')) {
      return {
        title: 'Altitude danger',
        objective: 'Drop lower now. Holding the jetpack too high will open the black-hole reset.',
        badge: 'Warning',
        step: 3
      };
    }

    if (state.throttle === 'Vortex' || state.status.includes('sucked')) {
      return {
        title: 'Black-hole event',
        objective: 'The astronaut is being pulled into a vortex. Checkpoint reset incoming.',
        badge: 'Vortex',
        step: 3
      };
    }

    if (state.planet === 'Gherkin-7') {
      const stage = document.body.dataset.contactGarden;
      if (stage === 'blocked') return { title: 'Aliens block the route', objective: 'Return to the rocket and fly home for a translator.', badge: 'Retreat', step: 2 };
      if (stage === 'gate') return { title: 'Reach the moon-pickle gate', objective: 'Follow the path right. At the glowing gate, press E to use the Translator Badge.', badge: 'Translate', step: 3 };
      if (stage === 'garden') return { title: 'Meet the garden keeper', objective: 'Approach the one friendly alien and press E to say hello.', badge: 'Hello', step: 3 };
      if (stage === 'welcomed') return { title: 'Peaceful contact made', objective: 'Return left to the rocket and press E to complete the mission.', badge: 'Complete', step: 3 };
    }

    if (state.rescueState === 'rescued') {
      return {
        title: 'Rescue complete',
        objective: `Great job. The ${rescueRole.toLowerCase()} is safe. Move to the rocket and press E to board.`,
        badge: 'Complete',
        step: 3
      };
    }

    if (state.rescueState === 'following') {
      const returnHint = state.rescueReturnProgress > 75
        ? 'Almost back — keep moving left toward the rocket.'
        : state.rescueReturnProgress > 35
          ? `The ${rescueRole.toLowerCase()} is following. Keep guiding them back to the ship.`
          : `${rescueRole} found! Head left and escort them back to the rocket.`;

      return {
        title: `Return with ${rescueRole}`,
        objective: returnHint,
        badge: 'Escort',
        step: 3
      };
    }

    if (state.rescueState === 'visible') {
      if (state.planet === 'Frost Pea' && document.body.dataset.surfaceObjective !== 'RESCUE EXPLORER') {
        const needsPickaxe = document.body.dataset.surfaceObjective === 'FIND PICKAXE';
        return {
          title: needsPickaxe ? 'Find the pickaxe' : 'Break the ice column',
          objective: needsPickaxe ? 'Skate right and collect the pickaxe marker.' : 'Carry the pickaxe to the ice column and keep moving against it to break through.',
          badge: needsPickaxe ? 'Search' : 'Break ice', step: 3
        };
      }
      const distanceHint = state.rescueProgress > 65
        ? `Almost there — keep moving toward the ${rescueRole.toLowerCase()}.`
        : state.rescueProgress > 30
          ? 'Getting closer. Keep walking or jetpacking toward the marker.'
          : `Move right from the rocket and look for the ${rescueRole.toLowerCase()}'s SOS beacon.`;

      return {
        title: `Find the ${rescueRole.toLowerCase()}`,
        objective: distanceHint,
        badge: 'Rescue',
        step: 3
      };
    }

    if (state.contextAction.includes('Enter rocket')) {
      return {
        title: 'Return to the rocket',
        objective: 'You are back at the ship. Press E or Enter Rocket to continue the loop.',
        badge: 'Board',
        step: 3
      };
    }

    return {
      title: 'Scout the surface',
      objective: 'Walk with A/D, use the jetpack with Space, and return to the rocket when ready.',
      badge: 'EVA',
      step: 3
    };
  }

  const targetName = state.launchAction.replace(/^Launch to\s+/i, '').trim();
  return {
    title: 'Pick a destination',
    objective: targetName && targetName !== state.launchAction
      ? `Target locked: ${targetName}. Launch when ready.`
      : 'Choose a planet and start the rocket loop.',
    badge: 'Ready',
    step: 0
  };
}

function renderMissionTracker() {
  const state = readUiState();
  const mission = getMissionCopy(state);

  missionTitle.textContent = mission.title;
  missionObjective.textContent = mission.objective;
  missionBadge.textContent = mission.badge;

  progressSteps.forEach((step, index) => {
    const isActive = index <= mission.step;
    step.style.background = isActive ? 'rgba(104, 216, 255, 0.2)' : 'rgba(255, 255, 255, 0.055)';
    step.style.border = isActive ? '1px solid rgba(104, 216, 255, 0.36)' : '1px solid rgba(255, 255, 255, 0.08)';
    step.style.color = isActive ? '#eafdff' : 'rgba(234, 252, 255, 0.52)';
  });
}

function observe(label) {
  if (!label) return;
  const observer = new MutationObserver(renderMissionTracker);
  observer.observe(label, { childList: true, characterData: true, subtree: true });
}

[modeLabel, planetLabel, throttleLabel, loopStatusLabel, launchButton, actionButton, helpLabel].forEach(observe);

const bodyObserver = new MutationObserver(renderMissionTracker);
bodyObserver.observe(document.body, {
  attributes: true,
  attributeFilter: [
    'data-rescue-npc-state',
    'data-rescue-npc-progress',
    'data-rescue-npc-return-progress',
    'data-rescue-npc-role',
    'data-contact-garden',
    'data-first-contact-state'
  ]
});

renderMissionTracker();
