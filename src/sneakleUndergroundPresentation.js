// Visual helper for Sneakle's hatch-room diagnostic beat.
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

function createLaunchReadyUfoVisual() {
  const ufo = new THREE.Group();
  ufo.name = 'sneakleLaunchReadyUfo';
  ufo.visible = false;

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6f4ff,
    emissive: 0x7df5ff,
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.58
  });
  const undersideMaterial = new THREE.MeshStandardMaterial({
    color: 0x4e4074,
    emissive: 0x2c1a58,
    emissiveIntensity: 0.18,
    roughness: 0.38,
    metalness: 0.25
  });
  const domeMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff066,
    emissive: 0x7df5ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.18
  });
  const readyMaterial = new THREE.MeshBasicMaterial({ color: 0x7df5ff, depthTest: false });
  const patchMaterial = new THREE.MeshBasicMaterial({ color: 0x8affb3, depthTest: false });

  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.86, 0.34, 40), hullMaterial);
  saucer.name = 'sneakleLaunchReadySaucerHull';
  saucer.position.y = 0.72;
  saucer.scale.z = 0.62;

  const underside = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.32, 0.18, 36), undersideMaterial);
  underside.name = 'sneakleLaunchReadySaucerUnderside';
  underside.position.y = 0.48;
  underside.scale.z = 0.58;

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.74, 24, 12), domeMaterial);
  dome.name = 'sneakleLaunchReadyDome';
  dome.position.y = 1.02;
  dome.scale.set(1, 0.48, 0.7);

  const repairedPanel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.12), patchMaterial);
  repairedPanel.name = 'sneakleLaunchReadyRepairedPatch';
  repairedPanel.position.set(-0.45, 0.97, 0.56);

  const core = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 10, 32), readyMaterial);
  core.name = 'sneakleLaunchReadyFluxCore';
  core.rotation.x = Math.PI / 2;
  core.position.set(0.36, 0.95, 0.58);

  const lights = new THREE.Group();
  lights.name = 'sneakleLaunchReadyLights';
  [-1.0, -0.5, 0, 0.5, 1.0].forEach((x, index) => {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), readyMaterial);
    light.name = `sneakleLaunchReadyLight${index + 1}`;
    light.position.set(x, 0.86, 0.62);
    lights.add(light);
  });

  for (const x of [-1.05, 0.2, 1.0]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.7, 8), undersideMaterial);
    foot.position.set(x, 0.05, x === 0.2 ? 0.42 : -0.22);
    foot.rotation.z = x * 0.1;
    ufo.add(foot);
  }

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.82, 1.0, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x7df5ff, transparent: true, opacity: 0.22, depthWrite: false })
  );
  beam.name = 'sneakleLaunchReadySoftBeam';
  beam.position.set(0, 0.02, 0.02);
  beam.rotation.x = Math.PI;

  ufo.add(beam, underside, saucer, dome, repairedPanel, core, lights);
  ufo.position.set(THEFT_LEVEL.ufoX, 0.02, 0.78);
  ufo.userData.lights = lights;
  ufo.userData.core = core;
  ufo.userData.dome = dome;
  ufo.userData.beam = beam;
  return ufo;
}

function createUndergroundOverlay() {
  const group = new THREE.Group();
  group.name = 'sneakleUndergroundOverlay';
  group.visible = false;

  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x24113d, roughness: 0.8 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2460, roughness: 0.78 });
  const glowMaterial = new THREE.MeshStandardMaterial({ color: 0xffdd66, emissive: 0xffdd66, emissiveIntensity: 0.45 });
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x7df5ff, emissive: 0x38c8ff, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.25 });
  const coilMaterial = new THREE.MeshStandardMaterial({ color: 0xff8a2a, emissive: 0xff5c22, emissiveIntensity: 0.8, metalness: 0.25, roughness: 0.32 });
  const scrapMaterial = new THREE.MeshStandardMaterial({ color: 0x746a84, roughness: 0.86, metalness: 0.15 });
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x9f7dff, emissive: 0x4f2cff, emissiveIntensity: 0.22, roughness: 0.72 });

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
  const roomLength = THEFT_LEVEL.hatchPanelX - roomStart + 1.8;
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
  ledge.position.set(THEFT_LEVEL.hatchPanelX, Math.max(0.42, (THEFT_LEVEL.hatchPanelMinY ?? 1.05) - 0.28), 0.3);
  group.add(ledge);

  const panel = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 1), panelMaterial);
  panel.name = 'sneakleHatchDiagnosticPanel';
  panel.position.set(THEFT_LEVEL.hatchPanelX, THEFT_LEVEL.hatchPanelY ?? 1.45, 0.36);
  group.add(panel);
  group.add(makeSign('HATCH PANEL', THEFT_LEVEL.hatchPanelX, 2.35, 2.0));

  const searchSign = makeSign('WOBBLE COIL ←', THEFT_LEVEL.hatchX - 1.1, 2.65, 2.35);
  searchSign.name = 'sneakleWobbleCoilSearchSign';
  searchSign.visible = false;
  group.add(searchSign);

  const scrapSteps = [];
  const platformXs = THEFT_LEVEL.wobbleCoilPlatformXs ?? [21.0, 20.0, 19.2, 18.4];
  platformXs.forEach((x, index) => {
    const y = 0.78 + index * 0.34;
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(index === platformXs.length - 1 ? 1.65 : 1.16, 0.18, 0.68),
      index % 2 === 0 ? platformMaterial : scrapMaterial
    );
    platform.name = `sneakleScrapStep${index + 1}`;
    platform.position.set(x, y, 0.24);
    platform.rotation.z = index % 2 === 0 ? -0.08 : 0.08;
    platform.visible = false;
    scrapSteps.push(platform);
    group.add(platform);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), glowMaterial);
    lamp.name = `sneakleScrapStepLamp${index + 1}`;
    lamp.position.set(x, y + 0.34, 0.42);
    lamp.visible = false;
    scrapSteps.push(lamp);
    group.add(lamp);
  });

  const coilShelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 0.78), platformMaterial);
  coilShelf.name = 'sneakleWobbleCoilShelf';
  coilShelf.position.set(THEFT_LEVEL.wobbleCoilX ?? 18.4, (THEFT_LEVEL.wobbleCoilY ?? 2.05) - 0.25, 0.22);
  coilShelf.rotation.z = -0.05;
  coilShelf.visible = false;
  group.add(coilShelf);

  const climbSign = makeSign('SCRAP HOP', 19.35, 2.72, 1.75);
  climbSign.name = 'sneakleScrapHopSign';
  climbSign.visible = false;
  group.add(climbSign);

  const coilPickup = new THREE.Group();
  coilPickup.name = 'sneakleWobbleCoilPickup';
  coilPickup.visible = false;
  const scrapA = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.48), scrapMaterial);
  scrapA.rotation.z = 0.18;
  scrapA.position.set(-0.18, 0.05, -0.04);
  const scrapB = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.4), scrapMaterial);
  scrapB.rotation.z = -0.28;
  scrapB.position.set(0.24, 0.08, 0.04);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.075, 10, 32), coilMaterial);
  coil.name = 'sneakleWobbleCoil';
  coil.rotation.x = Math.PI / 2;
  coil.position.set(0, 0.48, 0.14);
  const coilCore = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), panelMaterial);
  coilCore.position.set(0, 0.48, 0.14);
  const coilBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), glowMaterial);
  coilBeacon.name = 'sneakleWobbleCoilBeacon';
  coilBeacon.position.set(0, 0.95, 0.14);
  coilPickup.add(scrapA, scrapB, coil, coilCore, coilBeacon);
  coilPickup.position.set(THEFT_LEVEL.wobbleCoilX ?? 18.4, THEFT_LEVEL.wobbleCoilY ?? 2.05, 0.34);
  group.add(coilPickup);

  const coilSign = makeSign('WOBBLE COIL', THEFT_LEVEL.wobbleCoilX ?? 18.4, (THEFT_LEVEL.wobbleCoilY ?? 2.05) + 1.15, 2.05);
  coilSign.name = 'sneakleWobbleCoilSign';
  coilSign.visible = false;
  group.add(coilSign);

  const returnSign = makeSign('RETURN TO HATCH', THEFT_LEVEL.hatchX, 2.05, 2.15);
  returnSign.name = 'sneakleReturnToHatchSign';
  returnSign.visible = false;
  group.add(returnSign);

  const installedCoil = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 10, 32), coilMaterial);
  installedCoil.name = 'sneakleInstalledWobbleCoil';
  installedCoil.rotation.x = Math.PI / 2;
  installedCoil.position.set(THEFT_LEVEL.hatchX + 0.18, 0.68, 0.64);
  installedCoil.visible = false;
  group.add(installedCoil);

  const launchReadyUfo = createLaunchReadyUfoVisual();
  group.add(launchReadyUfo);

  group.userData.hatch = hatch;
  group.userData.panel = panel;
  group.userData.panelHomeY = THEFT_LEVEL.hatchPanelY ?? 1.45;
  group.userData.searchSign = searchSign;
  group.userData.scrapSteps = scrapSteps;
  group.userData.coilShelf = coilShelf;
  group.userData.climbSign = climbSign;
  group.userData.coilPickup = coilPickup;
  group.userData.coil = coil;
  group.userData.coilBeacon = coilBeacon;
  group.userData.coilHomeY = coil.position.y;
  group.userData.coilBeaconHomeY = coilBeacon.position.y;
  group.userData.coilSign = coilSign;
  group.userData.returnSign = returnSign;
  group.userData.installedCoil = installedCoil;
  group.userData.launchReadyUfo = launchReadyUfo;
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

function hideInstalledTradePrize(hidden) {
  if (!theftSurfaceGroup) return;
  theftSurfaceGroup.traverse((child) => {
    if (child.name === 'sneakleVisibleTradePrize' || child.name === 'sneakleTradePrizeLabel') {
      child.visible = !hidden;
    }
  });
}

function extendSneakleCamera(camera, run) {
  if (!camera?.position || !camera.lookAt || !theftSurfaceGroup) return;
  if (run?.level?.kind !== 'theft' || run.state !== 'stranded' || !run.ufoDiscovered) return;

  const playerX = Number.isFinite(run.player?.x) ? run.player.x : 0;
  const maxFollowX = Math.max(19, run.level.maxX - 2.2);
  const desiredX = theftSurfaceGroup.position.x + THREE.MathUtils.clamp(playerX, 2, maxFollowX);
  const desiredY = run?.ufoHatchInspected && !run?.wobbleCoilCollected ? 2.45 : 1.95;

  // This remains conservative because RKT-72 keeps the first repair loop inside
  // the proven camera-safe Sneakle range while still requiring a vertical search.
  camera.position.x = desiredX;
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, 0.2);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10, 0.2);
  camera.lookAt(camera.position.x, desiredY - 0.75, 0);
}

function renderLaunchReadyUfo(launchReadyUfo, visible, now) {
  if (!launchReadyUfo) return;
  launchReadyUfo.visible = visible;
  if (!visible) return;

  launchReadyUfo.rotation.z = Math.sin(now * 0.0025) * 0.012;
  const hover = Math.sin(now * 0.0038) * 0.035;
  launchReadyUfo.position.y = 0.08 + hover;

  launchReadyUfo.userData.core.rotation.y += 0.11;
  launchReadyUfo.userData.dome.scale.y = 0.48 + Math.sin(now * 0.006) * 0.025;
  launchReadyUfo.userData.beam.scale.setScalar(1 + Math.sin(now * 0.005) * 0.04);
  launchReadyUfo.userData.lights.children.forEach((light, index) => {
    light.scale.setScalar(1.05 + Math.sin(now * 0.009 + index) * 0.22);
  });
}

function renderUndergroundOverlay(camera, now = performance.now()) {
  const run = surfaceAdventure.active ? surfaceAdventure.run : null;
  const show = run?.level?.kind === 'theft' && run.state === 'stranded' && run.ufoDiscovered;
  if (!overlay) return;

  overlay.visible = show;
  hideOldUfoScenery(show);
  hideInstalledTradePrize(show && Boolean(run?.ufoLaunchReady));
  extendSneakleCamera(camera, run);

  const panel = overlay.userData.panel;
  if (!panel) return;

  panel.visible = show && !run?.ufoHatchInspected;
  if (panel.visible) {
    panel.rotation.y += 0.08;
    panel.position.y = overlay.userData.panelHomeY + Math.sin(now * 0.006) * 0.08;
  }

  const searchSign = overlay.userData.searchSign;
  const scrapSteps = overlay.userData.scrapSteps ?? [];
  const coilShelf = overlay.userData.coilShelf;
  const climbSign = overlay.userData.climbSign;
  const coilPickup = overlay.userData.coilPickup;
  const coil = overlay.userData.coil;
  const coilBeacon = overlay.userData.coilBeacon;
  const coilSign = overlay.userData.coilSign;
  const returnSign = overlay.userData.returnSign;
  const installedCoil = overlay.userData.installedCoil;
  const launchReadyUfo = overlay.userData.launchReadyUfo;
  const launchReady = show && Boolean(run?.ufoLaunchReady);
  const pickupVisible = show && run?.ufoHatchInspected && !run?.wobbleCoilCollected;
  const returnVisible = show && run?.wobbleCoilCollected && !run?.wobbleCoilInstalled;
  const installedVisible = show && Boolean(run?.wobbleCoilInstalled);

  if (searchSign) searchSign.visible = pickupVisible;
  scrapSteps.forEach((platform) => { platform.visible = pickupVisible; });
  if (coilShelf) coilShelf.visible = pickupVisible;
  if (climbSign) climbSign.visible = pickupVisible;
  if (coilPickup) coilPickup.visible = pickupVisible;
  if (coilSign) coilSign.visible = pickupVisible;
  if (returnSign) returnSign.visible = returnVisible;
  if (installedCoil) installedCoil.visible = (returnVisible || installedVisible) && !launchReady;
  renderLaunchReadyUfo(launchReadyUfo, launchReady, now);

  if (pickupVisible && coil) {
    coil.rotation.y += 0.1;
    coil.position.y = overlay.userData.coilHomeY + Math.sin(now * 0.008) * 0.08;
  }

  if (pickupVisible && coilBeacon) {
    coilBeacon.position.y = overlay.userData.coilBeaconHomeY + Math.sin(now * 0.014) * 0.14;
    coilBeacon.scale.setScalar(1.2 + Math.sin(now * 0.01) * 0.18);
  }

  if ((returnVisible || installedVisible) && installedCoil) {
    installedCoil.rotation.y += 0.08;
    installedCoil.scale.setScalar(installedVisible ? 1 + Math.sin(now * 0.006) * 0.08 : 1);
  }
}
