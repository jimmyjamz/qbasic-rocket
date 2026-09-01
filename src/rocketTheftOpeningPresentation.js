import * as THREE from 'three';
import { THEFT_PLANET, ROCKET_THEFT_STATES, createRocketTheftRun, rocketTheftMissionCopy } from './rocketTheftOpeningState.js';

const START_Y = -2.7;
const SPACE_Y = 7.8;
const LAND_Y = -1.25;
const ASTRONAUT_GROUND_Y = LAND_Y + 0.82;
const ASTRONAUT_MAX_Y = LAND_Y + 9.2;
const LAUNCH_TIME_MS = 7200;
const THEFT_DELAY_MS = 520;
const THEFT_TIME_MS = 2600;
const WALK_SPEED = 2.6;
const WALK_MIN_X = -1.8;
const WALK_MAX_X = 22.5;
const GRAVITY = -7.2;
const JETPACK_THRUST = 12.4;
const MAX_FALL_SPEED = -5.4;
const MAX_RISE_SPEED = 4.2;

const modeLabel = document.querySelector('#modeName');
const planetLabel = document.querySelector('#planetName');
const throttleLabel = document.querySelector('#throttle');
const loopStatusLabel = document.querySelector('#loopStatus');
const launchButton = document.querySelector('#launchButton');
const actionButton = document.querySelector('#actionButton');
const nextButton = document.querySelector('#nextButton');
const resetButton = document.querySelector('#resetButton');
const helpLabel = document.querySelector('#helpText');

const bridge = {
  scene: null,
  camera: null,
  rocket: null,
  astronaut: null,
  launchPad: null,
  launchSpectators: null,
  theftSurface: null,
  thiefCrew: null,
  originalSceneAdd: THREE.Scene.prototype.add,
  originalRender: THREE.WebGLRenderer.prototype.render,
  patched: false
};

const run = createRocketTheftRun();
const keys = new Set();
const rocketStart = new THREE.Vector3();
const landingTarget = new THREE.Vector3(0.65, LAND_Y, 0);
let animationStartedAt = 0;
let astronautVelocityX = 0;
let astronautVelocityY = 0;
let rocketWasVisible = true;
let launchPadWasVisible = true;
let spectatorsWereVisible = true;

document.body.dataset.rocketTheftState = ROCKET_THEFT_STATES.IDLE;
document.body.dataset.rocketTheftPlanet = '';

patchThreeBridge();
createTheftTrackerCard();
wireControls();
requestAnimationFrame(updateTheftOpening);

function patchThreeBridge() {
  if (bridge.patched) return;
  bridge.patched = true;

  THREE.Scene.prototype.add = function addWithRocketTheftCapture(...objects) {
    bridge.scene = this;
    objects.forEach(captureSceneObject);
    return bridge.originalSceneAdd.apply(this, objects);
  };

  THREE.WebGLRenderer.prototype.render = function renderWithRocketTheftCamera(scene, camera) {
    bridge.scene = bridge.scene ?? scene;
    bridge.camera = camera;
    applyTheftCameraAndVisibility(camera);
    return bridge.originalRender.call(this, scene, camera);
  };
}

function captureSceneObject(object) {
  if (!object) return;
  if (object.getObjectByName?.('flameGroup')) bridge.rocket = object;
  if (object.getObjectByName?.('jetpackFlames')) bridge.astronaut = object;
  if (object.name === 'launchSpectators') bridge.launchSpectators = object;
  if (!bridge.launchPad && bridge.rocket && bridge.astronaut && !bridge.launchSpectators && object.type === 'Group' && !object.name) {
    bridge.launchPad = object;
  }
}

function wireControls() {
  nextButton?.addEventListener('click', handleNextSelection, true);
  launchButton?.addEventListener('click', handleLaunchSelection, true);
  actionButton?.addEventListener('click', handleAction, true);
  resetButton?.addEventListener('click', resetTheftOpening);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('blur', () => keys.clear());
}

function handleNextSelection(event) {
  if (!isStationSelectionOpen()) return;

  if (run.state === ROCKET_THEFT_STATES.SELECTED) {
    run.reset();
    syncTheftDataset();
    return;
  }

  if (!launchButton?.textContent?.includes('Gherkin-7')) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  run.select();
  syncTheftDataset();
  renderTheftSelection();
}

function handleLaunchSelection(event) {
  if (run.state !== ROCKET_THEFT_STATES.SELECTED) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  beginTheftLaunch(performance.now());
}

function handleAction(event) {
  if (run.state !== ROCKET_THEFT_STATES.LANDED && run.state !== ROCKET_THEFT_STATES.STRANDED) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (run.state === ROCKET_THEFT_STATES.LANDED) {
    exitRocketAndStartTheft(performance.now());
  }
}

function handleKeyDown(event) {
  if (!isTheftArcActive()) return;
  if (['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyE'].includes(event.code)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  keys.add(event.code);
  if (event.code === 'KeyE') handleAction(event);
}

function handleKeyUp(event) {
  if (!isTheftArcActive()) return;
  keys.delete(event.code);
}

function beginTheftLaunch(now) {
  ensureTheftSurface();
  run.launch();
  syncTheftDataset();
  animationStartedAt = now;
  rocketStart.set(0, START_Y, 0);

  // RKT-65A correction: the astronaut must remain inside/hidden during flight.
  // Earlier Sneakle code left a previously visible astronaut fixed on-screen.
  if (bridge.astronaut) {
    bridge.astronaut.visible = false;
    bridge.astronaut.position.set(0, ASTRONAUT_GROUND_Y, 0.18);
    bridge.astronaut.rotation.set(0, 0, 0);
    bridge.astronaut.scale.setScalar(1);
  }

  if (bridge.rocket) {
    rocketWasVisible = bridge.rocket.visible;
    bridge.rocket.visible = true;
    bridge.rocket.position.copy(rocketStart);
    bridge.rocket.rotation.set(0, 0, 0);
  }
  if (bridge.launchPad) {
    launchPadWasVisible = bridge.launchPad.visible;
    bridge.launchPad.visible = true;
  }
  if (bridge.launchSpectators) {
    spectatorsWereVisible = bridge.launchSpectators.visible;
    bridge.launchSpectators.visible = true;
  }
  setTheftControls({ mode: 'In flight', planet: 'Launchpad', throttle: 'Ignition', status: 'Mischief approach' });
  launchButton.textContent = `Flying to ${THEFT_PLANET.name}...`;
  launchButton.disabled = true;
  actionButton.disabled = true;
  nextButton.disabled = true;
  helpLabel.textContent = `New mission: fly to ${THEFT_PLANET.name}. The landing zone looks suspiciously overprepared.`;
}

function completeTheftLanding() {
  run.land();
  syncTheftDataset();
  if (bridge.rocket) {
    bridge.rocket.position.copy(landingTarget);
    bridge.rocket.rotation.set(0, 0, 0);
    bridge.rocket.visible = true;
  }
  if (bridge.astronaut) bridge.astronaut.visible = false;
  setTheftControls({ mode: 'Landed', planet: THEFT_PLANET.name, throttle: 'Landed', status: 'Landed' });
  launchButton.disabled = false;
  launchButton.textContent = 'Rocket ready';
  actionButton.disabled = false;
  actionButton.textContent = 'Exit rocket (E)';
  nextButton.disabled = true;
  helpLabel.textContent = `Landed on ${THEFT_PLANET.name}: ${THEFT_PLANET.tagline}. Press E to step out and scout the landing zone.`;
}

function exitRocketAndStartTheft(now) {
  run.steal();
  syncTheftDataset();
  animationStartedAt = now;
  if (bridge.rocket) rocketStart.copy(bridge.rocket.position);
  if (bridge.astronaut && bridge.rocket) {
    bridge.astronaut.visible = true;
    bridge.astronaut.position.set(bridge.rocket.position.x + 1.05, ASTRONAUT_GROUND_Y, 0.18);
    bridge.astronaut.rotation.set(0, 0, 0);
    bridge.astronaut.scale.setScalar(1);
  }
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  setTheftControls({ mode: 'Astronaut EVA', planet: THEFT_PLANET.name, throttle: 'Suit ready', status: 'Tiny footprints detected' });
  launchButton.disabled = true;
  actionButton.disabled = true;
  actionButton.textContent = 'Rocket occupied';
  nextButton.disabled = true;
  helpLabel.textContent = 'Uh oh. The tiny local aliens are waddling toward the rocket like they own the keys.';
}

function finishTheft() {
  run.strand();
  syncTheftDataset();
  if (bridge.rocket) bridge.rocket.visible = false;
  setTheftControls({ mode: 'Astronaut EVA', planet: THEFT_PLANET.name, throttle: 'Stranded', status: 'Find another way off' });
  launchButton.disabled = true;
  launchButton.textContent = 'Rocket stolen';
  actionButton.disabled = true;
  actionButton.textContent = 'Find another way off';
  nextButton.disabled = true;
  helpLabel.textContent = 'The rocket is gone for now. Move right like the other planet levels and look for another way off. No fighting — solve the problem.';
}

function updateTheftOpening(now) {
  if (run.state === ROCKET_THEFT_STATES.SELECTED) renderTheftSelection();
  if (run.state === ROCKET_THEFT_STATES.FLYING) updateTheftLaunch(now);
  if (run.state === ROCKET_THEFT_STATES.STEALING) updateRocketTheft(now);
  if (run.state === ROCKET_THEFT_STATES.STEALING || run.state === ROCKET_THEFT_STATES.STRANDED) updateTheftAstronaut(now);
  if (run.state === ROCKET_THEFT_STATES.STRANDED) keepStrandedControlsLocked();
  animateTheftSurface(now);
  renderTheftTracker();
  requestAnimationFrame(updateTheftOpening);
}

function updateTheftLaunch(now) {
  ensureTheftSurface();
  const progress = Math.min((now - animationStartedAt) / LAUNCH_TIME_MS, 1);
  const eased = easeInOutCubic(progress);
  const sceneReady = progress >= 0.5;
  const y = bezier(START_Y, SPACE_Y, SPACE_Y - 0.6, LAND_Y, eased);
  const x = THREE.MathUtils.lerp(0, landingTarget.x, THREE.MathUtils.smoothstep(progress, 0.72, 1));
  const z = Math.sin(progress * Math.PI) * -0.65;

  if (bridge.astronaut) bridge.astronaut.visible = false;
  if (bridge.rocket) {
    bridge.rocket.visible = true;
    bridge.rocket.position.set(x, y, z);
    bridge.rocket.rotation.z = Math.sin(now * 0.004) * 0.04;
    bridge.rocket.rotation.x = progress > 0.7 ? THREE.MathUtils.lerp(-0.18, 0, THREE.MathUtils.smoothstep(progress, 0.7, 1)) : -0.18;
  }
  if (bridge.theftSurface) bridge.theftSurface.visible = sceneReady;
  if (sceneReady) planetLabel.textContent = THEFT_PLANET.name;
  throttleLabel.textContent = progress < 0.13 ? 'Ignition' : progress < 0.66 ? 'Full burn' : 'Landing burn';
  loopStatusLabel.textContent = sceneReady ? 'Suspicious landing zone' : 'Mischief approach';
  if (progress >= 1) completeTheftLanding();
}

function updateRocketTheft(now) {
  const elapsed = now - animationStartedAt;
  const progress = Math.min(Math.max(0, elapsed - THEFT_DELAY_MS) / THEFT_TIME_MS, 1);
  const eased = easeInOutCubic(progress);
  if (bridge.thiefCrew && bridge.rocket) {
    bridge.thiefCrew.visible = true;
    bridge.thiefCrew.children.forEach((alien, index) => {
      const dash = THREE.MathUtils.smoothstep(progress, 0, 0.32);
      const hop = Math.abs(Math.sin(now * 0.018 + index)) * 0.16;
      alien.position.x = THREE.MathUtils.lerp(2.45 + index * 0.42, bridge.rocket.position.x + 0.1 + index * 0.08, dash);
      alien.position.y = hop + (dash > 0.95 ? 0.75 + index * 0.14 : 0);
      alien.rotation.z = Math.sin(now * 0.016 + index) * 0.18;
      alien.visible = progress < 0.48;
    });
  }
  if (bridge.rocket) {
    const wobble = Math.sin(now * 0.015) * 0.12;
    bridge.rocket.visible = true;
    bridge.rocket.position.x = rocketStart.x + eased * 4.4;
    bridge.rocket.position.y = rocketStart.y + easeOutCubic(progress) * 8.2;
    bridge.rocket.position.z = -eased * 0.9;
    bridge.rocket.rotation.z = -0.15 - eased * 0.45 + wobble * 0.2;
    bridge.rocket.rotation.x = -0.08 - eased * 0.18;
  }
  throttleLabel.textContent = progress < 0.45 ? 'Unauthorized boarding' : 'Rocket stolen';
  loopStatusLabel.textContent = progress < 0.7 ? 'Mischief in progress' : 'Find another way off';
  helpLabel.textContent = progress < 0.35
    ? 'The tiny aliens are boarding. This is not a drill. It is also not combat.'
    : 'They are stealing the rocket! Watch it leave, then continue right to search for another way off.';
  if (progress >= 1) finishTheft();
}

function updateTheftAstronaut(now) {
  if (!bridge.astronaut) return;
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const direction = Number(right) - Number(left);
  const jetpack = keys.has('Space');
  const dt = 1 / 60;

  astronautVelocityX = THREE.MathUtils.lerp(astronautVelocityX, direction * WALK_SPEED, 0.18);
  astronautVelocityY += (jetpack ? JETPACK_THRUST : GRAVITY) * dt;
  astronautVelocityY = THREE.MathUtils.clamp(astronautVelocityY, MAX_FALL_SPEED, MAX_RISE_SPEED);
  bridge.astronaut.position.x = THREE.MathUtils.clamp(bridge.astronaut.position.x + astronautVelocityX * dt, WALK_MIN_X, WALK_MAX_X);
  bridge.astronaut.position.y = THREE.MathUtils.clamp(bridge.astronaut.position.y + astronautVelocityY * dt, ASTRONAUT_GROUND_Y, ASTRONAUT_MAX_Y);
  if (bridge.astronaut.position.y <= ASTRONAUT_GROUND_Y + 0.001 && astronautVelocityY < 0) astronautVelocityY = 0;
  bridge.astronaut.rotation.z = THREE.MathUtils.lerp(bridge.astronaut.rotation.z, -direction * 0.12, 0.14);
  bridge.astronaut.rotation.x = THREE.MathUtils.lerp(bridge.astronaut.rotation.x, jetpack ? -0.08 : 0, 0.12);
  if (direction !== 0) bridge.astronaut.rotation.y = direction > 0 ? 0.22 : -0.22;

  const body = bridge.astronaut.children[0];
  if (body) body.position.y = 0.46 + Math.sin(now * 0.01) * 0.025 * Math.abs(direction);

  const flames = bridge.astronaut.getObjectByName('jetpackFlames');
  const light = bridge.astronaut.getObjectByName('jetpackLight');
  if (flames) {
    flames.visible = jetpack;
    flames.scale.set(1, 0.85 + Math.sin(now * 0.03) * 0.16, 1);
  }
  if (light) light.intensity = jetpack ? 2.2 : 0;
}

function keepStrandedControlsLocked() {
  setTheftControls({ mode: 'Astronaut EVA', planet: THEFT_PLANET.name, throttle: keys.has('Space') ? 'Jetpack' : 'Stranded', status: 'Find another way off' });
  launchButton.disabled = true;
  nextButton.disabled = true;
  actionButton.disabled = true;
  launchButton.textContent = 'Rocket stolen';
  actionButton.textContent = 'Find another way off';
}

function renderTheftSelection() {
  if (!isStationSelectionOpen()) return;
  launchButton.disabled = false;
  nextButton.disabled = false;
  actionButton.disabled = true;
  launchButton.textContent = `Launch to ${THEFT_PLANET.name}`;
  helpLabel.textContent = `Target: ${THEFT_PLANET.name} — ${THEFT_PLANET.tagline}. A few tiny aliens requested valet parking. Suspicious.`;
  const destination = document.querySelector('#stationDestination');
  const objective = document.querySelector('#stationObjective');
  if (destination) destination.textContent = `Next destination: ${THEFT_PLANET.name}`;
  if (objective) objective.textContent = 'Scout a side-scroller planet. The local aliens look mischievous, not dangerous.';
}

function setTheftControls({ mode, planet, throttle, status }) {
  if (modeLabel) modeLabel.textContent = mode;
  if (planetLabel) planetLabel.textContent = planet;
  if (throttleLabel) throttleLabel.textContent = throttle;
  if (loopStatusLabel) loopStatusLabel.textContent = status;
  const hub = document.querySelector('#stationHub');
  if (hub && run.state !== ROCKET_THEFT_STATES.SELECTED) hub.hidden = true;
}

function resetTheftOpening() {
  run.reset();
  syncTheftDataset();
  keys.clear();
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  if (bridge.theftSurface) bridge.theftSurface.visible = false;
  if (bridge.thiefCrew) bridge.thiefCrew.visible = false;
  if (bridge.rocket) {
    bridge.rocket.visible = rocketWasVisible;
    bridge.rocket.position.set(0, START_Y, 0);
    bridge.rocket.rotation.set(0, 0, 0);
  }
  if (bridge.astronaut) {
    bridge.astronaut.visible = false;
    bridge.astronaut.position.set(0, ASTRONAUT_GROUND_Y, 0.18);
    bridge.astronaut.rotation.set(0, 0, 0);
    bridge.astronaut.scale.setScalar(1);
  }
  if (bridge.launchPad) bridge.launchPad.visible = launchPadWasVisible;
  if (bridge.launchSpectators) bridge.launchSpectators.visible = spectatorsWereVisible;
  renderTheftTracker();
}

function syncTheftDataset() {
  document.body.dataset.rocketTheftState = run.state;
  document.body.dataset.rocketTheftPlanet = run.state === ROCKET_THEFT_STATES.IDLE ? '' : THEFT_PLANET.name;
}

function isStationSelectionOpen() {
  const mode = modeLabel?.textContent?.trim();
  const planet = planetLabel?.textContent?.trim();
  return mode === 'Rocket' && planet === 'Launchpad' && run.state !== ROCKET_THEFT_STATES.FLYING;
}

function isTheftArcActive() {
  return ![ROCKET_THEFT_STATES.IDLE, ROCKET_THEFT_STATES.SELECTED].includes(run.state);
}

function ensureTheftSurface() {
  if (!bridge.scene || bridge.theftSurface) return;
  bridge.theftSurface = createTheftSurface();
  bridge.theftSurface.visible = false;
  bridge.scene.add(bridge.theftSurface);
}

function createTheftSurface() {
  const group = new THREE.Group();
  group.name = 'rocketTheftSurface';
  const terrain = new THREE.MeshStandardMaterial({ color: THEFT_PLANET.surface, roughness: 0.86, metalness: 0.04 });
  const accent = new THREE.MeshStandardMaterial({ color: THEFT_PLANET.accent, emissive: THEFT_PLANET.accent, emissiveIntensity: 0.16, roughness: 0.45 });

  const ground = new THREE.Mesh(new THREE.BoxGeometry(28, 0.42, 4.8), terrain);
  ground.position.set(10, LAND_Y - 0.42, 0);
  group.add(ground);

  const horizon = new THREE.Mesh(new THREE.SphereGeometry(9.5, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), terrain);
  horizon.position.set(10, LAND_Y - 1.8, -3.7);
  horizon.scale.y = 0.32;
  group.add(horizon);

  createSurfaceSign(group, 'ROCKET · E', 0, 1.95, 1.9);
  createSurfaceSign(group, 'TINY FOOTPRINTS?', 4.8, 1.55, 2.6);
  createSurfaceSign(group, 'FIND ANOTHER WAY OFF →', 12.5, 1.65, 3.6);

  for (let i = 0; i < 18; i += 1) {
    const tower = createWobblyTower(accent, i);
    tower.position.set(-0.8 + i * 1.35, LAND_Y - 0.16, -1.55 + Math.sin(i * 1.7) * 0.7);
    tower.rotation.y = i * 0.61;
    group.add(tower);
  }

  bridge.thiefCrew = new THREE.Group();
  bridge.thiefCrew.name = 'rocketThiefCrew';
  [2.45, 2.9, 3.35].forEach((x, index) => {
    const alien = createMischiefAlien(index);
    alien.position.set(x, 0, index % 2 ? 0.42 : 0.05);
    bridge.thiefCrew.add(alien);
  });
  group.add(bridge.thiefCrew);
  return group;
}

function createSurfaceSign(group, text, x, y, width) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2d1744';
  ctx.fillRect(0, 0, 768, 128);
  ctx.strokeStyle = '#ffdd66';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 762, 122);
  ctx.fillStyle = '#fff9d7';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
  sprite.position.set(x, y, 0.5);
  sprite.scale.set(width, width / 6, 1);
  group.add(sprite);
}

function createWobblyTower(material, index) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.5, 7), material);
  base.position.y = 0.25;
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7 + (index % 3) * 0.1, 7), material);
  top.position.y = 0.86;
  top.rotation.z = index % 2 ? 0.16 : -0.16;
  group.add(base, top);
  return group;
}

function createMischiefAlien(index) {
  const group = new THREE.Group();
  group.name = `rocketThiefAlien${index + 1}`;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffdd66, emissive: 0x5f3a00, emissiveIntensity: 0.18, roughness: 0.58 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x16111f });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.28, 5, 10), bodyMaterial);
  body.position.y = 0.36;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), bodyMaterial);
  head.scale.set(1.15, 0.82, 0.88);
  head.position.y = 0.8;
  group.add(body, head);
  for (const x of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeMaterial);
    eye.position.set(x, 0.83, 0.24);
    group.add(eye);
  }
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 5), bodyMaterial);
  hat.position.y = 1.12;
  hat.rotation.z = index % 2 ? 0.22 : -0.22;
  group.add(hat);
  group.scale.setScalar(0.9 + index * 0.05);
  return group;
}

function animateTheftSurface(now) {
  if (!bridge.theftSurface?.visible) return;
  bridge.theftSurface.children.forEach((child, index) => {
    if (child.name === 'rocketThiefCrew') return;
    if (index < 5) return;
    child.rotation.z = Math.sin(now * 0.0018 + index) * 0.055;
  });
}

function applyTheftCameraAndVisibility(camera) {
  if (!isTheftArcActive()) return;
  if (bridge.launchPad) bridge.launchPad.visible = false;
  if (bridge.launchSpectators) bridge.launchSpectators.visible = false;
  const follow = run.state === ROCKET_THEFT_STATES.FLYING || run.state === ROCKET_THEFT_STATES.STEALING ? bridge.rocket : bridge.astronaut;
  if (camera && follow) {
    const sideScrollerX = run.state === ROCKET_THEFT_STATES.STRANDED
      ? THREE.MathUtils.clamp(follow.position.x + 2.2, 2.2, 18.5)
      : THREE.MathUtils.clamp(follow.position.x * 0.35, -1.8, 2.2);
    const desiredY = run.state === ROCKET_THEFT_STATES.FLYING
      ? THREE.MathUtils.clamp(follow.position.y + 2.35, 1.8, 8.8)
      : THREE.MathUtils.clamp(ASTRONAUT_GROUND_Y + 2.35 + (follow.position.y - ASTRONAUT_GROUND_Y) * 0.28, 1.8, 8.8);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, sideScrollerX, 0.18);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, 0.18);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, run.state === ROCKET_THEFT_STATES.STRANDED ? 10 : 12, 0.18);
    const lookAtX = run.state === ROCKET_THEFT_STATES.STRANDED ? sideScrollerX : follow.position.x * 0.36;
    camera.lookAt(lookAtX, run.state === ROCKET_THEFT_STATES.FLYING ? follow.position.y + 1.55 : ASTRONAUT_GROUND_Y + 1.55, 0);
  }
  if (bridge.rocket && [ROCKET_THEFT_STATES.FLYING, ROCKET_THEFT_STATES.STEALING].includes(run.state)) {
    const flameGroup = bridge.rocket.getObjectByName('flameGroup');
    if (flameGroup) {
      flameGroup.visible = true;
      flameGroup.scale.set(1, 1.2 + Math.random() * 0.16, 1);
    }
  }
}

function createTheftTrackerCard() {
  const card = document.createElement('aside');
  card.id = 'rocketTheftTracker';
  card.setAttribute('aria-live', 'polite');
  card.hidden = true;
  card.style.position = 'fixed';
  card.style.left = 'clamp(0.75rem, 2vw, 1.4rem)';
  card.style.bottom = 'clamp(0.75rem, 2vw, 1.4rem)';
  card.style.width = 'min(25rem, calc(100vw - 1.5rem))';
  card.style.zIndex = '13';
  card.style.pointerEvents = 'none';
  card.style.padding = '0.82rem 0.92rem';
  card.style.borderRadius = '1.1rem';
  card.style.border = '1px solid rgba(255, 221, 102, 0.34)';
  card.style.background = 'linear-gradient(135deg, rgba(26, 9, 38, 0.9), rgba(54, 32, 86, 0.72))';
  card.style.boxShadow = '0 18px 46px rgba(0, 0, 0, 0.34), inset 0 0 18px rgba(255, 221, 102, 0.08)';
  card.style.backdropFilter = 'blur(10px)';
  card.style.color = '#fff9d7';
  card.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  card.innerHTML = '<div data-role="eyebrow"></div><strong></strong><p></p><small></small>';
  document.body.appendChild(card);
}

function renderTheftTracker() {
  const card = document.querySelector('#rocketTheftTracker');
  if (!card) return;
  const copy = rocketTheftMissionCopy(run.state);
  card.hidden = run.state === ROCKET_THEFT_STATES.IDLE;
  if (card.hidden) return;
  card.querySelector('[data-role="eyebrow"]').textContent = 'Mission Control · RKT-65A';
  card.querySelector('[data-role="eyebrow"]').style.fontSize = '0.68rem';
  card.querySelector('[data-role="eyebrow"]').style.fontWeight = '900';
  card.querySelector('[data-role="eyebrow"]').style.letterSpacing = '0.14em';
  card.querySelector('[data-role="eyebrow"]').style.textTransform = 'uppercase';
  card.querySelector('strong').textContent = copy.title;
  card.querySelector('strong').style.display = 'block';
  card.querySelector('strong').style.marginTop = '0.42rem';
  card.querySelector('strong').style.fontSize = 'clamp(1rem, 2.2vw, 1.25rem)';
  card.querySelector('p').textContent = copy.objective;
  card.querySelector('p').style.margin = '0.42rem 0 0';
  card.querySelector('p').style.lineHeight = '1.35';
  card.querySelector('small').textContent = copy.badge;
  card.querySelector('small').style.display = 'inline-block';
  card.querySelector('small').style.marginTop = '0.65rem';
  card.querySelector('small').style.padding = '0.18rem 0.48rem';
  card.querySelector('small').style.borderRadius = '999px';
  card.querySelector('small').style.background = 'rgba(255, 221, 102, 0.16)';
  card.querySelector('small').style.fontWeight = '900';
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function bezier(a, b, c, d, t) {
  const mt = 1 - t;
  return mt ** 3 * a + 3 * mt ** 2 * t * b + 3 * mt * t ** 2 * c + t ** 3 * d;
}
