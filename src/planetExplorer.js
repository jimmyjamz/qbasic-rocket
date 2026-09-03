import * as THREE from 'three';
import { surfaceAdventure, SPROUT_LEVEL, CINDER_LEVEL, FROST_LEVEL, CONTACT_LEVEL, THEFT_LEVEL, createSurfaceRun, resolveSurfaceMovement } from './surfaceAdventureState.js';
import { createSurfaceAdventureView } from './surfaceAdventureView.js';

const canvas = document.querySelector('#scene');
const launchButton = document.querySelector('#launchButton');
const actionButton = document.querySelector('#actionButton');
const nextButton = document.querySelector('#nextButton');
const resetButton = document.querySelector('#resetButton');
const altitudeLabel = document.querySelector('#altitude');
const throttleLabel = document.querySelector('#throttle');
const loopStatusLabel = document.querySelector('#loopStatus');
const planetLabel = document.querySelector('#planetName');
const modeLabel = document.querySelector('#modeName');
const helpLabel = document.querySelector('#helpText');

const START_Y = -2.7;
const SPACE_Y = 7.8;
const LAND_Y = -1.25;
const ASTRONAUT_GROUND_Y = LAND_Y + 0.82;
const ASTRONAUT_MAX_Y = LAND_Y + 9.2;
const LAUNCH_TIME_MS = 7200;
const LAUNCH_COUNTDOWN_ENABLED = false;
const LAUNCH_COUNTDOWN_MS = 3200;
const LAUNCH_COUNTDOWN_STEPS = ['3', '2', '1', 'Launch!'];
const STEERING_LIMIT_X = 4.8;
const STEERING_LIMIT_Z = 1.45;
const WALK_LIMIT = 5.6;
const WALK_SPEED = 2.6;
const GRAVITY = -7.2;
const JETPACK_THRUST = 12.4;
const MAX_FALL_SPEED = -5.4;
const MAX_RISE_SPEED = 4.2;
const SCENE_SWAP_PROGRESS = 0.5;
const BLACK_HOLE_DANGER_ZONE = 0.32;
const BLACK_HOLE_HOLD_MS = 5000;
const BLACK_HOLE_WARNING_MS = 2600;
const BLACK_HOLE_SEQUENCE_MS = 2400;
const BLACK_HOLE_OFFSET_X = 1.95;
const BLACK_HOLE_OFFSET_Y = 1.05;
const BLACK_HOLE_OFFSET_Z = -0.85;
const BLACK_HOLE_START_SCALE = 1.05;
const BLACK_HOLE_END_SCALE = 3.15;

const PLANETS = [
  {
    name: 'Sprout-9',
    tagline: 'green valleys and glowing seed rocks',
    surface: 0x2a7d54,
    accent: 0x79ffb2,
    sky: 0x071b29,
    fog: 0.032,
    props: 'sprouts'
  },
  {
    name: 'Cinder Bean',
    tagline: 'warm copper dust and lava-glass crystals',
    surface: 0x9b4b25,
    accent: 0xffb35c,
    sky: 0x190b1c,
    fog: 0.026,
    props: 'crystals'
  },
  {
    name: 'Frost Pea',
    tagline: 'blue ice dunes under a quiet starfield',
    surface: 0x4c8fb4,
    accent: 0xc4f6ff,
    sky: 0x061022,
    fog: 0.034,
    props: 'ice'
  },
  {
    name: 'Gherkin-7',
    tagline: 'violet fields and a famous moon-pickle garden',
    surface: 0x6250a5,
    accent: 0xc8ff72,
    sky: 0x120729,
    fog: 0.029,
    props: 'crystals'
  },
  {
    name: 'Sneakle-5',
    tagline: 'purple dust, wobbly towers, and very suspicious parking spots',
    surface: 0x5b3f8f,
    accent: 0xffdd66,
    sky: 0x14091f,
    fog: 0.031,
    props: 'mischief'
  }
];

const SURFACE_LEVELS = [SPROUT_LEVEL, CINDER_LEVEL, FROST_LEVEL, CONTACT_LEVEL, THEFT_LEVEL];

const scene = new THREE.Scene();
scene.background = new THREE.Color(PLANETS[0].sky);
scene.fog = new THREE.FogExp2(PLANETS[0].sky, PLANETS[0].fog);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 140);
camera.position.set(0, 2.4, 12);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const ambientLight = new THREE.HemisphereLight(0xb9e6ff, 0x1b1220, 1.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(6, 9, 8);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x65c7ff, 2.2, 40);
rimLight.position.set(-5, 4, 5);
scene.add(rimLight);

const flameLight = new THREE.PointLight(0xff8c2a, 0, 12);
scene.add(flameLight);

const rocket = createRocket();
rocket.position.set(0, START_Y, 0);
scene.add(rocket);

const astronaut = createAstronaut();
astronaut.visible = false;
scene.add(astronaut);

const launchPad = createLaunchPad();
scene.add(launchPad);

const launchSpectators = createLaunchSpectators();
scene.add(launchSpectators);

const planetSurface = new THREE.Group();
scene.add(planetSurface);
const surfaceViews = SURFACE_LEVELS.map(level => createSurfaceAdventureView(createAstronaut, level));
let surfaceView = surfaceViews[0];
surfaceViews.forEach(view => scene.add(view.group));

const destinationOrbs = createDestinationOrbs();
scene.add(destinationOrbs);

const starField = createStarField();
scene.add(starField);

const trail = createTrailSystem();
scene.add(trail.points);

const jetpackExhaust = createJetpackExhaustSystem();
scene.add(jetpackExhaust.points);

const blackHole = createBlackHoleVortex();
scene.add(blackHole);

const pointerRaycaster = new THREE.Raycaster();
const steeringPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const pointer = {
  normalized: new THREE.Vector2(0, 0),
  world: new THREE.Vector3(0, START_Y, 0),
  hasInput: false
};
const steeringTarget = new THREE.Vector3(0, START_Y, 0);
const blackHolePullTarget = new THREE.Vector3();
const keys = new Set();

let currentPlanetIndex = 0;
let targetPlanetIndex = 0;
let launchStart = null;
let returningToStation = false;
const returnOrigin = new THREE.Vector3();
let countdownStart = null;
let pendingLaunchTargetIndex = null;
let flightMode = 'ready';
let lastTime = performance.now();
let astronautVelocityX = 0;
let astronautVelocityY = 0;
let jetpackActive = false;
let lastLandedX = 0;
let hasLeftLaunchpad = false;
let hasSwappedDestinationScene = false;
let blackHoleDangerStart = null;
let blackHoleSequenceStart = null;
let isBlackHoleSequenceActive = false;

launchButton.addEventListener('click', launchToSelectedPlanet);
actionButton.addEventListener('click', handleContextAction);
nextButton.addEventListener('click', chooseNextPlanet);
resetButton.addEventListener('click', resetExperience);
window.addEventListener('resize', resizeRenderer);
window.addEventListener('pointermove', updatePointerTarget);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && flightMode === 'walking') {
    event.preventDefault();
  }

  if (event.repeat) return;
  keys.add(event.code);
  if (event.code === 'KeyE') handleContextAction();
  if (event.code === 'KeyN') chooseNextPlanet();
  if (event.code === 'Space' && flightMode === 'ready') launchToSelectedPlanet();
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());

resetExperience();
requestAnimationFrame(animate);

function animate(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const elapsed = launchStart ? now - launchStart : 0;
  const progress = flightMode === 'launching' ? Math.min(elapsed / LAUNCH_TIME_MS, 1) : 0;
  const throttle = flightMode === 'launching' ? throttleCurve(progress) : 0;

  if (flightMode === 'countdown') {
    updateLaunchCountdown(now);
  } else if (flightMode === 'launching') {
    updateRocketFlight(dt, now, progress);
    swapDestinationSceneAtApex(progress);

    const altitude = Math.round(easeOutCubic(progress) * 112000);
    const throttleText = progress < 0.13 ? 'Ignition' : progress < 0.66 ? 'Full burn' : 'Landing burn';
    updateHud(altitude, throttleText, progress < 0.72 ? 'Mouse guided flight' : 'Landing sequence');

    if (progress >= 1) {
      completeLanding();
    }
  } else if (flightMode === 'walking') {
    if (isBlackHoleSequenceActive) {
      updateBlackHoleSequence(dt, now);
    } else {
      updateAstronaut(dt, now);
      updateBlackHoleRisk(now);
    }
  } else {
    jetpackActive = false;
    blackHoleDangerStart = null;
  }

  animateRocketFlames(now, throttle);
  animateJetpackFlames(now, jetpackActive);
  updateTrail(dt, throttle);
  updateJetpackExhaust(dt, now, jetpackActive);
  updateBlackHoleVortex(now, dt);
  updateLaunchSpectators(now, dt);
  updateCamera(dt);
  if (surfaceAdventure.vortex.active) {
    const projected = blackHole.position.clone().project(camera);
    surfaceAdventure.vortex.x = (projected.x + 1) * window.innerWidth / 2;
    surfaceAdventure.vortex.y = (1 - projected.y) * window.innerHeight / 2;
  }
  updateDestinationOrbs(now, dt);
  updatePlanetSurface(now, dt);

  starField.rotation.y += dt * 0.01;
  launchPad.rotation.y += Math.sin(now * 0.001) * dt * 0.006;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function launchToSelectedPlanet() {
  if (flightMode !== 'ready' && flightMode !== 'landed') return;

  if (flightMode !== 'ready' && targetPlanetIndex === currentPlanetIndex) {
    targetPlanetIndex = getNextPlanetIndex(currentPlanetIndex);
  }

  if (LAUNCH_COUNTDOWN_ENABLED) {
    startLaunchCountdown();
    return;
  }

  beginLaunchFlight();
}

export function returnToStation(contactReturn = false) {
  if (flightMode !== 'landed' || launchButton.disabled || (!contactReturn && document.body.dataset.rescueNpcState !== 'boarded')) return;
  returningToStation = true;
  document.body.dataset.stationReturn = 'flying';
  returnOrigin.copy(rocket.position);
  keys.clear();
  beginLaunchFlight();
}

function startLaunchCountdown() {
  resetBlackHoleState();
  resetLaunchCountdownState();
  pendingLaunchTargetIndex = targetPlanetIndex;
  countdownStart = performance.now();
  astronaut.visible = false;
  jetpackActive = false;
  flightMode = 'countdown';
  launchButton.disabled = true;
  actionButton.disabled = true;
  nextButton.disabled = true;
  updateHud(hasLeftLaunchpad ? 112000 : 0, 'Counting down', 'T-3');
  updateUi();
}

function updateLaunchCountdown(now) {
  if (countdownStart === null) {
    beginLaunchFlight();
    return;
  }

  const elapsed = now - countdownStart;
  const stepDuration = LAUNCH_COUNTDOWN_MS / LAUNCH_COUNTDOWN_STEPS.length;
  const stepIndex = THREE.MathUtils.clamp(Math.floor(elapsed / stepDuration), 0, LAUNCH_COUNTDOWN_STEPS.length - 1);
  const countdownText = LAUNCH_COUNTDOWN_STEPS[stepIndex];
  const altitude = hasLeftLaunchpad ? 112000 : 0;

  launchButton.textContent = countdownText === 'Launch!' ? 'Launching...' : `Launching in ${countdownText}`;
  updateHud(altitude, 'Counting down', countdownText === 'Launch!' ? 'Launch!' : `T-${countdownText}`);
  helpLabel.textContent = `Launch countdown active: ${countdownText} Keep hands clear of the blast zone.`;

  if (elapsed >= LAUNCH_COUNTDOWN_MS) {
    beginLaunchFlight();
  }
}

function beginLaunchFlight() {
  leaveSurfaceAdventure();
  if (pendingLaunchTargetIndex !== null) {
    targetPlanetIndex = pendingLaunchTargetIndex;
  }

  resetBlackHoleState();
  resetLaunchCountdownState();
  astronaut.visible = false;
  jetpackActive = false;
  hasSwappedDestinationScene = false;
  flightMode = 'launching';
  launchStart = performance.now();
  launchButton.disabled = true;
  actionButton.disabled = true;
  nextButton.disabled = true;
  launchButton.textContent = `Flying to ${returningToStation ? 'Space Station' : PLANETS[targetPlanetIndex].name}...`;
  launchPad.visible = !hasLeftLaunchpad && rocket.position.y <= START_Y + 0.4;
  updateHud(0, 'Ignition', 'Mouse guided flight');
  updateUi();
}

function resetLaunchCountdownState() {
  countdownStart = null;
  pendingLaunchTargetIndex = null;
}

function getNextPlanetIndex(fromIndex) {
  return (fromIndex + 1) % PLANETS.length;
}

function chooseNextPlanet() {
  if (flightMode === 'launching' || flightMode === 'countdown' || flightMode === 'walking') return;
  targetPlanetIndex = (targetPlanetIndex + 1) % PLANETS.length;
  if (targetPlanetIndex === currentPlanetIndex) {
    targetPlanetIndex = getNextPlanetIndex(targetPlanetIndex);
  }
  updateUi();
}

function handleContextAction() {
  if (flightMode === 'landed') {
    exitRocket();
  } else if (flightMode === 'walking' && surfaceAdventure.active && surfaceAdventure.run.canEnterGarden) {
    surfaceAdventure.run.enterGarden();
    document.body.dataset.contactGarden = 'garden';
    surfaceView.update(surfaceAdventure.run);
    updateUi();
  } else if (flightMode === 'walking' && surfaceAdventure.active && surfaceAdventure.run.canWelcome) {
    surfaceAdventure.run.welcome();
    document.body.dataset.contactGarden = 'welcomed';
    surfaceView.update(surfaceAdventure.run);
    updateUi();
  } else if (flightMode === 'walking' && canBoardRocket() && !isBlackHoleSequenceActive) {
    enterRocket();
  }
}

function exitRocket() {
  resetBlackHoleState();
  resetLaunchCountdownState();
  flightMode = 'walking';
  astronaut.visible = true;
  astronaut.position.set(rocket.position.x + 1.05, ASTRONAUT_GROUND_Y, 0.18);
  astronaut.rotation.set(0, 0, 0);
  astronaut.scale.setScalar(1);
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  jetpackActive = false;
  rocket.rotation.set(0, 0, 0);
  if (surfaceAdventure.enabled) {
    surfaceAdventure.active = true;
    surfaceView.group.visible = true;
    planetSurface.visible = false;
    if (surfaceAdventure.run.level.kind === 'theft') {
      surfaceAdventure.run.startTheft();
      document.body.dataset.rocketTheftState = 'stealing';
      document.body.dataset.rocketTheftPlanet = surfaceAdventure.run.level.name;
    }
    surfaceView.update(surfaceAdventure.run);
  }
  updateHud(112000, 'Suit ready', 'Exploring');
  updateUi();
}

function enterRocket() {
  if (surfaceAdventure.run.level.kind === 'theft') return;
  surfaceAdventure.run.board();
  surfaceAdventure.active = false;
  surfaceView.group.visible = false;
  planetSurface.visible = true;
  resetBlackHoleState();
  resetLaunchCountdownState();
  flightMode = 'landed';
  astronaut.visible = false;
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  jetpackActive = false;
  if (!surfaceAdventure.enabled) rocket.position.x = THREE.MathUtils.lerp(rocket.position.x, 0, 0.45);
  updateHud(112000, 'Docked', 'Ready for next planet');
  updateUi();
}

function completeLanding() {
  if (returningToStation) {
    // Run the established cleanup listeners only after touchdown, not at departure.
    resetButton.click();
    return;
  }
  const planet = PLANETS[targetPlanetIndex];
  const level = SURFACE_LEVELS[targetPlanetIndex];
  currentPlanetIndex = targetPlanetIndex;
  targetPlanetIndex = getNextPlanetIndex(currentPlanetIndex);

  resetBlackHoleState();
  resetLaunchCountdownState();
  flightMode = 'landed';
  launchStart = null;
  rocket.position.set(lastLandedX, LAND_Y, 0);
  rocket.rotation.set(0, 0, 0);
  rocket.visible = true;
  flameLight.intensity = 0;
  launchPad.visible = false;
  launchSpectators.visible = false;
  hasLeftLaunchpad = true;
  surfaceAdventure.enabled = Boolean(level);
  surfaceView = surfaceViews[currentPlanetIndex] ?? surfaceViews[0];
  surfaceAdventure.run = createSurfaceRun(level ?? SPROUT_LEVEL);
  if (level?.kind === 'aliens') {
    surfaceAdventure.run.prepareContact(
      document.body.dataset.translatorBadge === 'acquired',
      document.body.dataset.firstContactState === 'complete'
    );
    document.body.dataset.contactGarden = surfaceAdventure.run.contactStage;
  }
  if (level?.kind !== 'theft') {
    document.body.dataset.rocketTheftState = 'idle';
    document.body.dataset.rocketTheftPlanet = '';
  }
  surfaceView.group.position.set(lastLandedX, ASTRONAUT_GROUND_Y, 0);

  if (!hasSwappedDestinationScene) {
    rebuildPlanetSurface(planet);
    setPlanetAtmosphere(planet);
    hasSwappedDestinationScene = true;
  }

  launchButton.disabled = false;
  actionButton.disabled = false;
  nextButton.disabled = false;
  launchButton.textContent = 'Fly to next planet';
  updateHud(112000, 'Landed', 'Landed');
  updateUi();
}

function swapDestinationSceneAtApex(progress) {
  if (hasSwappedDestinationScene || flightMode !== 'launching' || progress < SCENE_SWAP_PROGRESS) {
    return;
  }

  const destination = PLANETS[targetPlanetIndex];
  hasSwappedDestinationScene = true;
  if (returningToStation) {
    planetSurface.visible = false;
    launchPad.visible = true;
    hasLeftLaunchpad = false;
    setPlanetAtmosphere(PLANETS[0]);
    planetLabel.textContent = 'Space Station';
    loopStatusLabel.textContent = 'Station approach';
    return;
  }
  hasLeftLaunchpad = true;
  launchPad.visible = false;
  launchSpectators.visible = false;
  rebuildPlanetSurface(destination);
  setPlanetAtmosphere(destination);
  planetLabel.textContent = destination.name;
  loopStatusLabel.textContent = 'Destination approach';
}

function updateRocketFlight(dt, now, progress) {
  const eased = easeInOutCubic(progress);
  const arcY = bezier(returningToStation ? returnOrigin.y : START_Y, SPACE_Y, SPACE_Y - 0.6, returningToStation ? START_Y : LAND_Y, eased);
  const target = getSteeringTarget(arcY, progress);

  if (returningToStation && progress < 0.2) {
    target.x = THREE.MathUtils.lerp(returnOrigin.x, target.x, THREE.MathUtils.smoothstep(progress, 0, 0.2));
  }

  if (progress > 0.72) {
    const landingProgress = THREE.MathUtils.smoothstep(progress, 0.72, 1);
    target.x = THREE.MathUtils.lerp(target.x, returningToStation ? 0 : lastLandedX, landingProgress);
    if (returningToStation) target.y = THREE.MathUtils.lerp(target.y, START_Y, landingProgress);
    target.z = THREE.MathUtils.lerp(target.z, 0, landingProgress);
  } else {
    lastLandedX = THREE.MathUtils.clamp(target.x, -2.2, 2.2);
  }

  const previousX = rocket.position.x;
  const previousY = rocket.position.y;
  const previousZ = rocket.position.z;
  const followSpeed = pointer.hasInput && progress < 0.78 ? 7.4 : 5.2;
  const followAlpha = 1 - Math.exp(-followSpeed * dt);

  rocket.position.lerp(target, followAlpha);

  const safeDt = Math.max(dt, 0.001);
  const velocityX = (rocket.position.x - previousX) / safeDt;
  const velocityY = (rocket.position.y - previousY) / safeDt;
  const velocityZ = (rocket.position.z - previousZ) / safeDt;
  const launchWobble = Math.sin(now * 0.004) * 0.018 * (1 - progress);
  const desiredLeanZ = THREE.MathUtils.clamp(-velocityX * 0.028, -0.44, 0.44) + launchWobble;
  const desiredLeanX = THREE.MathUtils.clamp(velocityZ * 0.045 - velocityY * 0.002, -0.3, 0.3);
  const leanAlpha = 1 - Math.exp(-9 * dt);

  rocket.rotation.z = THREE.MathUtils.lerp(rocket.rotation.z, desiredLeanZ, leanAlpha);
  rocket.rotation.x = THREE.MathUtils.lerp(rocket.rotation.x, desiredLeanX, leanAlpha);
}

function getSteeringTarget(baseY, progress) {
  steeringTarget.set(0, baseY, 0);

  if (!pointer.hasInput) {
    return steeringTarget;
  }

  pointerRaycaster.setFromCamera(pointer.normalized, camera);
  pointerRaycaster.ray.intersectPlane(steeringPlane, pointer.world);

  const steeringAuthority = 1 - THREE.MathUtils.smoothstep(progress, 0.72, 0.94);
  const mouseYInfluence = THREE.MathUtils.lerp(0.2, 0.35, steeringAuthority);
  const desiredX = THREE.MathUtils.clamp(pointer.world.x, -STEERING_LIMIT_X, STEERING_LIMIT_X);
  const desiredY = THREE.MathUtils.clamp(baseY + (pointer.world.y - baseY) * mouseYInfluence, START_Y, SPACE_Y + 0.8);
  const desiredZ = THREE.MathUtils.clamp(-pointer.normalized.y * STEERING_LIMIT_Z * 0.7, -STEERING_LIMIT_Z, STEERING_LIMIT_Z);

  steeringTarget.set(
    THREE.MathUtils.lerp(0, desiredX, steeringAuthority),
    desiredY,
    desiredZ * steeringAuthority
  );

  return steeringTarget;
}

function updatePointerTarget(event) {
  pointer.normalized.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.normalized.y = -(event.clientY / window.innerHeight) * 2 + 1;
  pointer.hasInput = true;
}

function updateAstronaut(dt, now) {
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const direction = Number(right) - Number(left);
  const desiredVelocity = direction * WALK_SPEED;
  const localX = astronaut.position.x - surfaceView.group.position.x;
  const level = surfaceAdventure.run.level;
  const onVines = surfaceAdventure.active && level.kind === 'vines' && localX > level.obstacleLeft - level.radius && localX < level.obstacleRight + level.radius;
  const groundY = ASTRONAUT_GROUND_Y + (onVines ? level.obstacleHeight : 0);
  const isGrounded = astronaut.position.y <= groundY + 0.01;

  jetpackActive = keys.has('Space');

  const movementResponse = surfaceAdventure.active && level.kind === 'ice' ? (direction ? 2.8 : 1.55) : 12;
  astronautVelocityX = THREE.MathUtils.lerp(astronautVelocityX, desiredVelocity, 1 - Math.exp(-movementResponse * dt));
  astronautVelocityY += (jetpackActive ? JETPACK_THRUST : GRAVITY) * dt;
  astronautVelocityY = THREE.MathUtils.clamp(astronautVelocityY, MAX_FALL_SPEED, MAX_RISE_SPEED);

  if (surfaceAdventure.active) {
    const previous = { x: localX, y: astronaut.position.y - ASTRONAUT_GROUND_Y };
    surfaceAdventure.run.tick(dt, previous);
    const result = resolveSurfaceMovement(previous, {
      x: previous.x + astronautVelocityX * dt,
      y: Math.min(previous.y + astronautVelocityY * dt, ASTRONAUT_MAX_Y - ASTRONAUT_GROUND_Y)
    }, level, level.kind === 'ice' ? surfaceAdventure.run.columnBroken : level.kind === 'aliens' ? surfaceAdventure.run.contactStage !== 'blocked' : surfaceAdventure.run.vent.safe);
    astronaut.position.x = surfaceView.group.position.x + result.x;
    astronaut.position.y = ASTRONAUT_GROUND_Y + result.y;
    if (result.blockedX) astronautVelocityX = 0;
    if (result.blockedY) astronautVelocityY = 0;
    const previousObjective = surfaceAdventure.run.objective;
    surfaceAdventure.run.update(dt, result);
    surfaceView.update(surfaceAdventure.run);
    updateTheftRocketDuringSurface(now);
    if (surfaceAdventure.run.objective !== previousObjective) updateUi();
  } else {
    astronaut.position.x = THREE.MathUtils.clamp(astronaut.position.x + astronautVelocityX * dt, -WALK_LIMIT, WALK_LIMIT);
    astronaut.position.y = THREE.MathUtils.clamp(astronaut.position.y + astronautVelocityY * dt, ASTRONAUT_GROUND_Y, ASTRONAUT_MAX_Y);
  }

  if (astronaut.position.y <= ASTRONAUT_GROUND_Y + 0.001 && astronautVelocityY < 0) {
    astronaut.position.y = ASTRONAUT_GROUND_Y;
    astronautVelocityY = 0;
  }

  if (astronaut.position.y >= ASTRONAUT_MAX_Y - 0.001 && astronautVelocityY > 0) {
    astronautVelocityY = 0;
  }

  const walkBob = isGrounded ? Math.sin(now * 0.01) * 0.025 * Math.abs(direction) : 0;
  astronaut.children[0].position.y = 0.46 + walkBob;
  astronaut.rotation.z = THREE.MathUtils.lerp(astronaut.rotation.z, -direction * 0.12, 1 - Math.exp(-8 * dt));
  astronaut.rotation.x = THREE.MathUtils.lerp(astronaut.rotation.x, jetpackActive ? -0.08 : 0, 1 - Math.exp(-7 * dt));

  if (direction !== 0) {
    astronaut.rotation.y = direction > 0 ? 0.22 : -0.22;
  }

  updateAstronautArms(direction, isGrounded, jetpackActive, now, dt);

  const nearRocket = isAstronautNearRocket();
  const boardable = canBoardRocket();
  const gardenAction = surfaceAdventure.run.canEnterGarden || surfaceAdventure.run.canWelcome;
  const theftState = surfaceAdventure.active && level.kind === 'theft' ? surfaceAdventure.run.state : null;
  actionButton.disabled = theftState ? true : !boardable && !gardenAction;
  actionButton.textContent = theftState === 'stealing' ? 'Rocket occupied' : theftState === 'stranded' ? 'Find another way off' : surfaceAdventure.run.canEnterGarden ? 'Use Translator at gate (E)' : surfaceAdventure.run.canWelcome ? 'Welcome alien (E)' : boardable ? 'Enter rocket (E)' : nearRocket && surfaceAdventure.active && surfaceAdventure.run.level.kind !== 'aliens' && !['rescued', 'boarded'].includes(surfaceAdventure.run.state) ? 'Bring crew to rocket' : nearRocket ? 'Land to enter rocket' : 'Return to rocket';
  if (theftState === 'stealing') {
    loopStatusLabel.textContent = 'Rocket theft!';
    throttleLabel.textContent = 'Unauthorized';
  } else if (theftState === 'stranded') {
    loopStatusLabel.textContent = 'Find another way off';
    throttleLabel.textContent = jetpackActive ? 'Jetpack' : 'Stranded';
  } else {
    loopStatusLabel.textContent = jetpackActive ? 'Jetpack firing' : boardable ? 'Ready to board' : 'Exploring';
    throttleLabel.textContent = jetpackActive ? 'Jetpack' : isGrounded ? 'Suit ready' : 'Coasting';
  }
}

function updateTheftRocketDuringSurface(now) {
  if (!surfaceAdventure.active || surfaceAdventure.run.level.kind !== 'theft') return;

  document.body.dataset.rocketTheftState = surfaceAdventure.run.state;
  document.body.dataset.rocketTheftPlanet = surfaceAdventure.run.level.name;

  if (surfaceAdventure.run.state === 'stealing') {
    const progress = surfaceAdventure.run.theftProgress;
    const eased = easeInOutCubic(progress);
    rocket.visible = true;
    rocket.position.x = surfaceView.group.position.x + eased * 4.4;
    rocket.position.y = LAND_Y + easeOutCubic(progress) * 8.2;
    rocket.position.z = -eased * 0.9;
    rocket.rotation.z = -0.15 - eased * 0.45 + Math.sin(now * 0.015) * 0.024;
    rocket.rotation.x = -0.08 - eased * 0.18;
    return;
  }

  if (surfaceAdventure.run.state === 'stranded') {
    rocket.visible = false;
  }
}

function updateAstronautArms(direction, isGrounded, isJetpacking, now, dt) {
  const leftArm = astronaut.getObjectByName('leftArm');
  const rightArm = astronaut.getObjectByName('rightArm');
  if (!leftArm || !rightArm) return;

  const armAlpha = 1 - Math.exp(-10 * dt);
  const walkSwing = isGrounded ? Math.sin(now * 0.012) * 0.18 * Math.abs(direction) : 0.05 * Math.sin(now * 0.01);
  const jetpackBrace = isJetpacking ? 0.22 : 0;
  const shoulderLift = isJetpacking ? -0.18 : 0;

  const leftTargetZ = -0.34 - walkSwing - jetpackBrace;
  const rightTargetZ = 0.34 + walkSwing + jetpackBrace;
  const targetX = shoulderLift;

  leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, leftTargetZ, armAlpha);
  rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, rightTargetZ, armAlpha);
  leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, targetX, armAlpha);
  rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, targetX, armAlpha);
}

function updateBlackHoleRisk(now) {
  if (isBlackHoleSequenceActive) return;

  const nearCeiling = astronaut.position.y >= ASTRONAUT_MAX_Y - BLACK_HOLE_DANGER_ZONE;
  const stillJetpackingAtCeiling = jetpackActive && nearCeiling;

  if (!stillJetpackingAtCeiling) {
    if (blackHoleDangerStart !== null) {
      blackHoleDangerStart = null;
      updateUi();
    }
    return;
  }

  if (blackHoleDangerStart === null) {
    blackHoleDangerStart = now;
  }

  const heldMs = now - blackHoleDangerStart;
  const remainingSeconds = Math.max(0, Math.ceil((BLACK_HOLE_HOLD_MS - heldMs) / 1000));

  if (heldMs >= BLACK_HOLE_WARNING_MS) {
    throttleLabel.textContent = 'Danger';
    loopStatusLabel.textContent = `Vortex warning: ${remainingSeconds}s`;
    helpLabel.textContent = 'Jetpack ceiling unstable! Drop lower now or a black hole will reset you to the rocket.';
  }

  if (heldMs >= BLACK_HOLE_HOLD_MS) {
    startBlackHoleSequence(now);
  }
}

function startBlackHoleSequence(now) {
  if (isBlackHoleSequenceActive) return;

  isBlackHoleSequenceActive = true;
  blackHoleSequenceStart = now;
  blackHoleDangerStart = null;
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  jetpackActive = false;
  keys.delete('Space');
  const vortexDirection = astronaut.position.x > 2.65 ? -1 : 1;
  blackHole.position.set(
    astronaut.position.x + BLACK_HOLE_OFFSET_X * vortexDirection,
    astronaut.position.y + BLACK_HOLE_OFFSET_Y,
    astronaut.position.z + BLACK_HOLE_OFFSET_Z
  );
  blackHole.scale.setScalar(BLACK_HOLE_START_SCALE);
  blackHole.visible = true;
  surfaceAdventure.vortex.active = true;
  surfaceAdventure.vortex.progress = 0;
  if (surfaceAdventure.active) surfaceView.startVortex();
  launchButton.disabled = true;
  actionButton.disabled = true;
  nextButton.disabled = true;
  throttleLabel.textContent = 'Vortex';
  loopStatusLabel.textContent = 'Black hole!';
  helpLabel.textContent = 'Too high for too long! A black hole opened nearby and is pulling the astronaut in.';
}

function updateBlackHoleSequence(dt, now) {
  if (!isBlackHoleSequenceActive || blackHoleSequenceStart === null) return;

  const sequenceProgress = THREE.MathUtils.clamp((now - blackHoleSequenceStart) / BLACK_HOLE_SEQUENCE_MS, 0, 1);
  const eased = easeInOutCubic(sequenceProgress);
  surfaceAdventure.vortex.progress = sequenceProgress;
  if (surfaceAdventure.active) surfaceView.updateVortex(sequenceProgress, blackHole.position.clone().sub(surfaceView.group.position));
  const pullStrength = 0.035 + eased * 0.18;
  const spiralWobble = (1 - sequenceProgress) * 0.055;

  blackHolePullTarget.set(blackHole.position.x, blackHole.position.y - 0.08, blackHole.position.z);
  astronaut.position.lerp(blackHolePullTarget, pullStrength);
  astronaut.position.x += Math.sin(now * 0.024) * spiralWobble;
  astronaut.position.y += Math.cos(now * 0.02) * spiralWobble;
  astronaut.rotation.z += dt * (7 + sequenceProgress * 24);
  astronaut.rotation.y += dt * (5 + sequenceProgress * 16);
  astronaut.rotation.x += dt * (3 + sequenceProgress * 12);
  astronaut.scale.setScalar(THREE.MathUtils.lerp(1, 0.12, eased));
  loopStatusLabel.textContent = sequenceProgress < 0.7 ? 'Getting sucked in!' : 'Checkpoint reset';
  throttleLabel.textContent = 'Vortex';

  if (sequenceProgress >= 1) {
    resetToLastCheckpoint();
  }
}

function updateBlackHoleVortex(now, dt) {
  if (!blackHole.visible) return;

  const sequenceProgress = blackHoleSequenceStart
    ? THREE.MathUtils.clamp((now - blackHoleSequenceStart) / BLACK_HOLE_SEQUENCE_MS, 0, 1)
    : 0;
  const pulse = 1 + Math.sin(now * 0.018) * 0.08;
  const vortexScale = THREE.MathUtils.lerp(BLACK_HOLE_START_SCALE, BLACK_HOLE_END_SCALE, easeOutCubic(sequenceProgress));
  blackHole.scale.setScalar(vortexScale * pulse);
  blackHole.rotation.z -= dt * (2.8 + sequenceProgress * 8);
  blackHole.rotation.y += dt * (1.2 + sequenceProgress * 3);

  blackHole.children.forEach((child, index) => {
    child.rotation.z += dt * (index % 2 === 0 ? 2.3 + index : -1.8 - index);
    child.rotation.x += dt * 0.25 * (index + 1);
  });
}

function resetToLastCheckpoint() {
  surfaceAdventure.active = false;
  surfaceAdventure.run.reset();
  surfaceView.group.visible = false;
  planetSurface.visible = true;
  resetBlackHoleState();
  resetLaunchCountdownState();
  flightMode = 'landed';
  launchStart = null;
  jetpackActive = false;
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  keys.delete('Space');
  rocket.visible = true;
  rocket.position.set(lastLandedX, LAND_Y, 0);
  rocket.rotation.set(0, 0, 0);
  astronaut.visible = false;
  astronaut.position.set(rocket.position.x + 1.05, ASTRONAUT_GROUND_Y, 0.18);
  astronaut.rotation.set(0, 0, 0);
  astronaut.scale.setScalar(1);
  launchButton.disabled = false;
  actionButton.disabled = false;
  nextButton.disabled = false;
  updateHud(112000, 'Checkpoint', 'Vortex reset');
  updateUi();
}

function resetBlackHoleState() {
  surfaceAdventure.vortex.active = false;
  surfaceAdventure.vortex.progress = 0;
  blackHoleDangerStart = null;
  blackHoleSequenceStart = null;
  isBlackHoleSequenceActive = false;
  blackHole.visible = false;
  blackHole.scale.setScalar(1);
  astronaut.scale.setScalar(1);
}

function isAstronautNearRocket() {
  return rocket.visible && Math.abs(astronaut.position.x - rocket.position.x) < 1.35;
}

function canBoardRocket() {
  if (surfaceAdventure.active && surfaceAdventure.run.level.kind === 'theft') return false;
  if (surfaceAdventure.active && surfaceAdventure.run.level.kind !== 'aliens' && !['rescued', 'boarded'].includes(surfaceAdventure.run.state)) return false;
  return isAstronautNearRocket() && astronaut.position.y <= ASTRONAUT_GROUND_Y + 0.18;
}

function leaveSurfaceAdventure() {
  surfaceAdventure.enabled = false;
  surfaceAdventure.active = false;
  surfaceAdventure.run.reset();
  surfaceView.group.visible = false;
  planetSurface.visible = hasLeftLaunchpad;
}

function rebuildPlanetSurface(planet) {
  while (planetSurface.children.length > 0) {
    const child = planetSurface.children.pop();
    child.traverse?.((node) => {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) {
        node.material.forEach((material) => material.dispose?.());
      } else {
        node.material?.dispose?.();
      }
    });
  }

  const terrainMaterial = new THREE.MeshStandardMaterial({
    color: planet.surface,
    roughness: 0.85,
    metalness: 0.04
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: planet.accent,
    emissive: planet.accent,
    emissiveIntensity: 0.16,
    roughness: 0.45,
    metalness: 0.1
  });

  const ground = new THREE.Mesh(new THREE.BoxGeometry(14, 0.42, 4.8, 1, 1, 1), terrainMaterial);
  ground.position.y = LAND_Y - 0.42;
  planetSurface.add(ground);

  const horizon = new THREE.Mesh(new THREE.SphereGeometry(7.5, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2), terrainMaterial);
  horizon.position.set(0, LAND_Y - 1.8, -3.7);
  horizon.scale.y = 0.32;
  planetSurface.add(horizon);

  for (let i = 0; i < 18; i += 1) {
    const x = -6.2 + i * 0.72 + Math.sin(i * 7.11) * 0.22;
    const z = -1.5 + Math.cos(i * 3.77) * 0.85;
    const size = 0.16 + ((i * 13) % 7) * 0.025;
    const prop = createPlanetProp(planet.props, size, accentMaterial);
    prop.position.set(x, LAND_Y - 0.1, z);
    prop.rotation.y = i * 0.77;
    planetSurface.add(prop);
  }

  planetSurface.visible = true;
}

function createPlanetProp(type, size, material) {
  const group = new THREE.Group();

  if (type === 'sprouts') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.18, size * 0.22, size * 1.8, 8), material);
    stem.position.y = size * 0.9;
    group.add(stem);
    const leafA = new THREE.Mesh(new THREE.SphereGeometry(size * 0.55, 12, 8), material);
    leafA.position.set(size * 0.36, size * 1.55, 0);
    leafA.scale.set(1.2, 0.45, 0.7);
    group.add(leafA);
    const leafB = leafA.clone();
    leafB.position.x = -size * 0.36;
    group.add(leafB);
  } else if (type === 'crystals') {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(size * 0.55, size * 2.4, 5), material);
    crystal.position.y = size * 1.1;
    group.add(crystal);
    const crystalB = crystal.clone();
    crystalB.scale.set(0.65, 0.8, 0.65);
    crystalB.position.set(size * 0.55, size * 0.75, size * 0.25);
    group.add(crystalB);
  } else if (type === 'mischief') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.34, size * 0.48, size * 1.2, 7), material);
    base.position.y = size * 0.55;
    group.add(base);
    const top = new THREE.Mesh(new THREE.ConeGeometry(size * 0.56, size * 1.7, 7), material);
    top.position.y = size * 1.5;
    top.rotation.z = size % 2 ? 0.2 : -0.2;
    group.add(top);
  } else {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(size * 0.9), material);
    shard.position.y = size * 0.9;
    shard.scale.y = 1.4;
    group.add(shard);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(size * 0.8, 12, 8), material);
    mound.position.y = size * 0.25;
    mound.scale.y = 0.35;
    group.add(mound);
  }

  return group;
}

function setPlanetAtmosphere(planet) {
  scene.background = new THREE.Color(planet.sky);
  scene.fog = new THREE.FogExp2(planet.sky, planet.fog);
  rimLight.color.setHex(planet.accent);
}

function createRocket() {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f6ff, metalness: 0.35, roughness: 0.42 });
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff4658, metalness: 0.25, roughness: 0.35 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x121a2f, metalness: 0.2, roughness: 0.4 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x68d8ff,
    emissive: 0x13395a,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.35,
    thickness: 0.3
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 2.85, 48), bodyMaterial);
  body.position.y = 1.55;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.05, 48), redMaterial);
  nose.position.y = 3.5;
  group.add(nose);

  const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.34, 32), darkMaterial);
  engine.position.y = 0.02;
  group.add(engine);

  const windowFrame = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 12, 40), redMaterial);
  windowFrame.position.set(0, 2.25, 0.525);
  group.add(windowFrame);

  const windowGlass = new THREE.Mesh(new THREE.CircleGeometry(0.22, 40), glassMaterial);
  windowGlass.position.set(0, 2.25, 0.565);
  group.add(windowGlass);

  const finGeometry = createFinGeometry();
  const finMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4658,
    metalness: 0.15,
    roughness: 0.38,
    side: THREE.DoubleSide
  });

  const fins = [
    [0.49, 0.84, -0.06, 0, 1],
    [-0.49, 0.84, -0.06, 0, -1],
    [0.06, 0.84, -0.49, Math.PI / 2, 1],
    [-0.06, 0.84, 0.49, -Math.PI / 2, 1]
  ];

  for (const [x, y, z, rotY, scaleX] of fins) {
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.set(x, y, z);
    fin.rotation.y = rotY;
    fin.scale.x = scaleX;
    group.add(fin);
  }

  for (const y of [1.05, 2.85]) {
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.535, 0.535, 0.12, 48), redMaterial);
    stripe.position.y = y;
    group.add(stripe);
  }

  const flameGroup = new THREE.Group();
  flameGroup.name = 'flameGroup';

  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.43, 1.35, 32),
    new THREE.MeshBasicMaterial({ color: 0xff7a21, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending })
  );
  outerFlame.rotation.x = Math.PI;
  outerFlame.position.y = -0.58;
  flameGroup.add(outerFlame);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.92, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff1a6, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
  );
  innerFlame.rotation.x = Math.PI;
  innerFlame.position.y = -0.48;
  flameGroup.add(innerFlame);

  group.add(flameGroup);
  return group;
}

function createAstronaut() {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0xf4fbff, roughness: 0.35, metalness: 0.1 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.3, metalness: 0.2 });
  const glove = new THREE.MeshStandardMaterial({ color: 0x27344d, roughness: 0.42, metalness: 0.08 });
  const visorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x5fd4ff,
    emissive: 0x123a58,
    roughness: 0.06,
    metalness: 0.1,
    transmission: 0.18,
    thickness: 0.2
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.48, 8, 18), suit);
  body.position.y = 0.46;
  group.add(body);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), suit);
  helmet.position.y = 1.06;
  group.add(helmet);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 10), visorMaterial);
  visor.position.set(0, 1.06, 0.22);
  visor.scale.set(1, 0.62, 0.35);
  group.add(visor);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.16), trim);
  backpack.position.set(0, 0.55, -0.26);
  group.add(backpack);

  const armData = [
    { name: 'leftArm', x: -0.32, baseRotation: -0.34 },
    { name: 'rightArm', x: 0.32, baseRotation: 0.34 }
  ];

  for (const { name, x, baseRotation } of armData) {
    const arm = new THREE.Group();
    arm.name = name;
    arm.position.set(x, 0.72, 0.04);
    arm.rotation.z = baseRotation;

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.36, 6, 12), suit);
    upper.position.y = -0.2;
    arm.add(upper);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.07, 12), trim);
    cuff.position.y = -0.43;
    arm.add(cuff);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), glove);
    hand.name = `${name}Hand`;
    hand.position.y = -0.52;
    hand.scale.set(1, 0.86, 1);
    arm.add(hand);

    group.add(arm);
  }

  for (const x of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 6, 10), suit);
    leg.position.set(x, 0.05, 0);
    group.add(leg);
  }

  const jetpackFlames = new THREE.Group();
  jetpackFlames.name = 'jetpackFlames';
  jetpackFlames.visible = false;
  jetpackFlames.position.set(0, 0.28, -0.36);

  for (const x of [-0.08, 0.08]) {
    const outer = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.42, 18),
      new THREE.MeshBasicMaterial({ color: 0xff8a2d, transparent: true, opacity: 0.76, blending: THREE.AdditiveBlending })
    );
    outer.rotation.x = Math.PI;
    outer.position.set(x, -0.18, 0);
    jetpackFlames.add(outer);

    const inner = new THREE.Mesh(
      new THREE.ConeGeometry(0.043, 0.28, 18),
      new THREE.MeshBasicMaterial({ color: 0xfff1a6, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
    );
    inner.rotation.x = Math.PI;
    inner.position.set(x, -0.13, 0.01);
    jetpackFlames.add(inner);
  }

  const jetpackLight = new THREE.PointLight(0xffb05c, 0, 4.5);
  jetpackLight.name = 'jetpackLight';
  jetpackLight.position.set(0, 0.12, -0.42);
  group.add(jetpackFlames);
  group.add(jetpackLight);

  return group;
}

function createFinGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.68, -0.76);
  shape.lineTo(0, -0.58);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 1
  });

  geometry.center();
  return geometry;
}

function createLaunchPad() {
  const group = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0x242b38, roughness: 0.75, metalness: 0.05 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x6f7d8f, roughness: 0.38, metalness: 0.75 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x43d7ff, transparent: true, opacity: 0.45 });

  const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.75, 0.35, 72), concrete);
  platform.position.y = -3.05;
  group.add(platform);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.04, 12, 80), glow);
  ring.position.y = -2.84;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const tower = new THREE.Group();
  for (let i = 0; i < 4; i += 1) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.8, 0.08), steel);
    beam.position.set(i % 2 === 0 ? -0.23 : 0.23, -1.12, i < 2 ? -0.23 : 0.23);
    tower.add(beam);
  }

  for (let i = 0; i < 7; i += 1) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.055, 0.055), steel);
    cross.position.set(0, -2.85 + i * 0.46, -0.23);
    cross.rotation.z = i % 2 === 0 ? 0.6 : -0.6;
    tower.add(cross);
  }

  tower.position.set(-1.55, 0, -0.35);
  group.add(tower);
  return group;
}

function createLaunchSpectators() {
  const group = new THREE.Group();
  group.name = 'launchSpectators';

  const placements = [
    [-3.15, -2.54, 0.58, 0.72, 0x6ee7ff],
    [-2.45, -2.53, 0.92, 0.65, 0xffd166],
    [-1.85, -2.56, 1.25, 0.7, 0xff7aa2],
    [1.85, -2.56, 1.2, 0.68, 0x9bff8a],
    [2.48, -2.53, 0.86, 0.74, 0xb69cff],
    [3.16, -2.55, 0.5, 0.66, 0xff9f5a]
  ];

  placements.forEach(([x, y, z, scale, accent], index) => {
    const spectator = createSpectator(accent, index);
    spectator.position.set(x, y, z);
    spectator.scale.setScalar(scale);
    spectator.userData.baseY = y;
    spectator.userData.phase = index * 0.9;
    group.add(spectator);
  });

  return group;
}

function createSpectator(accent, index) {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0xf5fbff, roughness: 0.42, metalness: 0.05 });
  const trim = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.36, metalness: 0.12 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23324d, roughness: 0.48, metalness: 0.08 });
  const visor = new THREE.MeshPhysicalMaterial({
    color: 0x66d8ff,
    emissive: 0x14304a,
    roughness: 0.08,
    transmission: 0.12,
    thickness: 0.14
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.28, 6, 12), suit);
  body.position.y = 0.34;
  group.add(body);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), suit);
  helmet.position.y = 0.72;
  group.add(helmet);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 8), visor);
  face.position.set(0, 0.72, 0.12);
  face.scale.set(1, 0.58, 0.3);
  group.add(face);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.045, 16), trim);
  belt.position.y = 0.29;
  group.add(belt);

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? 'leftWaveArm' : 'rightWaveArm';
    arm.position.set(side * 0.17, 0.48, 0.03);
    arm.rotation.z = side * (index % 2 === 0 ? 0.7 : 0.38);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.24, 5, 8), suit);
    sleeve.position.y = -0.11;
    arm.add(sleeve);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), dark);
    glove.position.y = -0.25;
    arm.add(glove);
    group.add(arm);
  }

  for (const x of [-0.08, 0.08]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.18, 5, 8), dark);
    leg.position.set(x, 0.07, 0);
    group.add(leg);
  }

  group.rotation.y = index < 3 ? 0.22 : -0.22;
  return group;
}

function updateLaunchSpectators(now, dt) {
  if (hasLeftLaunchpad) {
    launchSpectators.visible = false;
    return;
  }

  const shouldShow = flightMode === 'ready' || flightMode === 'countdown' || flightMode === 'launching';
  launchSpectators.visible = shouldShow;
  if (!shouldShow) return;

  launchSpectators.children.forEach((spectator) => {
    const phase = spectator.userData.phase;
    spectator.position.y = spectator.userData.baseY + Math.sin(now * 0.006 + phase) * 0.035;
    spectator.rotation.z = Math.sin(now * 0.004 + phase) * 0.045;

    const leftArm = spectator.getObjectByName('leftWaveArm');
    const rightArm = spectator.getObjectByName('rightWaveArm');
    const wave = Math.sin(now * 0.012 + phase) * 0.34;
    if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.55 - wave, 1 - Math.exp(-8 * dt));
    if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.55 + wave, 1 - Math.exp(-8 * dt));
  });
}

function createDestinationOrbs() {
  const group = new THREE.Group();
  PLANETS.forEach((planet, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: planet.surface,
      emissive: planet.accent,
      emissiveIntensity: 0.08,
      roughness: 0.6
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 18), material);
    orb.position.set(-1.1 + index * 1.1, 4.2 + Math.sin(index) * 0.2, -3.4);
    orb.userData.baseY = orb.position.y;
    group.add(orb);
  });
  return group;
}

function updateDestinationOrbs(now, dt) {
  destinationOrbs.children.forEach((orb, index) => {
    orb.rotation.y += dt * (0.35 + index * 0.08);
    orb.position.y = orb.userData.baseY + Math.sin(now * 0.0015 + index) * 0.08;
    orb.scale.setScalar(index === targetPlanetIndex ? 1.22 : 0.86);
  });
}

function createStarField() {
  const count = 900;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const radius = 34 + Math.random() * 55;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) + 6;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.055, transparent: true, opacity: 0.85, depthWrite: false })
  );
}

function createTrailSystem() {
  const count = 240;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lives = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    lives[i] = -1;
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -50;
    positions[i * 3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffb347,
    size: 0.09,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return {
    points: new THREE.Points(geometry, material),
    positions,
    velocities,
    lives,
    cursor: 0
  };
}

function createJetpackExhaustSystem() {
  const count = 220;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lives = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    lives[i] = -1;
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -50;
    positions[i * 3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffd8a3,
    size: 0.12,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return {
    points: new THREE.Points(geometry, material),
    positions,
    velocities,
    lives,
    cursor: 0
  };
}

function createBlackHoleVortex() {
  const group = new THREE.Group();
  group.visible = false;

  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x030006 });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x7a5cff,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x46d7ff,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), coreMaterial);
  group.add(core);

  const glow = new THREE.Mesh(new THREE.RingGeometry(0.55, 1.45, 56), glowMaterial);
  glow.rotation.x = Math.PI / 2.7;
  group.add(glow);

  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85 + i * 0.32, 0.025, 10, 88), ringMaterial);
    ring.rotation.x = Math.PI / 2 + i * 0.42;
    ring.rotation.y = i * 0.62;
    group.add(ring);
  }

  return group;
}

function animateRocketFlames(now, throttle) {
  const flameGroup = rocket.getObjectByName('flameGroup');
  const visible = throttle > 0.02;
  flameGroup.visible = visible;
  flameLight.intensity = visible ? 7.5 * throttle : 0;
  flameLight.position.set(rocket.position.x, rocket.position.y - 0.52, rocket.position.z + 0.2);

  if (!visible) return;

  const flicker = 1 + Math.sin(now * 0.03) * 0.08 + Math.random() * 0.08;
  flameGroup.scale.set(0.84 + throttle * 0.42, (0.74 + throttle * 0.55) * flicker, 0.84 + throttle * 0.42);
}

function animateJetpackFlames(now, active) {
  const flameGroup = astronaut.getObjectByName('jetpackFlames');
  const light = astronaut.getObjectByName('jetpackLight');

  flameGroup.visible = active;
  light.intensity = active ? 2.6 + Math.sin(now * 0.04) * 0.45 : 0;

  if (!active) return;

  const flicker = 1 + Math.sin(now * 0.05) * 0.12 + Math.random() * 0.1;
  flameGroup.scale.set(1 + Math.random() * 0.05, 0.85 + flicker * 0.28, 1 + Math.random() * 0.05);
  flameGroup.rotation.z = Math.sin(now * 0.02) * 0.045;
}

function updateTrail(dt, throttle) {
  const spawnCount = Math.floor(throttle * 8);

  for (let i = 0; i < spawnCount; i += 1) {
    recycleParticle(trail.cursor, throttle);
    trail.cursor = (trail.cursor + 1) % trail.lives.length;
  }

  for (let i = 0; i < trail.lives.length; i += 1) {
    if (trail.lives[i] <= 0) continue;

    const p = i * 3;
    trail.lives[i] -= dt;
    trail.positions[p] += trail.velocities[p] * dt;
    trail.positions[p + 1] += trail.velocities[p + 1] * dt;
    trail.positions[p + 2] += trail.velocities[p + 2] * dt;
    trail.velocities[p + 1] -= dt * 0.34;

    if (trail.lives[i] <= 0) {
      trail.positions[p + 1] = -50;
    }
  }

  trail.points.geometry.attributes.position.needsUpdate = true;
  trail.points.material.opacity = 0.25 + throttle * 0.55;
}

function recycleParticle(index, throttle) {
  const p = index * 3;
  const spread = 0.15 + throttle * 0.16;
  trail.positions[p] = rocket.position.x + (Math.random() - 0.5) * spread;
  trail.positions[p + 1] = rocket.position.y - 0.34 + (Math.random() - 0.5) * 0.12;
  trail.positions[p + 2] = rocket.position.z + (Math.random() - 0.5) * spread;

  trail.velocities[p] = (Math.random() - 0.5) * 0.9;
  trail.velocities[p + 1] = -2.4 - Math.random() * 2.4 - throttle * 1.2;
  trail.velocities[p + 2] = (Math.random() - 0.5) * 0.9;
  trail.lives[index] = 0.45 + Math.random() * 0.72;
}

function updateJetpackExhaust(dt, now, active) {
  const spawnCount = active ? 10 : 0;

  for (let i = 0; i < spawnCount; i += 1) {
    recycleJetpackParticle(jetpackExhaust.cursor, now);
    jetpackExhaust.cursor = (jetpackExhaust.cursor + 1) % jetpackExhaust.lives.length;
  }

  let liveCount = 0;
  for (let i = 0; i < jetpackExhaust.lives.length; i += 1) {
    if (jetpackExhaust.lives[i] <= 0) continue;

    liveCount += 1;
    const p = i * 3;
    jetpackExhaust.lives[i] -= dt;
    jetpackExhaust.positions[p] += jetpackExhaust.velocities[p] * dt;
    jetpackExhaust.positions[p + 1] += jetpackExhaust.velocities[p + 1] * dt;
    jetpackExhaust.positions[p + 2] += jetpackExhaust.velocities[p + 2] * dt;
    jetpackExhaust.velocities[p + 1] -= dt * 0.75;
    jetpackExhaust.velocities[p] *= 1 + dt * 0.65;
    jetpackExhaust.velocities[p + 2] *= 1 + dt * 0.65;

    if (jetpackExhaust.lives[i] <= 0) {
      jetpackExhaust.positions[p + 1] = -50;
    }
  }

  jetpackExhaust.points.geometry.attributes.position.needsUpdate = true;
  jetpackExhaust.points.material.opacity = Math.min(0.82, liveCount / 80);
  jetpackExhaust.points.material.size = active ? 0.14 + Math.sin(now * 0.018) * 0.025 : 0.11;
}

function recycleJetpackParticle(index, now) {
  const p = index * 3;
  const side = index % 2 === 0 ? -1 : 1;
  const flameSpread = 0.08 + Math.random() * 0.1;
  const smokeSpread = 0.18 + Math.random() * 0.16;

  jetpackExhaust.positions[p] = astronaut.position.x + side * 0.09 + (Math.random() - 0.5) * flameSpread;
  jetpackExhaust.positions[p + 1] = astronaut.position.y + 0.15 + (Math.random() - 0.5) * 0.06;
  jetpackExhaust.positions[p + 2] = astronaut.position.z - 0.32 + (Math.random() - 0.5) * 0.08;

  jetpackExhaust.velocities[p] = side * (0.18 + Math.random() * 0.26) + (Math.random() - 0.5) * smokeSpread;
  jetpackExhaust.velocities[p + 1] = -2.3 - Math.random() * 1.8 - Math.abs(astronautVelocityY) * 0.18;
  jetpackExhaust.velocities[p + 2] = -0.12 - Math.random() * 0.38;
  jetpackExhaust.lives[index] = 0.38 + Math.random() * 0.38 + Math.sin(now * 0.02 + index) * 0.03;
}

function updatePlanetSurface(now, dt) {
  if (!planetSurface.visible) return;
  planetSurface.children.forEach((child, index) => {
    if (index < 2) return;
    child.rotation.y += dt * 0.08;
    child.position.y += Math.sin(now * 0.001 + index) * 0.0008;
  });
}

function throttleCurve(progress) {
  if (progress <= 0 || progress >= 1) return 0;
  if (progress < 0.12) return progress / 0.12;
  if (progress > 0.78) return Math.max(0.28, 1 - (progress - 0.78) / 0.22);
  return 1;
}

function updateCamera(dt) {
  if (surfaceAdventure.active) {
    const desiredX = surfaceView.group.position.x + THREE.MathUtils.clamp(astronaut.position.x - surfaceView.group.position.x, 2, 19);
    const alpha = 1 - Math.exp(-4 * dt);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredX, alpha);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, astronaut.position.y + 2.4, alpha);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10, alpha);
    camera.lookAt(camera.position.x, camera.position.y - 0.8, 0);
    return;
  }
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 12, 1 - Math.exp(-4 * dt));
  const followObject = flightMode === 'walking' ? astronaut : rocket;
  const desiredX = THREE.MathUtils.clamp(followObject.position.x * 0.35, -1.8, 1.8);
  const verticalFollowY = flightMode === 'walking'
    ? ASTRONAUT_GROUND_Y + 2.35 + (followObject.position.y - ASTRONAUT_GROUND_Y) * 0.28
    : followObject.position.y + 2.35;
  const lookAtY = flightMode === 'walking'
    ? ASTRONAUT_GROUND_Y + 1.55 + (followObject.position.y - ASTRONAUT_GROUND_Y) * 0.5
    : followObject.position.y + 1.55;
  const desiredY = THREE.MathUtils.clamp(verticalFollowY, 1.8, 8.8);
  const cameraAlpha = 1 - Math.exp(-2.4 * dt);

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredX, cameraAlpha);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, cameraAlpha);
  camera.lookAt(followObject.position.x * 0.36, lookAtY, 0);
}

function updateHud(altitude, throttle, loopStatus) {
  altitudeLabel.textContent = altitude.toLocaleString() + ' ft';
  throttleLabel.textContent = throttle;
  loopStatusLabel.textContent = loopStatus;
}

function updateUi() {
  document.body.dataset.surfaceAdventure = surfaceAdventure.active ? 'active' : 'inactive';
  document.body.dataset.surfaceObjective = surfaceAdventure.active ? surfaceAdventure.run.objective : '';
  const current = PLANETS[currentPlanetIndex];
  const target = PLANETS[targetPlanetIndex];

  planetLabel.textContent = flightMode === 'ready' || (flightMode === 'countdown' && !hasLeftLaunchpad) ? 'Launchpad' : current.name;
  modeLabel.textContent = readableMode(flightMode);

  if (flightMode === 'ready') {
    launchButton.disabled = false;
    actionButton.disabled = true;
    nextButton.disabled = false;
    launchButton.textContent = `Launch to ${target.name}`;
    actionButton.textContent = 'Exit after landing';
    helpLabel.textContent = `Target: ${target.name} — ${target.tagline}. The station crew is watching. Move the mouse during flight to guide the rocket.`;
  } else if (flightMode === 'countdown') {
    launchButton.disabled = true;
    actionButton.disabled = true;
    nextButton.disabled = true;
    launchButton.textContent = 'Counting down...';
    actionButton.textContent = 'Countdown active';
    helpLabel.textContent = `Launch countdown armed for ${target.name}.`;
  } else if (flightMode === 'launching') {
    actionButton.disabled = true;
    helpLabel.textContent = returningToStation
      ? 'Flying home with your rescued explorer. The station board opens after landing.'
      : hasSwappedDestinationScene
      ? `Destination approach: ${target.name} is loaded for landing.`
      : hasLeftLaunchpad
        ? 'Mouse guides the rocket through space. The destination scene will appear near the flight apex.'
        : 'The launch crew waves through takeoff and clears out when the scene cuts to the destination.';
  } else if (flightMode === 'landed') {
    launchButton.disabled = false;
    actionButton.disabled = false;
    nextButton.disabled = false;
    launchButton.textContent = `Fly to ${target.name}`;
    actionButton.textContent = 'Exit rocket (E)';
    helpLabel.textContent = `Landed on ${current.name}: ${current.tagline}. Press E to step out or fly to ${target.name}.`;
  } else if (flightMode === 'walking') {
    launchButton.disabled = true;
    nextButton.disabled = true;
    helpLabel.textContent = surfaceAdventure.active
      ? surfaceAdventure.run.level.kind === 'steam'
        ? 'A/D: walk · E: board. WAIT for steam to stop → cross on GO → rescue → return left.'
        : surfaceAdventure.run.level.kind === 'ice'
          ? `A/D: skate · E: board. ${surfaceAdventure.run.objective} → rescue → return left.`
          : surfaceAdventure.run.level.kind === 'aliens'
            ? surfaceAdventure.run.contactStage === 'blocked' ? 'A/D: move a few steps · E: board. The aliens crowd the garden path; return for a translator.'
              : surfaceAdventure.run.contactStage === 'gate' ? 'A/D: reach the moon-pickle gate · E: use the Translator Badge.'
                : surfaceAdventure.run.contactStage === 'garden' ? 'A/D: approach the friendly alien · E: say hello.'
                  : 'First contact complete! Return left to the rocket and press E.'
            : surfaceAdventure.run.level.kind === 'theft'
              ? surfaceAdventure.run.state === 'stealing'
                ? 'Tiny aliens are stealing the rocket! Watch it leave, then continue right.'
                : 'Rocket stolen. A/D: walk · Space: jetpack. Move right and find another way off.'
              : 'A/D: walk · Space: jetpack · E: board. Cross the vines → rescue → return left. Avoid flying too high.'
      : 'Walk with A/D or arrows. Hold Space for the jetpack. Stay too high for too long and the black hole resets you to the rocket.';
  }
}

function resetExperience() {
  returningToStation = false;
  document.body.dataset.stationReturn = 'idle';
  document.body.dataset.rocketTheftState = 'idle';
  document.body.dataset.rocketTheftPlanet = '';
  leaveSurfaceAdventure();
  keys.clear();
  currentPlanetIndex = 0;
  targetPlanetIndex = 0;
  launchStart = null;
  resetLaunchCountdownState();
  flightMode = 'ready';
  lastLandedX = 0;
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  jetpackActive = false;
  hasLeftLaunchpad = false;
  hasSwappedDestinationScene = false;

  rocket.visible = true;
  rocket.position.set(0, START_Y, 0);
  rocket.rotation.set(0, 0, 0);
  astronaut.visible = false;
  astronaut.position.set(0, ASTRONAUT_GROUND_Y, 0.18);
  astronaut.rotation.set(0, 0, 0);
  astronaut.scale.setScalar(1);
  planetSurface.visible = false;
  launchPad.visible = true;
  launchSpectators.visible = true;
  flameLight.intensity = 0;
  steeringTarget.set(0, START_Y, 0);
  setPlanetAtmosphere(PLANETS[0]);
  resetBlackHoleState();

  const flameGroup = rocket.getObjectByName('flameGroup');
  flameGroup.visible = false;

  const jetpackFlames = astronaut.getObjectByName('jetpackFlames');
  jetpackFlames.visible = false;
  const jetpackLight = astronaut.getObjectByName('jetpackLight');
  jetpackLight.intensity = 0;

  for (let i = 0; i < trail.lives.length; i += 1) {
    trail.lives[i] = -1;
    trail.positions[i * 3 + 1] = -50;
  }
  trail.points.geometry.attributes.position.needsUpdate = true;

  for (let i = 0; i < jetpackExhaust.lives.length; i += 1) {
    jetpackExhaust.lives[i] = -1;
    jetpackExhaust.positions[i * 3 + 1] = -50;
  }
  jetpackExhaust.points.geometry.attributes.position.needsUpdate = true;
  jetpackExhaust.points.material.opacity = 0;

  camera.position.set(0, 2.4, 12);
  camera.lookAt(0, 0, 0);

  updateHud(0, 'Idle', 'Waiting');
  updateUi();
}

function readableMode(mode) {
  return {
    ready: 'Rocket',
    countdown: 'Countdown',
    launching: 'In flight',
    landed: 'Landed',
    walking: 'Astronaut EVA'
  }[mode] ?? mode;
}

function resizeRenderer() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
