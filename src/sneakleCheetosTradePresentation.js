// Visual helper for Sneakle's backpack, Cheetos, and weird-alien trade beat.
// Gameplay state remains in surfaceAdventureState.js.
import * as THREE from 'three';
import { surfaceAdventure, THEFT_LEVEL } from './surfaceAdventureState.js';

let theftSurfaceGroup = null;
let tradeOverlay = null;

const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function addWithSneakleTradeCapture(...objects) {
  const result = originalSceneAdd.apply(this, objects);
  objects.forEach((object) => {
    if (object?.name === 'theftSurfaceAdventure' && !theftSurfaceGroup) {
      theftSurfaceGroup = object;
      tradeOverlay = createTradeOverlay();
      theftSurfaceGroup.add(tradeOverlay);
    }
  });
  return result;
};

const originalRendererRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function renderWithSneakleTradeOverlay(...args) {
  renderTradeOverlay();
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
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.position.set(x, y, 1.25);
  sprite.scale.set(width, width / 6, 1);
  sprite.renderOrder = 50;
  return sprite;
}

function createBackpack() {
  const backpack = new THREE.Group();
  backpack.name = 'sneakleCheetosBackpack';

  const packMaterial = new THREE.MeshBasicMaterial({ color: 0x46b2ff, depthTest: false });
  const trimMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd66, depthTest: false });
  const cheetoMaterial = new THREE.MeshBasicMaterial({ color: 0xff7a1a, depthTest: false });

  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.28), packMaterial);
  bag.position.y = 0.38;
  bag.renderOrder = 51;
  backpack.add(bag);

  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.3), trimMaterial);
  flap.position.y = 0.78;
  flap.renderOrder = 52;
  backpack.add(flap);

  for (const x of [-0.16, 0.02, 0.2]) {
    const cheeto = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 6, 14), cheetoMaterial);
    cheeto.name = 'sneakleLooseCheeto';
    cheeto.position.set(x, 0.92 + Math.abs(x) * 0.25, 0.16);
    cheeto.rotation.x = Math.PI / 2;
    cheeto.renderOrder = 53;
    backpack.add(cheeto);
  }

  return backpack;
}

function createWeirdHelpfulAlien() {
  const alien = new THREE.Group();
  alien.name = 'sneakleHelpfulWeirdAlien';

  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xa8ef58, depthTest: false });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x101321, depthTest: false });
  const slimeMaterial = new THREE.MeshBasicMaterial({ color: 0x6cffd6, depthTest: false });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 5, 10), bodyMaterial);
  body.position.y = 0.5;
  body.renderOrder = 51;
  alien.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 10), bodyMaterial);
  head.scale.set(1.15, 0.9, 0.85);
  head.position.y = 1.05;
  head.renderOrder = 52;
  alien.add(head);

  for (const x of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), eyeMaterial);
    eye.position.set(x, 1.08, 0.28);
    eye.renderOrder = 53;
    alien.add(eye);
  }

  const slimeJar = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), slimeMaterial);
  slimeJar.name = 'sneakleAlienSlimeJar';
  slimeJar.position.set(0.42, 0.62, 0.22);
  slimeJar.renderOrder = 54;
  alien.add(slimeJar);

  return alien;
}

function createTradePrize() {
  const prize = new THREE.Group();
  prize.name = 'sneakleTradePrize';

  const slimeMaterial = new THREE.MeshBasicMaterial({ color: 0x6cffd6, depthTest: false, transparent: true, opacity: 0.82 });
  const fluxMaterial = new THREE.MeshBasicMaterial({ color: 0xff66ff, depthTest: false });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xfff066, depthTest: false });

  const slime = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 10), slimeMaterial);
  slime.name = 'sneakleIckyStickySlime';
  slime.scale.set(1.25, 0.58, 0.8);
  slime.position.set(-0.18, 0.32, 0);
  slime.renderOrder = 52;
  prize.add(slime);

  const flux = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 1), fluxMaterial);
  flux.name = 'sneakleFluxCapacitor';
  flux.position.set(0.38, 0.78, 0.08);
  flux.renderOrder = 54;
  prize.add(flux);

  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), glowMaterial);
  spark.name = 'sneakleFluxSpark';
  spark.position.set(0.38, 1.22, 0.14);
  spark.renderOrder = 55;
  prize.add(spark);

  prize.userData.flux = flux;
  prize.userData.spark = spark;
  return prize;
}

function createTradeOverlay() {
  const group = new THREE.Group();
  group.name = 'sneakleCheetosTradeOverlay';
  group.visible = false;

  const thrownBackpack = createBackpack();
  thrownBackpack.name = 'sneakleThrownBackpack';
  thrownBackpack.visible = false;
  group.add(thrownBackpack);

  const groundedBackpack = createBackpack();
  groundedBackpack.position.set(THEFT_LEVEL.backpackX ?? 4.4, 0, 1.15);
  groundedBackpack.visible = false;
  group.add(groundedBackpack);

  const backpackSign = makeSign('BACKPACK · CHEETOS', THEFT_LEVEL.backpackX ?? 4.4, 1.72, 2.75);
  backpackSign.name = 'sneakleBackpackSign';
  backpackSign.visible = false;
  group.add(backpackSign);

  const alien = createWeirdHelpfulAlien();
  alien.position.set(THEFT_LEVEL.tradeAlienX ?? 18.9, 0, 1.16);
  alien.visible = false;
  group.add(alien);

  const alienSign = makeSign('CHEETOS?', THEFT_LEVEL.tradeAlienX ?? 18.9, 1.9, 1.75);
  alienSign.name = 'sneakleCheetosTradeSign';
  alienSign.visible = false;
  group.add(alienSign);

  const prize = createTradePrize();
  prize.position.set((THEFT_LEVEL.tradeAlienX ?? 18.9) + 0.95, 0, 1.18);
  prize.visible = false;
  group.add(prize);

  const prizeSign = makeSign('ICKY SLIME + FLUX', (THEFT_LEVEL.tradeAlienX ?? 18.9) + 0.7, 1.85, 2.65);
  prizeSign.name = 'sneakleTradePrizeSign';
  prizeSign.visible = false;
  group.add(prizeSign);

  group.userData.thrownBackpack = thrownBackpack;
  group.userData.groundedBackpack = groundedBackpack;
  group.userData.backpackSign = backpackSign;
  group.userData.alien = alien;
  group.userData.alienSign = alienSign;
  group.userData.prize = prize;
  group.userData.prizeSign = prizeSign;
  return group;
}

function renderTradeOverlay(now = performance.now()) {
  const run = surfaceAdventure.active ? surfaceAdventure.run : null;
  if (!tradeOverlay) return;

  const show = run?.level?.kind === 'theft';
  tradeOverlay.visible = show;
  if (!show) return;

  const thrownBackpack = tradeOverlay.userData.thrownBackpack;
  const groundedBackpack = tradeOverlay.userData.groundedBackpack;
  const backpackSign = tradeOverlay.userData.backpackSign;
  const alien = tradeOverlay.userData.alien;
  const alienSign = tradeOverlay.userData.alienSign;
  const prize = tradeOverlay.userData.prize;
  const prizeSign = tradeOverlay.userData.prizeSign;

  const tossVisible = run.state === 'stealing' && run.theftBoardingProgress > 0.72 && run.theftProgress < 0.35;
  if (thrownBackpack) {
    thrownBackpack.visible = tossVisible;
    if (tossVisible) {
      const t = Math.min(1, Math.max(0, (run.theftBoardingProgress - 0.72) / 0.28));
      thrownBackpack.position.set(1.8 + t * 3.0, 1.1 + Math.sin(t * Math.PI) * 1.35, 1.2);
      thrownBackpack.rotation.z = -0.5 + t * 2.2;
    }
  }

  const backpackVisible = run.state === 'stranded' && run.wobbleCoilInstalled && !run.backpackRecovered && !run.fluxCapacitorCollected;
  const alienVisible = run.state === 'stranded' && run.wobbleCoilInstalled && !run.fluxCapacitorCollected && (run.backpackRecovered || run.hasCheetos);
  const prizeVisible = run.state === 'stranded' && run.fluxCapacitorCollected;

  if (groundedBackpack) groundedBackpack.visible = backpackVisible;
  if (backpackSign) backpackSign.visible = backpackVisible;
  if (alien) alien.visible = alienVisible || prizeVisible;
  if (alienSign) alienSign.visible = alienVisible;
  if (prize) prize.visible = prizeVisible;
  if (prizeSign) prizeSign.visible = prizeVisible;

  const time = now * 0.001;
  if (backpackVisible && groundedBackpack) {
    groundedBackpack.rotation.z = Math.sin(time * 4) * 0.04;
    groundedBackpack.position.y = Math.sin(time * 5) * 0.035;
  }
  if ((alienVisible || prizeVisible) && alien) {
    alien.rotation.z = Math.sin(time * 5.5) * 0.07;
    alien.position.y = Math.abs(Math.sin(time * 4.2)) * 0.08;
  }
  if (prizeVisible && prize) {
    prize.userData.flux.rotation.y += 0.1;
    prize.userData.spark.scale.setScalar(1.1 + Math.sin(time * 9) * 0.22);
  }
}
