import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const launchButton = document.querySelector('#launchButton');
const resetButton = document.querySelector('#resetButton');
const altitudeLabel = document.querySelector('#altitude');
const throttleLabel = document.querySelector('#throttle');
const loopStatusLabel = document.querySelector('#loopStatus');

const START_Y = -2.7;
const END_Y = 8.2;
const LAUNCH_TIME_MS = 7600;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06101f);
scene.fog = new THREE.FogExp2(0x07101e, 0.03);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 2.4, 12);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const ambientLight = new THREE.HemisphereLight(0x9fcfff, 0x1b1220, 1.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(6, 8, 8);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x65c7ff, 2.4, 35);
rimLight.position.set(-5, 3, 5);
scene.add(rimLight);

const flameLight = new THREE.PointLight(0xff8c2a, 0, 10);
scene.add(flameLight);

const rocket = createRocket();
rocket.position.y = START_Y;
scene.add(rocket);

const launchPad = createLaunchPad();
scene.add(launchPad);

const starField = createStarField();
scene.add(starField);

const trail = createTrailSystem();
scene.add(trail.points);

let launchStart = null;
let isLaunching = false;
let completedLaunch = false;
let lastTime = performance.now();

launchButton.addEventListener('click', () => {
  if (completedLaunch) {
    resetRocket();
  }

  isLaunching = true;
  completedLaunch = false;
  launchStart = performance.now();
  launchButton.disabled = true;
  launchButton.textContent = 'Launching...';
  updateHud(0, 'Ignition', 'Running');
});

resetButton.addEventListener('click', resetRocket);
window.addEventListener('resize', resizeRenderer);

resetRocket();
requestAnimationFrame(animate);

function animate(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const elapsed = launchStart ? now - launchStart : 0;
  const progress = isLaunching ? Math.min(elapsed / LAUNCH_TIME_MS, 1) : completedLaunch ? 1 : 0;
  const eased = easeOutCubic(progress);
  const throttle = isLaunching ? throttleCurve(progress) : 0;

  if (isLaunching) {
    rocket.position.y = THREE.MathUtils.lerp(START_Y, END_Y, eased);
    rocket.rotation.z = Math.sin(now * 0.004) * 0.025 * (1 - progress);
    rocket.rotation.x = Math.sin(now * 0.0025) * 0.012 * (1 - progress);

    const altitude = Math.round(eased * 112000);
    const throttleText = progress < 0.14 ? 'Ignition' : progress < 0.72 ? 'Full burn' : 'Coasting';
    updateHud(altitude, throttleText, 'Running');

    if (progress >= 1) {
      isLaunching = false;
      completedLaunch = true;
      launchButton.disabled = false;
      launchButton.textContent = 'Launch again';
      updateHud(112000, 'MECO', 'Complete');
    }
  }

  animateFlames(now, throttle);
  updateTrail(dt, throttle);
  updateCamera();

  starField.rotation.y += dt * 0.01;
  launchPad.rotation.y += Math.sin(now * 0.001) * dt * 0.006;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function createRocket() {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2f6ff,
    metalness: 0.35,
    roughness: 0.42
  });
  const redMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4658,
    metalness: 0.25,
    roughness: 0.35
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x121a2f,
    metalness: 0.2,
    roughness: 0.4
  });
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

  const rightFin = new THREE.Mesh(finGeometry, finMaterial);
  rightFin.position.set(0.49, 0.84, -0.06);
  group.add(rightFin);

  const leftFin = new THREE.Mesh(finGeometry, finMaterial);
  leftFin.position.set(-0.49, 0.84, -0.06);
  leftFin.scale.x = -1;
  group.add(leftFin);

  const backFin = new THREE.Mesh(finGeometry, finMaterial);
  backFin.position.set(0.06, 0.84, -0.49);
  backFin.rotation.y = Math.PI / 2;
  group.add(backFin);

  const frontFin = new THREE.Mesh(finGeometry, finMaterial);
  frontFin.position.set(-0.06, 0.84, 0.49);
  frontFin.rotation.y = -Math.PI / 2;
  group.add(frontFin);

  const stripeOne = new THREE.Mesh(new THREE.CylinderGeometry(0.535, 0.535, 0.12, 48), redMaterial);
  stripeOne.position.y = 1.05;
  group.add(stripeOne);

  const stripeTwo = new THREE.Mesh(new THREE.CylinderGeometry(0.535, 0.535, 0.12, 48), redMaterial);
  stripeTwo.position.y = 2.85;
  group.add(stripeTwo);

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

  const smokeMaterial = new THREE.MeshBasicMaterial({ color: 0x9aa7bb, transparent: true, opacity: 0.16, depthWrite: false });
  for (let i = 0; i < 10; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.38 + Math.random() * 0.22, 16, 12), smokeMaterial);
    puff.position.set((Math.random() - 0.5) * 3.4, -2.78 + Math.random() * 0.18, (Math.random() - 0.5) * 2.6);
    puff.scale.y = 0.36;
    group.add(puff);
  }

  return group;
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
  const count = 210;
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

function animateFlames(now, throttle) {
  const flameGroup = rocket.getObjectByName('flameGroup');
  const visible = throttle > 0.02;
  flameGroup.visible = visible;
  flameLight.intensity = visible ? 7.5 * throttle : 0;
  flameLight.position.set(rocket.position.x, rocket.position.y - 0.52, rocket.position.z + 0.2);

  if (!visible) return;

  const flicker = 1 + Math.sin(now * 0.03) * 0.08 + Math.random() * 0.08;
  flameGroup.scale.set(0.84 + throttle * 0.42, (0.74 + throttle * 0.55) * flicker, 0.84 + throttle * 0.42);
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

function throttleCurve(progress) {
  if (progress <= 0 || progress >= 1) return 0;
  if (progress < 0.12) return progress / 0.12;
  if (progress > 0.78) return Math.max(0.2, 1 - (progress - 0.78) / 0.22);
  return 1;
}

function updateCamera() {
  const desiredY = THREE.MathUtils.clamp(rocket.position.y + 2.35, 2.4, 9.5);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, 0.035);
  camera.lookAt(0, rocket.position.y + 1.65, 0);
}

function updateHud(altitude, throttle, loopStatus) {
  altitudeLabel.textContent = altitude.toLocaleString() + ' ft';
  throttleLabel.textContent = throttle;
  loopStatusLabel.textContent = loopStatus;
}

function resetRocket() {
  isLaunching = false;
  completedLaunch = false;
  launchStart = null;
  rocket.position.set(0, START_Y, 0);
  rocket.rotation.set(0, 0, 0);
  flameLight.intensity = 0;

  const flameGroup = rocket.getObjectByName('flameGroup');
  flameGroup.visible = false;

  for (let i = 0; i < trail.lives.length; i += 1) {
    trail.lives[i] = -1;
    trail.positions[i * 3 + 1] = -50;
  }
  trail.points.geometry.attributes.position.needsUpdate = true;

  camera.position.set(0, 2.4, 12);
  camera.lookAt(0, 0, 0);

  launchButton.disabled = false;
  launchButton.textContent = 'Launch rocket';
  updateHud(0, 'Idle', 'Waiting');
}

function resizeRenderer() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}
