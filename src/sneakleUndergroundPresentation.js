// Visual helper for Sneakle's hatch-room and first UFO-part beat.
// Gameplay state/collision lives in surfaceAdventureState.js.
import * as THREE from 'three';
import { surfaceAdventure, THEFT_LEVEL } from './surfaceAdventureState.js';

let theftSurfaceGroup = null;
let overlay = null;

const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function addWithSneakleUndergroundCapture(...objects) {
  const result = originalSceneAdd.apply(this, objects);
  objects.forEach((object) => {
    if (object?.name === 'theftSurfaceAdventure' && !theftSurfaceGroup) {
      theftSurfaceGroup = object;
      overlay = createUndergroundOverlay();
      theftSurfaceGroup.add(overlay);
    }
  });
  return result;
};

const originalRendererRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function renderWithSneakleUndergroundOverlay(...args) {
  const camera = args[1];
  renderUndergroundOverlay(camera);
  return originalRendererRender.apply(this, args);
};

function makeSign(text, x, y, width = 2.2) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#201038';
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
  sprite.position.set(x, y, 0.72);
  sprite.scale.set(width, width / 6, 1);
  return sprite;
}

function createUndergroundOverlay() {
  const group = new THREE.Group();
  group.name = 'sneakleUndergroundOverlay';
  group.visible = false;

  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x24113d, roughness: 0.8 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2460, roughness: 0.78 });
  const glowMaterial = new THREE.MeshStandardMaterial({ color: 0xffdd66, emissive: 0xffdd66, emissiveIntensity: 0.45 });
  const partMaterial = new THREE.MeshStandardMaterial({ color: 0x7df5ff, emissive: 0x38c8ff, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.25 });

  const hatch = new THREE.Group();
  hatch.name = 'sneakleHatch';
  const hatchDoor = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.78), glowMaterial);
  hatchDoor.rotation.z = -0.18;
  hatchDoor.position.y = 0.08;
  const hatchRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 8, 28), glowMaterial);
  hatchRing.rotation.x = Math.PI / 2;
  hatchRing.position.set(0, 0.18, 0.08);
  hatch.add(hatchDoor, hatchRing);
  hatch.position.set(THEFT_LEVEL.hatchX, 0.02, 0.58);
  group.add(hatch);
  group.add(makeSign('HATCH', THEFT_LEVEL.hatchX, 1.35, 1.55));

  const roomStart = THEFT_LEVEL.hatchX + 1.0;
  const roomLength = THEFT_LEVEL.partX - roomStart + 1.8;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomLength, 2.15, 0.16), wallMaterial);
  backWall.position.set(roomStart + roomLength / 2, 1.0, -0.9);
  group.add(backWall);

  const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(roomLength, 0.28, 2.4), floorMaterial);
  roomFloor.position.set(roomStart + roomLength / 2, -0.06, -0.15);
  group.add(roomFloor);

  for (const x of [roomStart + 0.6, roomStart + 2.3, roomStart + 4.0]) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), glowMaterial);
    light.position.set(x, 1.95, -0.77);
    group.add(light);
  }

  if (THEFT_LEVEL.obstacleHeight > 0) {
    const obstacle = new THREE.Mesh(
      new THREE.BoxGeometry(THEFT_LEVEL.obstacleRight - THEFT_LEVEL.obstacleLeft, THEFT_LEVEL.obstacleHeight, 0.86),
      wallMaterial
    );
    obstacle.name = 'sneakleJetpackObstacle';
    obstacle.position.set(
      (THEFT_LEVEL.obstacleLeft + THEFT_LEVEL.obstacleRight) / 2,
      THEFT_LEVEL.obstacleHeight / 2,
      0.12
    );
    group.add(obstacle);
  }

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 0.72), glowMaterial);
  ledge.name = 'sneaklePartLedge';
  ledge.position.set(THEFT_LEVEL.partX, Math.max(0.42, (THEFT_LEVEL.partMinY ?? 1.05) - 0.28), 0.3);
  group.add(ledge);

  const part = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 1), partMaterial);
  part.name = 'sneakleUfoPart';
  part.position.set(THEFT_LEVEL.partX, THEFT_LEVEL.partY ?? 1.45, 0.36);
  group.add(part);
  group.add(makeSign('JETPACK PART', THEFT_LEVEL.partX, 2.35, 2.0));

  group.userData.hatch = hatch;
  group.userData.part = part;
  group.userData.partHomeY = THEFT_LEVEL.partY ?? 1.45;
  return group;
}

function hideOldUfoScenery(hidden) {
  if (!theftSurfaceGroup) return;

  const hideStart = (THEFT_LEVEL.ufoApproachX ?? THEFT_LEVEL.hatchX ?? THEFT_LEVEL.ufoX) - 0.35;
  const hideEnd = THEFT_LEVEL.ufoX + 4.8;

  theftSurfaceGroup.children.forEach((child) => {
    if (child === overlay || child.name === 'sneakleUndergroundOverlay') return;
    if (!child.position) return;

    const inUfoRoomZone = child.position.x >= hideStart && child.position.x <= hideEnd;
    const hideableOldScenery = child.type === 'Group' || child.type === 'Sprite';
    if (inUfoRoomZone && hideableOldScenery) child.visible = !hidden;
  });
}

function extendSneakleCamera(camera, run) {
  if (!camera?.position || !camera.lookAt || !theftSurfaceGroup) return;
  if (run?.level?.kind !== 'theft' || run.state !== 'stranded' || !run.ufoDiscovered) return;

  const playerX = Number.isFinite(run.player?.x) ? run.player.x : 0;
  const maxFollowX = Math.max(19, run.level.maxX - 2.2);
  const desiredX = theftSurfaceGroup.position.x + THREE.MathUtils.clamp(playerX, 2, maxFollowX);
  const desiredY = 1.95;

  // This remains conservative because RKT-70 keeps the first part inside the
  // proven camera-safe hatch area instead of extending traversal offscreen.
  camera.position.x = desiredX;
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, 0.2);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10, 0.2);
  camera.lookAt(camera.position.x, 1.2, 0);
}

function renderUndergroundOverlay(camera, now = performance.now()) {
  const run = surfaceAdventure.active ? surfaceAdventure.run : null;
  const show = run?.level?.kind === 'theft' && run.state === 'stranded' && run.ufoDiscovered;
  if (!overlay) return;

  overlay.visible = show;
  hideOldUfoScenery(show);
  extendSneakleCamera(camera, run);

  const part = overlay.userData.part;
  if (!part) return;

  part.visible = show && !run?.ufoPartCollected;
  if (part.visible) {
    part.rotation.y += 0.08;
    part.position.y = overlay.userData.partHomeY + Math.sin(now * 0.006) * 0.08;
  }
}
