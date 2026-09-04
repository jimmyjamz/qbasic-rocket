// Visual helper for Sneakle's backpack, Cheetos, and weird-alien trade beat.
// Gameplay state remains in surfaceAdventureState.js.
import * as THREE from 'three';
import { surfaceAdventure, THEFT_LEVEL } from './surfaceAdventureState.js';

let theftSurfaceGroup = null;
let tradeOverlay = null;

const originalRendererRender = THREE.WebGLRenderer.prototype.render;
if (!originalRendererRender.__sneakleCheetosTradeWrapped) {
  const renderWithSneakleTradeOverlay = function renderWithSneakleTradeOverlay(...args) {
    ensureTradeOverlay(args[0]);
    renderTradeOverlay();
    return originalRendererRender.apply(this, args);
  };
  renderWithSneakleTradeOverlay.__sneakleCheetosTradeWrapped = true;
  THREE.WebGLRenderer.prototype.render = renderWithSneakleTradeOverlay;
}

function ensureTradeOverlay(scene) {
  if (tradeOverlay?.parent) return;

  const liveGroup = findTheftSurfaceGroup(scene);
  if (!liveGroup) return;

  theftSurfaceGroup = liveGroup;
  tradeOverlay = createTradeOverlay();
  theftSurfaceGroup.add(tradeOverlay);
}

function findTheftSurfaceGroup(scene) {
  if (!scene?.traverse) return null;

  let found = null;
  scene.traverse((object) => {
    if (!found && object?.name === 'theftSurfaceAdventure') found = object;
  });
  return found;
}

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
  sprite.renderOrder = 60;
  return sprite;
}

function createBackpack() {
  const backpack = new THREE.Group();
  backpack.name = 'sneakleCheetosBackpack';

  const packMaterial = new THREE.MeshBasicMaterial({ color: 0x46b2ff, depthTest: false });
  const trimMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd66, depthTest: false });
  const pocketMaterial = new THREE.MeshBasicMaterial({ color: 0x214b9b, depthTest: false });
  const cheetoMaterial = new THREE.MeshBasicMaterial({ color: 0xff7a1a, depthTest: false });

  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.82, 0.32), packMaterial);
  bag.position.y = 0.44;
  bag.renderOrder = 61;
  backpack.add(bag);

  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.34), pocketMaterial);
  pocket.position.set(0, 0.28, 0.04);
  pocket.renderOrder = 62;
  backpack.add(pocket);

  const flap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.36), trimMaterial);
  flap.position.y = 0.88;
  flap.renderOrder = 63;
  backpack.add(flap);

  for (const x of [-0.22, -0.04, 0.16, 0.3]) {
    const cheeto = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.032, 6, 14), cheetoMaterial);
    cheeto.name = 'sneakleLooseCheeto';
    cheeto.position.set(x, 1.04 + Math.abs(x) * 0.22, 0.18);
    cheeto.rotation.x = Math.PI / 2;
    cheeto.rotation.z = x * 3;
    cheeto.renderOrder = 64;
    backpack.add(cheeto);
  }

  return backpack;
}

function createThrowTrail() {
  const trail = new THREE.Group();
  trail.name = 'sneakleBackpackThrowTrail';
  const crumbMaterial = new THREE.MeshBasicMaterial({ color: 0xff7a1a, depthTest: false });

  for (let i = 0; i < 6; i += 1) {
    const crumb = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.022, 6, 12), crumbMaterial);
    crumb.position.set(-0.25 - i * 0.18, 0.06 + Math.sin(i) * 0.05, 0.02);
    crumb.rotation.x = Math.PI / 2;
    crumb.renderOrder = 59;
    trail.add(crumb);
  }

  return trail;
}

function createWeirdHelpfulAlien() {
  const alien = new THREE.Group();
  alien.name = 'sneakleHelpfulWeirdAlien';

  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xa8ef58, depthTest: false });
  const bellyMaterial = new THREE.MeshBasicMaterial({ color: 0xf4ff8a, depthTest: false });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x101321, depthTest: false });
  const slimeMaterial = new THREE.MeshBasicMaterial({ color: 0x6cffd6, depthTest: false });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.46, 5, 12), bodyMaterial);
  body.position.y = 0.54;
  body.renderOrder = 61;
  alien.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), bellyMaterial);
  belly.position.set(0, 0.5, 0.25);
  belly.scale.set(1.25, 0.8, 0.7);
  belly.renderOrder = 62;
  alien.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 10), bodyMaterial);
  head.scale.set(1.18, 0.86, 0.85);
  head.position.y = 1.12;
  head.renderOrder = 63;
  alien.add(head);

  for (const x of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 6), eyeMaterial);
    eye.position.set(x, 1.16, 0.3);
    eye.renderOrder = 64;
    alien.add(eye);
  }

  for (const x of [-0.18, 0.18]) {
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.36, 6), bodyMaterial);
    antenna.position.set(x, 1.42, 0.02);
    antenna.rotation.z = x < 0 ? -0.34 : 0.34;
    antenna.renderOrder = 63;
    alien.add(antenna);

    const bobble = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), slimeMaterial);
    bobble.position.set(x * 1.45, 1.58, 0.06);
    bobble.renderOrder = 64;
    alien.add(bobble);
  }

  const leftArm = new THREE.Group();
  leftArm.name = 'sneakleTradeAlienLeftArm';
  leftArm.position.set(-0.3, 0.74, 0.04);
  const leftLimb = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.038, 0.46, 8), bodyMaterial);
  leftLimb.position.y = -0.22;
  leftArm.add(leftLimb);
  leftArm.rotation.z = -0.95;
  alien.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.name = 'sneakleTradeAlienRightArm';
  rightArm.position.set(0.32, 0.72, 0.05);
  const rightLimb = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.038, 0.48, 8), bodyMaterial);
  rightLimb.position.y = -0.24;
  rightArm.add(rightLimb);
  rightArm.rotation.z = 0.86;
  alien.add(rightArm);

  const slimeJar = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), slimeMaterial);
  slimeJar.name = 'sneakleAlienSlimeJar';
  slimeJar.position.set(0.48, 0.57, 0.26);
  slimeJar.renderOrder = 65;
  alien.add(slimeJar);

  return alien;
}

function createTradePrize() {
  const prize = new THREE.Group();
  prize.name = 'sneakleTradePrize';

  const slimeMaterial = new THREE.MeshBasicMaterial({ color: 0x6cffd6, depthTest: false, transparent: true, opacity: 0.82 });
  const fluxMaterial = new THREE.MeshBasicMaterial({ color: 0xff66ff, depthTest: false });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xfff066, depthTest: false });

  const slime = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 10), slimeMaterial);
  slime.name = 'sneakleIckyStickySlime';
  slime.scale.set(1.25, 0.58, 0.8);
  slime.position.set(-0.18, 0.34, 0);
  slime.renderOrder = 62;
  prize.add(slime);

  const flux = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 1), fluxMaterial);
  flux.name = 'sneakleFluxCapacitor';
  flux.position.set(0.42, 0.82, 0.08);
  flux.renderOrder = 64;
  prize.add(flux);

  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), glowMaterial);
  spark.name = 'sneakleFluxSpark';
  spark.position.set(0.42, 1.25, 0.14);
  spark.renderOrder = 65;
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
  thrownBackpack.add(createThrowTrail());
  group.add(thrownBackpack);

  const throwSign = makeSign('BACKPACK!', 3.3, 3.05, 1.85);
  throwSign.name = 'sneakleBackpackThrowSign';
  throwSign.visible = false;
  group.add(throwSign);

  const groundedBackpack = createBackpack();
  groundedBackpack.name = 'sneakleGroundedCheetosBackpack';
  groundedBackpack.position.set(THEFT_LEVEL.backpackX ?? 4.4, 0, 1.15);
  groundedBackpack.visible = false;
  group.add(groundedBackpack);

  const backpackSign = makeSign('TOSSED BACKPACK · CHEETOS', THEFT_LEVEL.backpackX ?? 4.4, 1.82, 3.35);
  backpackSign.name = 'sneakleBackpackSign';
  backpackSign.visible = false;
  group.add(backpackSign);

  const alien = createWeirdHelpfulAlien();
  alien.position.set(THEFT_LEVEL.tradeAlienX ?? 18.9, 0, 1.16);
  alien.visible = false;
  group.add(alien);

  const alienSign = makeSign('CHEETOS?', THEFT_LEVEL.tradeAlienX ?? 18.9, 2.05, 1.85);
  alienSign.name = 'sneakleCheetosTradeSign';
  alienSign.visible = false;
  group.add(alienSign);

  const prize = createTradePrize();
  prize.position.set((THEFT_LEVEL.tradeAlienX ?? 18.9) + 0.98, 0, 1.18);
  prize.visible = false;
  group.add(prize);

  const prizeSign = makeSign('ICKY SLIME + FLUX', (THEFT_LEVEL.tradeAlienX ?? 18.9) + 0.82, 1.88, 2.75);
  prizeSign.name = 'sneakleTradePrizeSign';
  prizeSign.visible = false;
  group.add(prizeSign);

  group.userData.thrownBackpack = thrownBackpack;
  group.userData.throwSign = throwSign;
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
  const throwSign = tradeOverlay.userData.throwSign;
  const groundedBackpack = tradeOverlay.userData.groundedBackpack;
  const backpackSign = tradeOverlay.userData.backpackSign;
  const alien = tradeOverlay.userData.alien;
  const alienSign = tradeOverlay.userData.alienSign;
  const prize = tradeOverlay.userData.prize;
  const prizeSign = tradeOverlay.userData.prizeSign;

  const tossVisible = run.state === 'stealing' &&
    run.theftBoardingProgress > 0.62 &&
    run.theftProgress < 0.5;

  if (thrownBackpack) {
    thrownBackpack.visible = tossVisible;
    if (tossVisible) {
      const t = Math.min(1, Math.max(0, (run.theftBoardingProgress - 0.62) / 0.38));
      thrownBackpack.position.set(1.2 + t * 3.5, 1.15 + Math.sin(t * Math.PI) * 1.55, 1.24);
      thrownBackpack.rotation.z = -0.7 + t * 2.8;
      thrownBackpack.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.12);
    }
  }
  if (throwSign) throwSign.visible = tossVisible;

  const isStranded = run.state === 'stranded';
  const backpackOnGround = isStranded && !run.backpackRecovered && !run.hasCheetos && !run.fluxCapacitorCollected;
  const backpackReady = backpackOnGround && run.wobbleCoilInstalled;
  const alienExists = isStranded && !run.fluxCapacitorCollected;
  const alienWantsSnack = alienExists && run.wobbleCoilInstalled;
  const prizeVisible = isStranded && run.fluxCapacitorCollected;

  if (groundedBackpack) groundedBackpack.visible = backpackOnGround;
  if (backpackSign) backpackSign.visible = backpackReady;
  if (alien) alien.visible = alienExists || prizeVisible;
  if (alienSign) alienSign.visible = alienWantsSnack && !prizeVisible;
  if (prize) prize.visible = prizeVisible;
  if (prizeSign) prizeSign.visible = prizeVisible;

  const time = now * 0.001;
  if (backpackOnGround && groundedBackpack) {
    groundedBackpack.rotation.z = Math.sin(time * 4) * 0.04;
    groundedBackpack.position.y = Math.sin(time * 5) * 0.035;
  }
  if ((alienExists || prizeVisible) && alien) {
    alien.rotation.z = Math.sin(time * 5.5) * 0.07;
    alien.position.y = Math.abs(Math.sin(time * 4.2)) * 0.08;
    alien.getObjectByName('sneakleTradeAlienLeftArm').rotation.z = -0.95 + Math.sin(time * 7) * 0.18;
    alien.getObjectByName('sneakleTradeAlienRightArm').rotation.z = 0.86 + Math.cos(time * 7.5) * 0.18;
  }
  if (prizeVisible && prize) {
    prize.userData.flux.rotation.y += 0.1;
    prize.userData.spark.scale.setScalar(1.1 + Math.sin(time * 9) * 0.22);
  }
}