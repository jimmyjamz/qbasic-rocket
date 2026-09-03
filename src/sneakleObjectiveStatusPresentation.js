// Keeps the generic launch-loop HUD aligned with Sneakle's non-rescue objectives.
// The core state remains in surfaceAdventureState; this only adjusts presentation copy.
import { surfaceAdventure } from './surfaceAdventureState.js';

const actionButton = document.querySelector('#actionButton');
const loopStatusLabel = document.querySelector('#loopStatus');
const helpLabel = document.querySelector('#helpText');

function getSneakleMission(run) {
  if (run.ufoPartCollected) {
    return {
      title: 'First UFO part found',
      objective: 'Nice work. Repairing the UFO comes in the next mission slice.',
      badge: 'Part found',
      action: 'UFO part found',
      help: 'First UFO part found. Repairing the UFO comes in the next mission slice.'
    };
  }

  if (run.ufoDiscovered) {
    return {
      title: 'Search the hatch room',
      objective: 'Use the hatch and jetpack through the underground room to reach the blinking UFO part.',
      badge: 'Parts',
      action: 'Find UFO part',
      help: 'Broken UFO found. Use the hatch and jetpack through the underground room to reach the blinking part.'
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
  const run = surfaceAdventure.active ? surfaceAdventure.run : null;
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
