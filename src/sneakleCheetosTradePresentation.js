// Visual helper for Sneakle's backpack, Cheetos, and weird-alien trade beat.
// This intentionally anchors to the visible RKT-72 Wobble Coil trail so it uses a
// render path and coordinate space that has already been browser-validated.
import * as THREE from 'three';
import { surfaceAdventure, THEFT_LEVEL } from './surfaceAdventureState.js';

let tradeAnchor = null;
let tradeOverlay = null;

const originalObjectAdd = THREE.Object3D.prototype.add;
if (!originalObjectAdd.__sneakleCheetosCoilAnchorWrapped) {
  const addWithSneakleCoilAnchorCapture = function addWithSneakleCoilAnchorCapture(...objects) {
    const result = originalObjectAdd.apply(this, objects);
    objects.forEach((object) => captureCoilAnchor(object, this));
    return result;
  };
  addWithSneakleCoilAnchorCapture.__sneakleCheetosCoilAnchorWrapped = true;
  THREE.Object3D.prototype.add = addWithSneakleCoilAnchorCapture;
}

const originalRendererRender = THREE.WebGLRenderer.prototype.render;
if (!originalRendererRender.__sneakleCheetosCoilAnchorRenderWrapped) {
  const renderWithSneakleTradeOverlay = function renderWithSneakleTradeOverlay(scene, ...rest) {
    ensureTradeOverlay(scene);
    renderTradeOverlay();
    return originalRendererRender.call(this, scene, ...rest);
  };
  renderWithSneakleTradeOverlay.__sneakleCheetosCoilAnchorRenderWrapped = true;
  THREE.WebGLRenderer.prototype.render = renderWithSneakleTradeOverlay;
}

function captureCoilAnchor(object, parent) {
  if (tradeOverlay?.parent) return;
  if (object?.name === 'sneakleVisibleWobbleCoilTrail') {
    attachTradeOverlay(parent || object.parent || object);
    return;
  }
  if (object?.traverse) {
    object.traverse((child) => {
      if (!tradeOverlay?.parent && child?.name === 'sneakleVisibleWobbleCoilTrail') {
        attachTradeOverlay(child.parent || parent || child);
      }
    });
  }
}

function ensureTradeOverlay(scene) {
  if (tradeOverlay?.parent) return;
  if (!scene?.traverse) return;

  scene.traverse((object) => {
    if (!tradeOverlay?.parent && object?.name === 'sneakleVisibleWobbleCoilTrail') {
      attachTradeOverlay(object.parent || object);
    }
  });
}

function attachTradeOverlay(anchor) {
  if (!anchor || tradeOverlay?.parent) return;
  tradeAnchor = anchor;
  tradeOverlay = createTradeOverlay();
  tradeAnchor.add(tradeOverlay);
}

function makeLabel(text, x, y, width = 2.4) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#24103d';
  ctx.fillRect(0, 0, 768, 128);
  ctx.strokeStyle = '#ffdd66';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 760, 120);
  ctx.fillStyle = '#fff9d7';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
  label.position.set(x, y, 2.4);
  label.scale.set(width, width / 6, 1);
  label.renderOrder = 250;
  label.visible = false;
  return label;
}

function createBackpack() {
  const backpack = new THREE.Group();
  backpack.name = 'sneakleGroundedCheetosBackpack';
  backpack.visible = false;

  const blue = new THREE.MeshBasicMaterial({ color: 0x2fa8ff, depthTest: false, depthWrite: false });
  const yellow = new THREE.MeshBasicMaterial({ color: 0xffdd66, depthTest: false, depthWrite: false });
  const orange = new THREE.MeshBasicMaterial({ color: 0xff7a1a, depthTest: false, depthWrite: false });
  const dark = new THREE.MeshBasicMaterial({ color: 0x193f92, depthTest: false, depthWrite: false });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.98, 0.38), blue);
  body.position.y = 0.52;
  body.renderOrder = 240;
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.34, 0.42), dark);
  pocket.position.set(0, 0.34, 0.12);
  pocket.renderOrder = 241;
  const flap = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.18, 0.44), yellow);
  flap.position.y = 1.04;
  flap.renderOrder = 242;
  backpack.add(body, pocket, flap);

  for (const [index, x] of [-0.26, -0.08, 0.12, 0.32].entries()) {
    const cheeto = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.035, 6, 16), orange);
    cheeto.name = 'sneakleVisibleCheeto';
    cheeto.position.set(x, 1.24 + Math.abs(x) * 0.15, 0.24);
    cheeto.rotation.x = Math.PI / 2;
    cheeto.rotation.z = index * 0.55;
    cheeto.renderOrder = 243;
    backpack.add(cheeto);
  }

  backpack.position.set(THEFT_LEVEL.backpackX ?? 4.4, 0, 2.0);
  backpack.scale.setScalar(1.2);
  return backpack;
}

function createThrownBackpack() {
  const thrown = createBackpack();
  thrown.name = 'sneakleThrownBackpack';
  thrown.scale.setScalar(1.25);
  return thrown;
}

function createWeirdAlien() {
  const alien = new THREE.Group();
  alien.name = 'sneakleVisibleWeirdHelpfulAlien';
  alien.visible = false;

  const green = new THREE.MeshBasicMaterial({ color: 0xa8ef58, depthTest: false, depthWrite: false });
  const belly = new THREE.MeshBasicMaterial({ color: 0xf4ff8a, depthTest: false, depthWrite: false });
  const black = new THREE.MeshBasicMaterial({ color: 0x101321, depthTest: false, depthWrite: false });
  const slime = new THREE.MeshBasicMaterial({ color: 0x6cffd6, depthTest: false, depthWrite: false });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.58, 6, 14), green);
  body.position.y = 0.62;
  body.renderOrder = 240;
  const tummy = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), belly);
  tummy.position.set(0, 0.58, 0.29);
  tummy.scale.set(1.25, 0.8, 0.7);
  tummy.renderOrder = 241;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 10), green);
  head.scale.set(1.2, 0.86, 0.86);
  head.position.y = 1.25;
  head.renderOrder = 242;
  alien.add(body, tummy, head);

  for (const x of [-0.15, 0.15]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), black);
    eye.position.set(x, 1.3, 0.35);
    eye.renderOrder = 243;
    alien.add(eye);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.032, 0.42, 6), green);
    antenna.position.set(x * 1.2, 1.62, 0.04);
    antenna.rotation.z = x < 0 ? -0.34 : 0.34;
    antenna.renderOrder = 242;
    alien.add(antenna);

    const bobble = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), slime);
    bobble.position.set(x * 1.75, 1.82, 0.1);
    bobble.renderOrder = 243;
    alien.add(bobble);
  }

  const jar = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), slime);
  jar.name = 'sneakleVisibleSlimeJar';
  jar.position.set(0.55, 0.68, 0.32);
  jar.renderOrder = 244;
  alien.add(jar);

  alien.position.set(THEFT_LEVEL.tradeAlienX ?? 18.9, 0, 2.0);
  alien.scale.setScalar(1.18);
  return alien;
}

function createTradePrize() {
  const prize = new THREE.Group();
  prize.name = 'sneakleVisibleTradePrize';
  prize.visible = false;

  const slimeMaterial = new THREE.MeshBasicMaterial({ color: 0x6cffd6, transparent: true, opacity: 0.84, depthTest: false, depthWrite: false });
  const fluxMaterial = new THREE.MeshBasicMaterial({ color: 0xff66ff, depthTest: false, depthWrite: false });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xfff066, depthTest: false, depthWrite: false });

  const slime = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 10), slimeMaterial);
  slime.scale.set(1.35, 0.58, 0.82);
  slime.position.set(-0.24, 0.42, 0.0);
  slime.renderOrder = 242;

  const flux = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), fluxMaterial);
  flux.name = 'sneakleVisibleFluxCapacitor';
  flux.position.set(0.48, 0.92, 0.12);
  flux.renderOrder = 244;

  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), glowMaterial);
  spark.name = 'sneakleVisibleFluxSpark';
  spark.position.set(0.48, 1.42, 0.16);
  spark.renderOrder = 245;

  prize.add(slime, flux, spark);
  prize.userData.flux = flux;
  prize.userData.spark = spark;
  prize.position.set((THEFT_LEVEL.tradeAlienX ?? 18.9) + 1.05, 0, 2.1);
  prize.scale.setScalar(1.18);
  return prize;
}

function createTradeOverlay() {
  const overlay = new THREE.Group();
  overlay.name = 'sneakleVisibleCheetosTradeOverlay';
  overlay.visible = false;

  const thrown = createThrownBackpack();
  const backpack = createBackpack();
  const alien = createWeirdAlien();
  const prize = createTradePrize();
  const throwLabel = makeLabel('BACKPACK!', 3.4, 3.05, 1.95);
  const backpackLabel = makeLabel('TOSSED BACKPACK · CHEETOS', THEFT_LEVEL.backpackX ?? 4.4, 2.15, 3.5);
  const alienLabel = makeLabel('CHEETOS?', THEFT_LEVEL.tradeAlienX ?? 18.9, 2.35, 1.9);
  const prizeLabel = makeLabel('ICKY SLIME + FLUX', (THEFT_LEVEL.tradeAlienX ?? 18.9) + 0.95, 2.15, 2.8);

  overlay.add(thrown, backpack, alien, prize, throwLabel, backpackLabel, alienLabel, prizeLabel);
  overlay.userData = { thrown, backpack, alien, prize, throwLabel, backpackLabel, alienLabel, prizeLabel };
  return overlay;
}

function renderTradeOverlay(now = performance.now()) {
  const run = surfaceAdventure.run;
  if (!tradeOverlay || !run || run.level?.kind !== 'theft') return;

  const time = now * 0.001;
  const isSneakleVisible = tradeAnchor?.visible !== false;
  tradeOverlay.visible = isSneakleVisible;
  if (!isSneakleVisible) return;

  const { thrown, backpack, alien, prize, throwLabel, backpackLabel, alienLabel, prizeLabel } = tradeOverlay.userData;

  const tossVisible = run.state === 'stealing' && run.theftBoardingProgress > 0.42 && run.theftProgress < 0.8;
  if (thrown) {
    thrown.visible = tossVisible;
    if (tossVisible) {
      const t = Math.min(1, Math.max(0, (run.theftBoardingProgress - 0.42) / 0.58));
      thrown.position.set(0.7 + t * 4.2, 1.05 + Math.sin(t * Math.PI) * 1.75, 2.1);
      thrown.rotation.z = -0.8 + t * 3.2;
    }
  }
  if (throwLabel) throwLabel.visible = tossVisible;

  const stranded = run.state === 'stranded';
  const backpackVisible = stranded && !run.hasCheetos && !run.backpackRecovered && !run.fluxCapacitorCollected;
  const backpackLabelVisible = backpackVisible && run.wobbleCoilInstalled;
  const alienVisible = stranded && !run.fluxCapacitorCollected;
  const alienLabelVisible = alienVisible && run.wobbleCoilInstalled;
  const prizeVisible = stranded && run.fluxCapacitorCollected;

  if (backpack) {
    backpack.visible = backpackVisible;
    backpack.position.y = Math.sin(time * 5) * 0.035;
    backpack.rotation.z = Math.sin(time * 4) * 0.045;
  }
  if (backpackLabel) backpackLabel.visible = backpackLabelVisible;

  if (alien) {
    alien.visible = alienVisible || prizeVisible;
    alien.position.y = Math.abs(Math.sin(time * 4.2)) * 0.08;
    alien.rotation.z = Math.sin(time * 5.5) * 0.07;
  }
  if (alienLabel) alienLabel.visible = alienLabelVisible && !prizeVisible;

  if (prize) {
    prize.visible = prizeVisible;
    if (prizeVisible) {
      prize.userData.flux.rotation.y += 0.1;
      prize.userData.spark.scale.setScalar(1.1 + Math.sin(time * 9) * 0.22);
    }
  }
  if (prizeLabel) prizeLabel.visible = prizeVisible;
}
