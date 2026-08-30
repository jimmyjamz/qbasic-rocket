import * as THREE from 'three';

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
const ASTRONAUT_MAX_Y = LAND_Y + 3.15;
const LAUNCH_TIME_MS = 7200;
const STEERING_LIMIT_X = 4.8;
const STEERING_LIMIT_Z = 1.45;
const WALK_LIMIT = 5.6;
const WALK_SPEED = 2.6;
const GRAVITY = -7.2;
const JETPACK_THRUST = 12.4;
const MAX_FALL_SPEED = -5.4;
const MAX_RISE_SPEED = 4.2;

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
  }
];

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

const planetSurface = new THREE.Group();
scene.add(planetSurface);

const destinationOrbs = createDestinationOrbs();
scene.add(destinationOrbs);

const starField = createStarField();
scene.add(starField);

const trail = createTrailSystem();
scene.add(trail.points);

const jetpackExhaust = createJetpackExhaustSystem();
scene.add(jetpackExhaust.points);

const pointerRaycaster = new THREE.Raycaster();
const steeringPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const pointer = {
  normalized: new THREE.Vector2(0, 0),
  world: new THREE.Vector3(0, START_Y, 0),
  hasInput: false
};
const steeringTarget = new THREE.Vector3(0, START_Y, 0);

const keys = new Set();

let currentPlanetIndex = 0;
let targetPlanetIndex = 0;
let launchStart = null;
let flightMode = 'ready';
let lastTime = performance.now();
let astronautVelocityX = 0;
let astronautVelocityY = 0;
let lastLandedX = 0;
let jetpackActive = false;

launchButton.addEventListener('click', launchToSelectedPlanet);
actionButton.addEventListener('click', handleContextAction);
nextButton.addEventListener('click', chooseNextPlanet);
resetButton.addEventListener('click', resetExperience);
window.addEventListener('resize', resizeRenderer);
window.addEventListener('pointermove', updatePointerTarget);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
  }

  if (event.repeat) return;
  keys.add(event.code);

  if (event.code === 'KeyE') handleContextAction();
  if (event.code === 'KeyN') chooseNextPlanet();
  if (event.code === 'Space' && flightMode === 'ready') launchToSelectedPlanet();
});
window.addEventListener('keyup', (event) => keys.delete(event.code));

resetExperience();
requestAnimationFrame(animate);

function animate(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const elapsed = launchStart ? now - launchStart : 0;
  const progress = flightMode === 'launching' ? Math.min(elapsed / LAUNCH_TIME_MS, 1) : 0;
  const throttle = flightMode === 'launching' ? throttleCurve(progress) : 0;

  if (flightMode === 'launching') {
    updateRocketFlight(dt, now, progress);

    const altitude = Math.round(easeOutCubic(progress) * 112000);
    const throttleText = progress < 0.13 ? 'Ignition' : progress < 0.66 ? 'Full burn' : 'Landing burn';
    updateHud(altitude, throttleText, progress < 0.72 ? 'Mouse guided flight' : 'Landing sequence');

    if (progress >= 1) {
      completeLanding();
    }
  } else if (flightMode === 'walking') {
    updateAstronaut(dt, now);
  } else {
    jetpackActive = false;
  }

  animateRocketFlames(now, throttle);
  animateJetpackFlames(now, jetpackActive);
  updateTrail(dt, throttle);
  updateJetpackExhaust(dt, now, jetpackActive);
  updateCamera(dt);
  updateDestinationOrbs(now, dt);
  updatePlanetSurface(now, dt);

  starField.rotation.y += dt * 0.01;
  launchPad.rotation.y += Math.sin(now * 0.001) * dt * 0.006;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function launchToSelectedPlanet() {
  if (flightMode === 'walking') return;

  if (flightMode === 'landed') {
    targetPlanetIndex = (currentPlanetIndex + 1) % PLANETS.length;
  }

  if (targetPlanetIndex === currentPlanetIndex && flightMode !== 'ready') {
    targetPlanetIndex = (currentPlanetIndex + 1) % PLANETS.length;
  }

  astronaut.visible = false;
  jetpackActive = false;
  flightMode = 'launching';
  launchStart = performance.now();
  launchButton.disabled = true;
  actionButton.disabled = true;
  nextButton.disabled = true;
  launchButton.textContent = `Flying to ${PLANETS[targetPlanetIndex].name}...`;
  launchPad.visible = currentPlanetIndex === 0 && rocket.position.y <= START_Y + 0.4;
  updateHud(0, 'Ignition', 'Mouse guided flight');
  updateUi();
}

function chooseNextPlanet() {
  if (flightMode === 'launching' || flightMode === 'walking') return;
  targetPlanetIndex = (targetPlanetIndex + 1) % PLANETS.length;
  if (targetPlanetIndex === currentPlanetIndex) {
    targetPlanetIndex = (targetPlanetIndex + 1) % PLANETS.length;
  }
  updateUi();
}

function handleContextAction() {
  if (flightMode === 'landed') {
    exitRocket();
  } else if (flightMode === 'walking' && canBoardRocket()) {
    enterRocket();
  }
}

function exitRocket() {
  flightMode = 'walking';
  astronaut.visible = true;
  astronaut.position.set(rocket.position.x + 1.05, ASTRONAUT_GROUND_Y, 0.18);
  astronaut.rotation.set(0, 0, 0);
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  jetpackActive = false;
  rocket.rotation.set(0, 0, 0);
  updateHud(112000, 'Suit ready', 'Exploring');
  updateUi();
}

function enterRocket() {
  flightMode = 'landed';
  astronaut.visible = false;
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  jetpackActive = false;
  rocket.position.x = THREE.MathUtils.lerp(rocket.position.x, 0, 0.45);
  updateHud(112000, 'Docked', 'Ready for next planet');
  updateUi();
}

function completeLanding() {
  currentPlanetIndex = targetPlanetIndex;
  const planet = PLANETS[currentPlanetIndex];

  flightMode = 'landed';
  launchStart = null;
  rocket.position.set(lastLandedX, LAND_Y, 0);
  rocket.rotation.set(0, 0, 0);
  flameLight.intensity = 0;
  launchPad.visible = false;

  rebuildPlanetSurface(planet);
  setPlanetAtmosphere(planet);

  launchButton.disabled = false;
  actionButton.disabled = false;
  nextButton.disabled = false;
  launchButton.textContent = 'Fly to next planet';
  updateHud(112000, 'Landed', 'Landed');
  updateUi();
}

function updateRocketFlight(dt, now, progress) {
  const eased = easeInOutCubic(progress);
  const arcY = bezier(START_Y, SPACE_Y, SPACE_Y - 0.6, LAND_Y, eased);
  const target = getSteeringTarget(arcY, progress);

  if (progress > 0.72) {
    const landingProgress = THREE.MathUtils.smoothstep(progress, 0.72, 1);
    target.x = THREE.MathUtils.lerp(target.x, lastLandedX, landingProgress);
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
  const isThrusting = keys.has('Space');
  const isGrounded = astronaut.position.y <= ASTRONAUT_GROUND_Y + 0.015;

  jetpackActive = isThrusting && astronaut.position.y < ASTRONAUT_MAX_Y - 0.02;

  astronautVelocityX = THREE.MathUtils.lerp(astronautVelocityX, desiredVelocity, 1 - Math.exp(-12 * dt));
  astronautVelocityY += (jetpackActive ? JETPACK_THRUST : GRAVITY) * dt;
  astronautVelocityY = THREE.MathUtils.clamp(astronautVelocityY, MAX_FALL_SPEED, MAX_RISE_SPEED);

  astronaut.position.x = THREE.MathUtils.clamp(astronaut.position.x + astronautVelocityX * dt, -WALK_LIMIT, WALK_LIMIT);
  astronaut.position.y = THREE.MathUtils.clamp(astronaut.position.y + astronautVelocityY * dt, ASTRONAUT_GROUND_Y, ASTRONAUT_MAX_Y);

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

  const nearRocket = isAstronautNearRocket();
  const boardable = canBoardRocket();
  actionButton.disabled = !boardable;
  actionButton.textContent = boardable ? 'Enter rocket (E)' : nearRocket ? 'Land to enter rocket' : 'Return to rocket';
  loopStatusLabel.textContent = jetpackActive ? 'Jetpack firing' : boardable ? 'Ready to board' : 'Exploring';
  throttleLabel.textContent = jetpackActive ? 'Jetpack' : isGrounded ? 'Suit ready' : 'Coasting';
}

function isAstronautNearRocket() {
  return Math.abs(astronaut.position.x - rocket.position.x) < 1.35;
}

function canBoardRocket() {
  return isAstronautNearRocket() && astronaut.position.y <= ASTRONAUT_GROUND_Y + 0.18;
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

  const jetpackFlames = new THREE.Group();
  jetpackFlames.name = 'jetpackFlames';
  jetpackFlames.position.set(0, 0.32, -0.38);

  for (const x of [-0.09, 0.09]) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.42, 18),
      new THREE.MeshBasicMaterial({ color: 0xff9b2f, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending })
    );
    flame.position.set(x, -0.18, 0);
    flame.rotation.x = Math.PI;
    jetpackFlames.add(flame);

    const hotCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.038, 0.28, 18),
      new THREE.MeshBasicMaterial({ color: 0xfff2a6, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending })
    );
    hotCore.position.set(x, -0.12, 0.015);
    hotCore.rotation.x = Math.PI;
    jetpackFlames.add(hotCore);
  }

  const jetpackLight = new THREE.PointLight(0xff9b2f, 0, 3.5);
  jetpackLight.name = 'jetpackLight';
  jetpackLight.position.set(0, 0.18, -0.34);
  group.add(jetpackLight);

  jetpackFlames.visible = false;
  group.add(jetpackFlames);

  for (const x of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 6, 10), suit);
    leg.position.set(x, 0.05, 0);
    group.add(leg);
  }

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
  const followObject = flightMode === 'walking' ? astronaut : rocket;
  const desiredX = THREE.MathUtils.clamp(followObject.position.x * 0.35, -1.8, 1.8);
  const desiredY = THREE.MathUtils.clamp(followObject.position.y + 2.35, 1.8, 9.5);
  const cameraAlpha = 1 - Math.exp(-2.4 * dt);

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredX, cameraAlpha);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, cameraAlpha);
  camera.lookAt(followObject.position.x * 0.36, followObject.position.y + 1.55, 0);
}

function updateHud(altitude, throttle, loopStatus) {
  altitudeLabel.textContent = altitude.toLocaleString() + ' ft';
  throttleLabel.textContent = throttle;
  loopStatusLabel.textContent = loopStatus;
}

function updateUi() {
  const current = PLANETS[currentPlanetIndex];
  const target = PLANETS[targetPlanetIndex];

  planetLabel.textContent = flightMode === 'ready' ? 'Launchpad' : current.name;
  modeLabel.textContent = readableMode(flightMode);

  if (flightMode === 'ready') {
    launchButton.disabled = false;
    actionButton.disabled = true;
    nextButton.disabled = false;
    launchButton.textContent = `Launch to ${target.name}`;
    actionButton.textContent = 'Exit after landing';
    helpLabel.textContent = `Target: ${target.name} — ${target.tagline}. Move the mouse during flight to guide the rocket.`;
  } else if (flightMode === 'launching') {
    actionButton.disabled = true;
    helpLabel.textContent = 'Mouse guides the rocket during flight; landing autopilot takes over near the planet.';
  } else if (flightMode === 'landed') {
    launchButton.disabled = false;
    actionButton.disabled = false;
    nextButton.disabled = false;
    launchButton.textContent = `Fly to ${PLANETS[(currentPlanetIndex + 1) % PLANETS.length].name}`;
    actionButton.textContent = 'Exit rocket (E)';
    helpLabel.textContent = `Landed on ${current.name}: ${current.tagline}. Press E to step out.`;
  } else if (flightMode === 'walking') {
    launchButton.disabled = true;
    nextButton.disabled = true;
    helpLabel.textContent = 'Walk with A/D or arrows. Hold Space for animated jetpack flames and exhaust clouds. Land near the rocket and press E to climb back in.';
  }
}

function resetExperience() {
  currentPlanetIndex = 0;
  targetPlanetIndex = 0;
  launchStart = null;
  flightMode = 'ready';
  lastLandedX = 0;
  astronautVelocityX = 0;
  astronautVelocityY = 0;
  jetpackActive = false;

  rocket.position.set(0, START_Y, 0);
  rocket.rotation.set(0, 0, 0);
  astronaut.visible = false;
  astronaut.position.set(0, ASTRONAUT_GROUND_Y, 0.18);
  astronaut.rotation.set(0, 0, 0);
  planetSurface.visible = false;
  launchPad.visible = true;
  flameLight.intensity = 0;
  steeringTarget.set(0, START_Y, 0);
  setPlanetAtmosphere(PLANETS[0]);

  const flameGroup = rocket.getObjectByName('flameGroup');
  flameGroup.visible = false;

  const jetpackFlames = astronaut.getObjectByName('jetpackFlames');
  const jetpackLight = astronaut.getObjectByName('jetpackLight');
  jetpackFlames.visible = false;
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
