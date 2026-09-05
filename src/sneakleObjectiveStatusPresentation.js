// Keeps the generic launch-loop HUD aligned with Sneakle's non-rescue objectives.
// The core state remains in surfaceAdventureState; this only adjusts presentation copy.
import { surfaceAdventure } from './surfaceAdventureState.js';

const actionButton = document.querySelector('#actionButton');
const loopStatusLabel = document.querySelector('#loopStatus');
const helpLabel = document.querySelector('#helpText');

function getSneakleMission(run) {
  if (run.fluxCapacitorCollected) {
    return {
      title: 'Flux Capacitor found',
      objective: 'The weird helpful alien accepted the Cheetos and gave you Icky Sticky Slime plus the Flux Capacitor.',
      badge: 'Flux found',
      action: 'Repair pending',
      help: 'Flux Capacitor found. The UFO still needs a later repair/install step before it can fly.'
    };
  }

  if (run.hasCheetos) {
    return {
      title: 'Trade the Cheetos',
      objective: 'A weird helpful Sneakle alien wants the Cheetos. Bring the snack bag over and see what it gives back.',
      badge: 'Cheetos',
      action: 'Trade snack',
      help: 'Cheetos found. Head right to the weird helpful alien asking for snacks.'
    };
  }

  if (run.wobbleCoilInstalled) {
    return {
      title: 'Find the backpack',
      objective: 'The rocket thieves tossed your backpack out the window. Find it to recover the Cheetos.',
      badge: 'Backpack',
      action: 'Find backpack',
      help: 'Wobble Coil installed. Move left and find the backpack the thieves threw from the rocket.'
    };
  }

  if (run.wobbleCoilCollected) {
    return {
      title: 'Return to the UFO',
      objective: 'You found the Wobble Coil. Bring it back to the hatch and snap it into place.',
      badge: 'Coil found',
      action: 'Install coil',
      help: 'Wobble Coil found. Head back to the hatch beside the broken UFO.'
    };
  }

  if (run.ufoHatchInspected) {
    return {
      title: 'Find the Wobble Coil',
      objective: 'The hatch panel says the UFO is missing a Wobble Coil. Search the elevated scrap route on Sneakle.',
      badge: 'Missing part',
      action: 'Find coil',
      help: 'Diagnostic complete. Move left and use the jetpack to climb the scrap platforms for the Wobble Coil.'
    };
  }

  if (run.ufoDiscovered) {
    return {
      title: 'Inspect the hatch panel',
      objective: 'Use the jetpack to hop up and inspect the blinking hatch panel.',
      badge: 'Inspect',
      action: 'Inspect hatch',
      help: 'Broken UFO found. Jetpack up to the blinking hatch panel to learn what is missing.'
    };
  }

  return {
    title: 'Find another way off',
    objective: 'Rocket stolen. Move right and look for something that can get you off Sneakle-5.',
    badge: 'Stranded',
    action: 'Find broken UFO',
    help: 'Rocket stolen. Move right and look for another way off Sneakle-5.'
  };
}

function publishSneakleNonRescueState(run) {
  document.body.dataset.rocketTheftObjective = run.objective;
  document.body.dataset.rescueNpcState = 'hidden';
  document.body.dataset.rescueNpcRole = 'Sneakle objective';
  document.body.dataset.rescueNpcPlanet = 'Sneakle-5';
  document.body.dataset.rescueNpcProgress = `${Math.round(run.progress)}`;
  document.body.dataset.rescueNpcReturnProgress = '0';
}

function renderMissionCard(mission) {
  const missionTracker = document.querySelector('#missionTracker');
  if (!missionTracker) return;

  const missionHeader = missionTracker.children[0];
  const missionBadge = missionHeader?.children?.[1];
  const missionTitle = missionTracker.children[1];
  const missionObjective = missionTracker.children[2];
  const missionProgress = missionTracker.children[3];

  if (missionTitle) missionTitle.textContent = mission.title;
  if (missionObjective) missionObjective.textContent = mission.objective;
  if (missionBadge) missionBadge.textContent = mission.badge;

  Array.from(missionProgress?.children ?? []).forEach((step) => {
    step.style.background = 'rgba(104, 216, 255, 0.2)';
    step.style.border = '1px solid rgba(104, 216, 255, 0.36)';
    step.style.color = '#eafdff';
  });
}

function renderSneakleStatus() {
  const run = surfaceAdventure.run;
  if (run?.level?.kind === 'theft' && run.state === 'stranded') {
    const mission = getSneakleMission(run);
    publishSneakleNonRescueState(run);
    loopStatusLabel.textContent = run.objective;
    actionButton.textContent = mission.action;
    helpLabel.textContent = mission.help;
    // Mission tracker listens to the same labels and may render generic rescue copy.
    // Queue this after those mutation callbacks so Sneakle stays non-rescue in the UI.
    queueMicrotask(() => renderMissionCard(mission));
  } else if (document.body.dataset.rocketTheftObjective) {
    document.body.dataset.rocketTheftObjective = '';
  }

  requestAnimationFrame(renderSneakleStatus);
}

requestAnimationFrame(renderSneakleStatus);
