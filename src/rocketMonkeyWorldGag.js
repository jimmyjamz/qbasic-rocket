import * as THREE from 'three';

const MONKEY_LAUNCH_GAG_ENABLED = true;
const MONKEY_THROW_TARGET = 'planet'; // Future option: 'aliens'
const MONKEY_GAG_DURATION_MS = 2850;
const BANANA_THROW_TIMES_MS = [360, 820, 1280];
const BANANA_LIFETIME_MS = 2100;

let sceneRef = null;
let rocketRef = null;
let monkeyPassenger = null;
let bananaInHand = null;
let gagStartedAt = null;
let nextThrowIndex = 0;
let wasLaunching = false;
let lastFrameTime = performance.now();
const bananas = [];
const lastRocketPosition = new THREE.Vector3();
const rocketVelocity = new THREE.Vector3();
const worldOrigin = new THREE.Vector3();
const worldQuaternion = new THREE.Quaternion();
const reusableVector = new THREE.Vector3();

const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function patchedSceneAdd(...objects) {
  if (!sceneRef) {
    sceneRef = this;
  }
  return originalSceneAdd.apply(this, objects);
};

const originalGroupAdd = THREE.Group.prototype.add;
THREE.Group.prototype.add = function patchedGroupAdd(...objects) {
  const result = originalGroupAdd.apply(this, objects);

  if (!rocketRef && objects.some((object) => object?.name === 'flameGroup')) {
    rocketRef = this;
    lastRocketPosition.copy(rocketRef.position);
    attachMonkeyToRocket();
  }

  return result;
};

function attachMonkeyToRocket() {
  if (!rocketRef || monkeyPassenger) return;

  monkeyPassenger = createMonkeyPassenger();
  monkeyPassenger.name = 'monkeyPassenger';
  monkeyPassenger.position.set(0.02, 2.25, 0.66);
  monkeyPassenger.rotation.set(0.04, 0, 0);
  monkeyPassenger.scale.setScalar(0.26);
  monkeyPassenger.visible = false;
  rocketRef.add(monkeyPassenger);
}

function createMonkeyPassenger() {
  const group = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.7, metalness: 0.03 });
  const face = new THREE.MeshStandardMaterial({ color: 0xd6a15f, roughness: 0.66, metalness: 0.02 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17120d, roughness: 0.5, metalness: 0.02 });
  const banana = new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.48, metalness: 0.04 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), fur);
  group.add(head);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), face);
  muzzle.position.set(0, -0.05, 0.24);
  muzzle.scale.set(1.15, 0.82, 0.72);
  group.add(muzzle);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), fur);
    ear.position.set(side * 0.31, 0.04, -0.02);
    ear.scale.set(0.72, 1, 0.5);
    group.add(ear);

    const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), face);
    innerEar.position.set(side * 0.335, 0.04, 0.025);
    innerEar.scale.set(0.64, 1, 0.42);
    group.add(innerEar);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), dark);
    eye.position.set(side * 0.095, 0.095, 0.295);
    group.add(eye);
  }

  const grin = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.008, 6, 18, Math.PI),
    dark
  );
  grin.position.set(0, -0.08, 0.35);
  grin.rotation.set(Math.PI, 0, 0);
  group.add(grin);

  bananaInHand = createBananaMesh(banana);
  bananaInHand.name = 'monkeyBananaInHand';
  bananaInHand.position.set(0.26, 0.05, 0.32);
  bananaInHand.rotation.set(0.1, 0.2, -0.9);
  bananaInHand.scale.setScalar(0.62);
  group.add(bananaInHand);

  return group;
}

function createBananaMesh(material = new THREE.MeshStandardMaterial({ color: 0xffe066, roughness: 0.48, metalness: 0.04 })) {
  const banana = new THREE.Group();
  const curve = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.026, 8, 20, Math.PI * 1.22),
    material
  );
  curve.rotation.z = -0.52;
  banana.add(curve);

  const tipMaterial = new THREE.MeshStandardMaterial({ color: 0x8a5a16, roughness: 0.72, metalness: 0.02 });
  const tipA = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), tipMaterial);
  tipA.position.set(-0.09, -0.07, 0);
  banana.add(tipA);

  const tipB = tipA.clone();
  tipB.position.set(0.11, 0.06, 0);
  banana.add(tipB);
  return banana;
}

function isLaunchState() {
  const mode = document.querySelector('#modeName')?.textContent?.trim() ?? '';
  const status = document.querySelector('#loopStatus')?.textContent?.trim() ?? '';
  const action = document.querySelector('#launchButton')?.textContent?.trim() ?? '';

  return mode === 'Countdown'
    || mode === 'In flight'
    || status.startsWith('T-')
    || status === 'Launch!'
    || status.includes('Mouse guided flight')
    || action.startsWith('Flying to');
}

function startGag(now) {
  if (!MONKEY_LAUNCH_GAG_ENABLED || !monkeyPassenger) return;
  gagStartedAt = now;
  nextThrowIndex = 0;
  monkeyPassenger.visible = true;
  if (bananaInHand) bananaInHand.visible = true;
}

function finishGag() {
  gagStartedAt = null;
  if (monkeyPassenger) monkeyPassenger.visible = false;
  if (bananaInHand) bananaInHand.visible = false;
}

function updateMonkey(now) {
  if (!monkeyPassenger || gagStartedAt === null) return;
  const elapsed = now - gagStartedAt;
  const bob = Math.sin(now * 0.018) * 0.025;
  const wave = Math.sin(now * 0.032) * 0.12;
  monkeyPassenger.position.y = 2.25 + bob;
  monkeyPassenger.rotation.z = wave;
  if (bananaInHand) {
    bananaInHand.visible = elapsed < 1650;
    bananaInHand.rotation.z = -0.9 + Math.sin(now * 0.046) * 0.7;
  }
}

function spawnBanana(now) {
  if (!sceneRef || !monkeyPassenger || !rocketRef) return;

  const banana = createBananaMesh();
  monkeyPassenger.getWorldPosition(worldOrigin);
  rocketRef.getWorldQuaternion(worldQuaternion);

  const side = nextThrowIndex % 2 === 0 ? 1 : -1;
  const throwVelocity = new THREE.Vector3(side * 1.1, 0.58 + nextThrowIndex * 0.08, 1.05)
    .applyQuaternion(worldQuaternion)
    .add(rocketVelocity.clone().multiplyScalar(0.35));

  banana.position.copy(worldOrigin).add(new THREE.Vector3(side * 0.08, 0.02, 0.04).applyQuaternion(worldQuaternion));
  banana.rotation.set(Math.random() * 0.4, Math.random() * 0.4, side * 0.8);
  banana.scale.setScalar(0.85);
  sceneRef.add(banana);

  bananas.push({
    mesh: banana,
    start: now,
    velocity: throwVelocity,
    spinX: side * (3.5 + nextThrowIndex * 0.4),
    spinY: 2.4 + nextThrowIndex * 0.5,
    spinZ: side * (5.2 + nextThrowIndex * 0.6)
  });
}

function updateBananas(dt, now) {
  for (let index = bananas.length - 1; index >= 0; index -= 1) {
    const banana = bananas[index];
    const elapsed = now - banana.start;
    banana.velocity.y -= 2.8 * dt;
    banana.mesh.position.addScaledVector(banana.velocity, dt);
    banana.mesh.rotation.x += banana.spinX * dt;
    banana.mesh.rotation.y += banana.spinY * dt;
    banana.mesh.rotation.z += banana.spinZ * dt;

    const opacity = Math.max(0, 1 - elapsed / BANANA_LIFETIME_MS);
    banana.mesh.traverse((child) => {
      if (!child.material) return;
      child.material.transparent = true;
      child.material.opacity = opacity;
    });

    if (elapsed >= BANANA_LIFETIME_MS) {
      banana.mesh.traverse((child) => {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose?.());
        } else {
          child.material?.dispose?.();
        }
      });
      sceneRef?.remove(banana.mesh);
      bananas.splice(index, 1);
    }
  }
}

function clearBananas() {
  while (bananas.length > 0) {
    const banana = bananas.pop();
    sceneRef?.remove(banana.mesh);
  }
}

function updateRocketVelocity(dt) {
  if (!rocketRef) return;
  if (dt <= 0) {
    rocketVelocity.set(0, 0, 0);
    return;
  }
  reusableVector.copy(rocketRef.position).sub(lastRocketPosition).divideScalar(dt);
  rocketVelocity.copy(reusableVector);
  lastRocketPosition.copy(rocketRef.position);
}

function resetGag() {
  finishGag();
  clearBananas();
  wasLaunching = false;
}

function tick(now) {
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  updateRocketVelocity(dt);

  const launching = isLaunchState();
  if (launching && !wasLaunching) {
    startGag(now);
  }
  wasLaunching = launching;

  if (gagStartedAt !== null) {
    const elapsed = now - gagStartedAt;
    updateMonkey(now);

    while (nextThrowIndex < BANANA_THROW_TIMES_MS.length && elapsed >= BANANA_THROW_TIMES_MS[nextThrowIndex]) {
      spawnBanana(now);
      nextThrowIndex += 1;
    }

    if (!launching || elapsed >= MONKEY_GAG_DURATION_MS) {
      finishGag();
    }
  }

  updateBananas(dt, now);
  requestAnimationFrame(tick);
}

document.querySelector('#resetButton')?.addEventListener('click', resetGag);
requestAnimationFrame(tick);
