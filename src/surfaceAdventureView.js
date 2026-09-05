import * as THREE from 'three';
import { SPROUT_LEVEL, THEFT_SEQUENCE_SECONDS, THEFT_LAUNCH_PROGRESS } from './surfaceAdventureState.js';

export function createSurfaceAdventureView(createAstronaut, level = SPROUT_LEVEL) {
  const cinder = level.kind === 'steam';
  const frost = level.kind === 'ice';
  const contact = level.kind === 'aliens';
  const theft = level.kind === 'theft';
  const group = new THREE.Group();
  group.name = cinder ? 'cinderSurfaceAdventure' : frost ? 'frostSurfaceAdventure' : contact ? 'contactSurfaceAdventure' : theft ? 'theftSurfaceAdventure' : 'sproutSurfaceAdventure';
  group.visible = false;
  const soil = new THREE.MeshStandardMaterial({ color: cinder ? 0x914b32 : frost ? 0xaeddf4 : contact ? 0x56449d : theft ? 0x5b3f8f : 0x265b44, roughness: frost ? 0.3 : 0.85, metalness: frost ? 0.08 : 0 });
  const vine = new THREE.MeshStandardMaterial({ color: 0x64c779, roughness: 0.65 });
  const glow = new THREE.MeshStandardMaterial({ color: theft ? 0xffdd66 : 0xb4ffc3, emissive: theft ? 0xffdd66 : 0x48aa65, emissiveIntensity: theft ? 0.22 : 0.3 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(level.maxX - level.minX + 2, 0.6, 4.8), soil);
  floor.position.set((level.maxX + level.minX) / 2, -0.36, -0.8);
  group.add(floor);

  const barrier = new THREE.Mesh(new THREE.BoxGeometry(2, SPROUT_LEVEL.obstacleHeight, 1.4), vine);
  barrier.position.set(9, SPROUT_LEVEL.obstacleHeight / 2 - 0.06, 0);
  group.add(barrier);
  barrier.visible = !cinder && !frost && !contact && !theft;
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), glow);
    leaf.scale.set(1, 0.3, 0.6);
    leaf.rotation.z = i % 2 ? 0.35 : -0.35;
    leaf.position.set(8.15 + i * 0.28, 0.6 + (i % 3) * 0.3, 0.76);
    if (!cinder && !frost && !contact && !theft) group.add(leaf);
  }
  // Fixed decorative seed groves behind the single traversable obstacle.
  for (const x of [3, 5, 12, 15, 21]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 8), vine);
    stem.position.set(x, 0.7, -2);
    if (!cinder && !frost && !contact && !theft) group.add(stem);
    const seed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), cinder ? soil : glow);
    seed.position.set(x, cinder ? 0.4 : 1.6, -2);
    if (cinder) seed.scale.set(0.8, 2, 0.8);
    if (!frost && !contact && !theft) group.add(seed);
  }
  function sign(text, x, y, width = 4) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = theft ? '#2d1744' : '#102b29';
    ctx.fillRect(0, 0, 768, 128);
    ctx.strokeStyle = theft ? '#ffdd66' : '#a2f2bd';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 762, 122);
    ctx.fillStyle = theft ? '#fff9d7' : '#edfff3';
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
    return sprite;
  }
  sign('ROCKET · E', 0, 3.25, 1.9);
  if (!cinder && !frost && !contact && !theft) sign('SPACE + MOVE', 9, 2.25, 2.2);
  if (theft) {
    sign('TINY FOOTPRINTS?', 4.8, 2.0, 2.6);
  }
  const beacon = theft
    ? sign('BROKEN UFO · NEEDS PARTS!', level.ufoApproachX + 1.6, 2.25, 3.3)
    : sign(level.npcLabel, level.targetX, 1.7, 2);
  const ventSigns = cinder ? [
    sign('WAIT · STEAM', 10, 2.1, 2.4),
    sign('GO · COOL', 10, 2.1, 2.4),
    sign('WAIT · WARMING', 10, 2.1, 2.4)
  ] : [];
  ventSigns.forEach((sign, index) => sign.material.color.setHex([0xffa083, 0x8affb3, 0xffdc77][index]));
  const steam = new THREE.Group();
  if (cinder) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.15, 16), soil);
    vent.position.set(10, 0, 0);
    group.add(vent);
    for (let i = 0; i < 12; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff5e8, transparent: true, opacity: 0.35, depthWrite: false }));
      puff.position.set(10 + Math.sin(i * 3) * 0.5, 0.5 + i * 0.8, 0);
      steam.add(puff);
    }
    group.add(steam);
  }
  const iceMaterial = new THREE.MeshStandardMaterial({ color: 0x8edcff, emissive: 0x22577a, emissiveIntensity: 0.18, transparent: true, opacity: 0.84, roughness: 0.22 });
  const pickaxe = new THREE.Group();
  const column = new THREE.Group();
  let pickaxeSign = null;
  let columnSign = null;
  if (frost) {
    pickaxeSign = sign('PICKAXE', 5, 2.2, 1.8);
    columnSign = sign('BREAK ICE', 12, 3.8, 2.1);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x82502e }));
    handle.rotation.z = -0.55;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.14, 0.16), new THREE.MeshStandardMaterial({ color: 0xd7edf7, metalness: 0.65, roughness: 0.25 }));
    head.position.set(-0.32, 0.47, 0);
    head.rotation.z = -0.55;
    pickaxe.add(handle, head);
    pickaxe.position.set(level.pickaxeX, 0.62, 0.35);
    group.add(pickaxe);
    for (let i = 0; i < 5; i++) {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.48 - i * 0.035, 2.6 + (i % 2) * 0.6, 7), iceMaterial.clone());
      shard.position.set((level.obstacleLeft + level.obstacleRight) / 2 + (i - 2) * 0.22, 1.25, (i % 2) * 0.25);
      shard.rotation.z = (i - 2) * 0.08;
      column.add(shard);
    }
    group.add(column);
    for (const x of [3, 7.5, 16, 19]) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), iceMaterial);
      crystal.scale.set(0.75, 2.1, 0.75);
      crystal.position.set(x, 0.55, -2);
      group.add(crystal);
    }
  }
  function createAlien() {
    const alien = new THREE.Group();
    const green = new THREE.MeshStandardMaterial({ color: 0xa8ef58, emissive: 0x315d16, emissiveIntensity: 0.25 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x101321 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.42, 5, 10), green);
    body.position.y = 0.45;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10), green);
    head.scale.set(1, 1.25, 0.8);
    head.position.y = 1.08;
    alien.add(body, head);
    for (const x of [-0.13, 0.13]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), dark);
      eye.position.set(x, 1.13, 0.27);
      alien.add(eye);
    }
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.name = side < 0 ? 'leftAlienArm' : 'rightAlienArm';
      arm.position.set(side * 0.27, 0.73, 0);
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.42, 8), green);
      limb.position.y = -0.19;
      arm.add(limb);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), green);
      palm.scale.set(0.85, 0.65, 0.75);
      palm.position.y = -0.42;
      arm.add(palm);
      for (let finger = -1; finger <= 1; finger++) {
        const digit = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.16, 6), green);
        digit.position.set(finger * 0.045, -0.52, 0);
        digit.rotation.z = finger * 0.32;
        arm.add(digit);
      }
      arm.rotation.z = side * 0.38;
      alien.add(arm);
    }
    return alien;
  }
  function createMischiefAlien(index) {
    const alien = new THREE.Group();
    alien.name = `rocketThiefAlien${index + 1}`;
    const yellow = new THREE.MeshStandardMaterial({ color: 0xffdd66, emissive: 0x5f3a00, emissiveIntensity: 0.18, roughness: 0.58 });
    const dark = new THREE.MeshBasicMaterial({ color: 0x16111f });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.28, 5, 10), yellow);
    body.position.y = 0.36;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), yellow);
    head.scale.set(1.15, 0.82, 0.88);
    head.position.y = 0.8;
    alien.add(body, head);
    for (const x of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), dark);
      eye.position.set(x, 0.83, 0.24);
      alien.add(eye);
    }
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 5), yellow);
    hat.position.y = 1.12;
    hat.rotation.z = index % 2 ? 0.22 : -0.22;
    alien.add(hat);
    alien.scale.setScalar(0.9 + index * 0.05);
    return alien;
  }
  function createWobblyTower(index) {
    const tower = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.5, 7), glow);
    base.position.y = 0.25;
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7 + (index % 3) * 0.1, 7), glow);
    top.position.y = 0.86;
    top.rotation.z = index % 2 ? 0.16 : -0.16;
    tower.add(base, top);
    return tower;
  }
  function createBrokenUfo() {
    const ufo = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({ color: 0xd7d5ff, roughness: 0.32, metalness: 0.55 });
    const underside = new THREE.MeshStandardMaterial({ color: 0x44306f, roughness: 0.45, metalness: 0.2 });
    const crack = new THREE.MeshBasicMaterial({ color: 0x14091f });
    const smoke = new THREE.MeshBasicMaterial({ color: 0x6b6383, transparent: true, opacity: 0.34, depthWrite: false });
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.85, 0.34, 40), hull);
    saucer.position.y = 0.72;
    saucer.scale.z = 0.62;
    ufo.add(saucer);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.74, 24, 12), glow);
    dome.position.y = 1.02;
    dome.scale.set(1, 0.48, 0.7);
    ufo.add(dome);
    const brokenPanel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), crack);
    brokenPanel.position.set(-0.45, 0.95, 0.52);
    brokenPanel.rotation.z = -0.62;
    ufo.add(brokenPanel);
    const loosePanel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.48), underside);
    loosePanel.position.set(1.05, 0.34, -0.08);
    loosePanel.rotation.z = -0.75;
    loosePanel.rotation.y = 0.4;
    ufo.add(loosePanel);
    for (const x of [-1.05, 0.2, 1.0]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.7, 8), underside);
      foot.position.set(x, 0.05, x === 0.2 ? 0.42 : -0.22);
      foot.rotation.z = x * 0.16;
      ufo.add(foot);
    }
    for (let i = 0; i < 5; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18 + i * 0.04, 10, 8), smoke);
      puff.position.set(-0.95 + i * 0.18, 1.18 + i * 0.28, -0.18);
      puff.userData.smokePhase = i * 0.8;
      ufo.add(puff);
    }
    for (let i = 0; i < 4; i += 1) {
      const spark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), glow);
      spark.position.set(0.85 + i * 0.1, 0.78 + (i % 2) * 0.18, 0.54);
      spark.userData.sparkPhase = i * 0.9;
      ufo.add(spark);
    }
    ufo.rotation.z = -0.18;
    return ufo;
  }
  function createWobbleCoilTrail() {
    const trail = new THREE.Group();
    trail.name = 'sneakleVisibleWobbleCoilTrail';
    trail.visible = false;

    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x79649e, roughness: 0.85 });
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xfff066, depthTest: false });
    const coilMaterial = new THREE.MeshBasicMaterial({ color: 0xff6a00, depthTest: false });
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x7df5ff, depthTest: false });
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xfff066, depthTest: false });

    const platformXs = level.wobbleCoilPlatformXs ?? [21.0, 20.0, 19.2, 18.4];
    platformXs.forEach((x, index) => {
      const y = 0.78 + index * 0.34;
      const platform = new THREE.Mesh(new THREE.BoxGeometry(index === platformXs.length - 1 ? 1.8 : 1.18, 0.2, 0.82), platformMaterial);
      platform.name = `sneakleVisibleScrapHop${index + 1}`;
      platform.position.set(x, y, -0.8);
      platform.rotation.z = index % 2 === 0 ? -0.08 : 0.08;
      platform.renderOrder = 20;
      trail.add(platform);

      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), lampMaterial);
      lamp.name = `sneakleVisibleScrapLamp${index + 1}`;
      lamp.position.set(x, y + 0.2, -0.8);
      lamp.renderOrder = 21;
      trail.add(lamp);
    });

    for (const x of [21.25, 20.45, 19.65]) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 3), arrowMaterial);
      arrow.name = 'sneakleVisibleCoilArrow';
      arrow.position.set(x, 1.75, -0.65);
      arrow.rotation.z = Math.PI / 2;
      arrow.renderOrder = 21;
      trail.add(arrow);
    }

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 0.9), platformMaterial);
    shelf.name = 'sneakleVisibleWobbleCoilShelf';
    shelf.position.set(level.wobbleCoilX ?? 18.4, (level.wobbleCoilY ?? 2.05) - 0.28, -0.8);
    shelf.renderOrder = 20;
    trail.add(shelf);

    const coilGroup = new THREE.Group();
    coilGroup.name = 'sneakleVisibleWobbleCoilPickup';
    coilGroup.position.set(level.wobbleCoilX ?? 18.4, level.wobbleCoilY ?? 2.05, -0.65);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 12, 36), coilMaterial);
    coil.name = 'sneakleVisibleWobbleCoil';
    coil.rotation.x = Math.PI / 2;
    coil.renderOrder = 24;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), coreMaterial);
    core.name = 'sneakleVisibleWobbleCoilCore';
    core.renderOrder = 25;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), lampMaterial);
    beacon.name = 'sneakleVisibleWobbleCoilBeacon';
    beacon.position.y = 0.68;
    beacon.renderOrder = 25;
    coilGroup.add(coil, core, beacon);
    trail.add(coilGroup);
    trail.userData.coilPickup = coilGroup;
    trail.userData.coil = coil;
    trail.userData.beacon = beacon;
    trail.userData.beaconHomeY = beacon.position.y;

    return trail;
  }
  // RKT-73 belongs to this surface view, just like the coil trail.
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
    const fabric = new THREE.MeshStandardMaterial({ color: 0x278cce, roughness: 0.95 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x123c69, roughness: 0.9 });
    const zip = new THREE.MeshStandardMaterial({ color: 0xe8c86c, metalness: 0.35, roughness: 0.5 });
    const add = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      backpack.add(mesh);
      return mesh;
    };
    const body = add(new THREE.CapsuleGeometry(0.28, 0.32, 6, 16), fabric, 0, 0, 0);
    body.scale.z = 0.62;
    const pocket = add(new THREE.CapsuleGeometry(0.16, 0.16, 5, 12), trim, 0, -0.12, 0.17);
    pocket.rotation.z = Math.PI / 2;
    pocket.scale.z = 0.48;
    add(new THREE.BoxGeometry(0.36, 0.025, 0.025), zip, 0, -0.035, 0.25);
    add(new THREE.BoxGeometry(0.025, 0.085, 0.02), zip, 0.14, -0.065, 0.27);
    const handle = add(new THREE.TorusGeometry(0.1, 0.027, 6, 16, Math.PI), trim, 0, 0.42, 0);
    handle.name = 'backpackCarryHandle';
    for (const side of [-1, 1]) {
      const strap = add(new THREE.TorusGeometry(0.17, 0.035, 6, 20), trim, side * 0.25, -0.015, -0.12);
      strap.name = 'backpackShoulderStrap';
      strap.scale.set(0.65, 1.85, 1);
      strap.rotation.y = side * 0.35;
      add(new THREE.BoxGeometry(0.055, 0.055, 0.04), zip, side * 0.25, -0.24, -0.08);
    }
    // One child-sized bag, in the same depth plane as the astronaut.
    backpack.scale.setScalar(0.85);
    backpack.rotation.set(-0.2, 0.15, -1.12);
    backpack.updateMatrixWorld(true);
    const groundY = (level.backpackY ?? 0) - new THREE.Box3().setFromObject(backpack).min.y;
    backpack.position.set(level.backpackX ?? 4.4, groundY, 0.65);
    backpack.userData.restPosition = backpack.position.clone();
    backpack.userData.restRotation = backpack.rotation.clone();
    return backpack;
  }
  function createWeirdAlien() {
    const alien = new THREE.Group();
    alien.name = 'sneakleVisibleWeirdHelpfulAlien';
    alien.visible = false;

    const green = new THREE.MeshStandardMaterial({ color: 0xa8ef58, roughness: 0.75 });
    const belly = new THREE.MeshStandardMaterial({ color: 0xf4ff8a, roughness: 0.75 });
    const black = new THREE.MeshStandardMaterial({ color: 0x101321, roughness: 0.75 });
    const slime = new THREE.MeshStandardMaterial({ color: 0x6cffd6, roughness: 0.75 });

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

    for (const side of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), green);
      foot.scale.set(0.9, 0.55, 1.5);
      foot.position.set(side * 0.2, 0.085, 0.1);
      alien.add(foot);
    }
    alien.position.set(level.tradeAlienX ?? 20.6, level.tradeAlienY ?? 0, 0.18);
    alien.scale.setScalar(0.7);
    return alien;
  }

  function createTradePrize() {
    const prize = new THREE.Group();
    prize.name = 'sneakleVisibleTradePrize';
    prize.visible = false;

    const slimeMaterial = new THREE.MeshStandardMaterial({ color: 0x6cffd6, transparent: true, opacity: 0.84, roughness: 0.75 });
    const fluxMaterial = new THREE.MeshStandardMaterial({ color: 0xff66ff, roughness: 0.75 });
    const glowMaterial = new THREE.MeshStandardMaterial({ color: 0xfff066, roughness: 0.75 });

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
    prize.position.set((level.tradeAlienX ?? 20.6) + 0.85, 0, 0.3);
    prize.scale.setScalar(0.65);
    return prize;
  }

  function createTradeOverlay() {
    const overlay = new THREE.Group();
    overlay.name = 'sneakleVisibleCheetosTradeOverlay';
    overlay.visible = false;


    const backpack = createBackpack();
    const alien = createWeirdAlien();
    const prize = createTradePrize();
    const throwLabel = makeLabel('BACKPACK!', 3.4, 3.05, 1.95);
    const backpackLabel = makeLabel('TOSSED BACKPACK · CHEETOS', level.backpackX ?? 4.4, 2.15, 3.5);
    const alienLabel = makeLabel('CHEETOS?', level.tradeAlienX ?? 20.6, 1.75, 1.3);
    const prizeLabel = makeLabel('ICKY SLIME + FLUX', (level.tradeAlienX ?? 20.6) + 0.5, 1.85, 2.0);

    alienLabel.position.z = 0.4;
    prizeLabel.position.z = 0.4;
    overlay.add(backpack, alien, prize, throwLabel, backpackLabel, alienLabel, prizeLabel);
    overlay.userData = { backpack, alien, prize, throwLabel, backpackLabel, alienLabel, prizeLabel };
    return overlay;
  }

  function updateCheetosTrade(run, now = performance.now()) {

    if (!tradeOverlay || !run || run.level?.kind !== 'theft') return;

    const time = now * 0.001;
    tradeOverlay.visible = true;

    const { backpack, alien, prize, throwLabel, backpackLabel, alienLabel, prizeLabel } = tradeOverlay.userData;

    const stranded = run.state === 'stranded';
    const backpackVisible = stranded && !run.hasCheetos && !run.backpackRecovered && !run.fluxCapacitorCollected;
    const backpackLabelVisible = backpackVisible && run.wobbleCoilInstalled;
    const alienVisible = stranded && !run.fluxCapacitorCollected;
    const alienLabelVisible = alienVisible && run.wobbleCoilInstalled;
    const prizeVisible = stranded && run.fluxCapacitorCollected;

    // Keep the same mesh through the toss, landing, and stranded phases.
    // Match the launch curve: rocket rises 8.2 units with cubic ease-out.
    // A 2.1-unit rise brings its base to the yellow treetops above the surface.
    const treetopProgress = 1 - Math.cbrt(1 - 2.1 / 8.2);
    const tossStartSeconds = THEFT_SEQUENCE_SECONDS * (THEFT_LAUNCH_PROGRESS + treetopProgress * (1 - THEFT_LAUNCH_PROGRESS));
    const tossDurationSeconds = 1.1;
    const tossing = run.state === 'stealing' && run.theftElapsedSeconds > tossStartSeconds;
    backpack.visible = backpackVisible || tossing;
    backpack.position.copy(backpack.userData.restPosition);
    backpack.rotation.copy(backpack.userData.restRotation);
    const t = THREE.MathUtils.clamp((run.theftElapsedSeconds - tossStartSeconds) / tossDurationSeconds, 0, 1);
    if (tossing && t < 1) {
      backpack.position.x = THREE.MathUtils.lerp(0.7, backpack.userData.restPosition.x, t);
      backpack.position.y += (1 - t) * 1.05 + Math.sin(t * Math.PI) * 1.35;
      backpack.position.z = THREE.MathUtils.lerp(0.18, backpack.userData.restPosition.z, t);
      backpack.rotation.z += (1 - t) * Math.PI * 2;
    }
    throwLabel.visible = tossing && t < 1;
    if (backpackLabel) backpackLabel.visible = backpackLabelVisible;

    if (alien) {
      alien.visible = alienVisible || prizeVisible;
      alien.position.y = level.tradeAlienY ?? 0;
      alien.rotation.y = -0.15 + Math.sin(time * 1.2) * 0.045;
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
  const alienCrowd = new THREE.Group();
  const friendlyAlien = createAlien();
  const gardenGate = new THREE.Group();
  let gardenSign = null;
  if (contact) {
    [3.6, 4.25, 4.9, 5.55, 6.2, 6.85, 7.5].forEach((x, index) => {
      const alien = createAlien();
      alien.position.set(x, 0, index % 2 ? 0.35 : -0.2);
      alien.userData.crowdHome = { x, z: alien.position.z };
      alien.userData.crowdPhase = index * 1.37;
      alien.scale.setScalar(0.9 + (index % 3) * 0.08);
      alienCrowd.add(alien);
    });
    group.add(alienCrowd);
    friendlyAlien.position.set(level.targetX, 0, 0);
    group.add(friendlyAlien);
    const gateMaterial = new THREE.MeshStandardMaterial({ color: 0xc8ff72, emissive: 0x315d16, emissiveIntensity: 0.25 });
    const postGeometry = new THREE.BoxGeometry(0.22, 2.2, 0.35);
    for (const offset of [-0.8, 0.8]) {
      const post = new THREE.Mesh(postGeometry, gateMaterial);
      post.position.set(level.gateX + offset, 1.05, 0);
      gardenGate.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 0.35), gateMaterial);
    lintel.position.set(level.gateX, 2.1, 0);
    gardenGate.add(lintel);
    group.add(gardenGate);
    gardenSign = sign('MOON-PICKLE GATE · E', level.gateX, 2.7, 3.2);
  }
  const thiefCrew = new THREE.Group();
  const brokenUfo = new THREE.Group();
  const wobbleCoilTrail = theft ? createWobbleCoilTrail() : null;
  const tradeOverlay = theft ? createTradeOverlay() : null;
  const wobbleTrailSign = theft ? sign('COIL TRAIL ←', level.hatchX - 1.05, 2.95, 2.45) : null;
  const wobbleCoilSign = theft ? sign('WOBBLE COIL', level.wobbleCoilX ?? 18.4, (level.wobbleCoilY ?? 2.05) + 1.2, 2.2) : null;
  if (wobbleTrailSign) wobbleTrailSign.visible = false;
  if (wobbleCoilSign) wobbleCoilSign.visible = false;
  if (theft) {
    for (let i = 0; i < 20; i += 1) {
      const tower = createWobblyTower(i);
      tower.position.set(-0.8 + i * 1.35, -0.16, -1.55 + Math.sin(i * 1.7) * 0.7);
      tower.rotation.y = i * 0.61;
      tower.userData.phase = i * 0.63;
      group.add(tower);
    }
    [2.45, 2.9, 3.35].forEach((x, index) => {
      const alien = createMischiefAlien(index);
      alien.position.set(x, 0, index % 2 ? 0.42 : 0.05);
      alien.userData.homeX = x;
      alien.userData.phase = index * 1.07;
      thiefCrew.add(alien);
    });
    group.add(thiefCrew);
    const ufo = createBrokenUfo();
    brokenUfo.add(ufo);
    brokenUfo.position.set(level.ufoX, 0, -0.12);
    brokenUfo.visible = false;
    group.add(brokenUfo);
    group.add(wobbleCoilTrail, tradeOverlay);
  }
  const portal = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.025, 8, 40), glow);
  portal.rotation.x = Math.PI / 2;
  portal.position.set(0, 0.01, 0);
  group.add(portal);
  const npc = createAstronaut();
  npc.children[0].material = npc.children[0].material.clone();
  npc.children[0].material.color.setHex(cinder ? 0xffac55 : frost ? 0xbdefff : theft ? 0xffdd66 : 0x83df9c);
  npc.scale.setScalar(0.85);
  npc.name = 'surfaceRescueNpc';
  group.add(npc);
  let vortexStart = null;
  return {
    group,
    startVortex() { vortexStart = npc.position.clone(); },
    updateVortex(progress, target) {
      if (!vortexStart || !npc.visible) return;
      npc.position.lerpVectors(vortexStart, target, 1 - (1 - progress) ** 3);
      npc.rotation.set(progress * 8, progress * 12, progress * 18);
      npc.scale.setScalar(0.85 * (1 - progress * 0.95));
    },
    update(run) {
      if (cinder) {
        const state = run.vent;
        ventSigns.forEach((sign, index) => { sign.visible = index === (state.safe ? 1 : state.label.includes('WARMING') ? 2 : 0); });
        steam.visible = !state.safe;
        steam.children.forEach((puff, index) => {
          puff.scale.setScalar(state.label.includes('WARMING') ? 0.3 : 1 + Math.sin(state.remaining * 6 + index) * 0.18);
          puff.position.y = 0.5 + index * 0.8 + (1 - state.remaining % 1) * 0.5;
        });
      }
      if (frost) {
        pickaxe.visible = !run.columnBroken;
        pickaxe.position.set(run.hasPickaxe ? run.player.x + 0.45 : level.pickaxeX, run.hasPickaxe ? run.player.y + 0.7 : 0.62, 0.35);
        pickaxe.scale.setScalar(run.hasPickaxe ? 0.72 : 1);
        column.visible = !run.columnBroken;
        column.children.forEach((shard, index) => {
          shard.rotation.z = (index - 2) * 0.08 + run.breakProgress * (index - 2) * 0.38;
          shard.position.y = 1.25 - run.breakProgress * (0.55 + index * 0.05);
          shard.scale.setScalar(1 - run.breakProgress * 0.55);
        });
        pickaxeSign.visible = !run.hasPickaxe;
        columnSign.visible = run.hasPickaxe && !run.columnBroken;
      }
      if (contact) {
        const insideGarden = ['garden', 'welcomed'].includes(run.contactStage);
        const showBlockade = run.contactStage === 'blocked';
        alienCrowd.visible = !insideGarden;
        friendlyAlien.visible = insideGarden;
        gardenGate.visible = run.contactStage !== 'welcomed';
        gardenSign.visible = run.contactStage !== 'welcomed';
        alienCrowd.children.forEach((alien, index) => {
          const time = performance.now() * 0.001;
          const phase = alien.userData.crowdPhase;
          const home = alien.userData.crowdHome;
          const shuffle = Math.sin(time * (4.2 + index * 0.13) + phase);
          const surge = Math.sin(time * 2.3 + phase * 1.7);
          const hop = Math.abs(Math.sin(time * (5.5 + index * 0.2) + phase)) * (index % 2 ? 0.12 : 0.2);
          alien.position.x = home.x + shuffle * 0.18 + surge * 0.08;
          alien.position.z = home.z + Math.cos(time * 3.1 + phase) * 0.18;
          alien.rotation.z = shuffle * (index % 2 ? 0.2 : -0.2);
          alien.rotation.y = Math.sin(time * 2.8 + phase) * 0.18;
          const leftArm = alien.getObjectByName('leftAlienArm');
          const rightArm = alien.getObjectByName('rightAlienArm');
          leftArm.rotation.z = -0.38 - Math.sin(time * 6.1 + phase) * 0.28;
          rightArm.rotation.z = 0.38 + Math.cos(time * 5.4 + phase) * 0.28;
          // Only the unresolved first-visit blockade mirrors jetpack height.
          // Once the translator opens the gate, the crowd may fidget but never
          // becomes a visible all-altitude blocker during the return path.
          alien.position.y = index === 0 && showBlockade ? Math.max(hop, run.player.y) : hop;
        });
        const friendlyTime = performance.now() * 0.001;
        friendlyAlien.rotation.z = Math.sin(friendlyTime * 3) * 0.055;
        friendlyAlien.getObjectByName('leftAlienArm').rotation.z = -0.42;
        friendlyAlien.getObjectByName('rightAlienArm').rotation.z = 2.05 + Math.sin(friendlyTime * 7) * 0.22;
      }
      if (theft) {
        const time = performance.now() * 0.001;
        const progress = run.theftBoardingProgress ?? run.theftProgress ?? 0;
        const dash = THREE.MathUtils.smoothstep(progress, 0.08, 1);
        const crewVisible = run.state === 'stealing' && (run.theftProgress ?? 0) <= 0.001;
        thiefCrew.visible = crewVisible;
        thiefCrew.children.forEach((alien, index) => {
          const hop = Math.abs(Math.sin(time * (6.4 + index * 0.2) + alien.userData.phase)) * 0.16;
          alien.position.x = THREE.MathUtils.lerp(alien.userData.homeX, 0.12 + index * 0.08, dash);
          const boarded = dash > 0.94;
          alien.position.y = hop + (boarded ? 0.72 + index * 0.14 : 0);
          alien.rotation.z = Math.sin(time * 7.3 + index) * 0.18;
          alien.visible = crewVisible;
        });
        brokenUfo.visible = run.state === 'stranded';
        brokenUfo.rotation.z = -0.18 + Math.sin(time * 1.6) * 0.025;
        brokenUfo.children.forEach((child) => {
          child.children.forEach((part) => {
            if (part.userData?.smokePhase !== undefined) {
              part.position.y += Math.sin(time * 1.8 + part.userData.smokePhase) * 0.0015;
              part.material.opacity = 0.24 + Math.abs(Math.sin(time * 1.6 + part.userData.smokePhase)) * 0.18;
            }
            if (part.userData?.sparkPhase !== undefined) {
              part.visible = Math.sin(time * 10 + part.userData.sparkPhase) > -0.2;
              part.scale.setScalar(0.75 + Math.abs(Math.sin(time * 8 + part.userData.sparkPhase)) * 0.55);
            }
          });
        });
        updateCheetosTrade(run);
        const platformsVisible = run.state === 'stranded' && run.ufoHatchInspected;
        const coilPickupVisible = platformsVisible && !run.wobbleCoilCollected;
        if (wobbleCoilTrail) wobbleCoilTrail.visible = platformsVisible;
        if (wobbleCoilTrail?.userData?.coilPickup) wobbleCoilTrail.userData.coilPickup.visible = coilPickupVisible;
        wobbleCoilTrail.children.forEach((part) => {
          if (part.name === 'sneakleVisibleCoilArrow' || part.name.startsWith('sneakleVisibleScrapLamp')) {
            part.visible = coilPickupVisible;
          }
        });
        if (wobbleTrailSign) wobbleTrailSign.visible = coilPickupVisible;
        if (wobbleCoilSign) wobbleCoilSign.visible = coilPickupVisible;
        if (coilPickupVisible && wobbleCoilTrail?.userData?.coil) {
          wobbleCoilTrail.userData.coil.rotation.y += 0.12;
          wobbleCoilTrail.userData.beacon.position.y = wobbleCoilTrail.userData.beaconHomeY + Math.sin(time * 8) * 0.12;
          wobbleCoilTrail.userData.beacon.scale.setScalar(1.35 + Math.sin(time * 7) * 0.18);
        }
        group.children.forEach((child) => {
          if (child.userData?.phase === undefined) return;
          child.rotation.z = Math.sin(time * 1.8 + child.userData.phase) * 0.055;
        });
      }
      vortexStart = null;
      npc.scale.setScalar(0.85);
      npc.rotation.set(0, 0, 0);
      npc.visible = !contact && !theft && run.state !== 'boarded';
      npc.position.set(run.npc.x, run.npc.y, 0.18);
      beacon.visible = theft ? run.state === 'stranded' && !run.ufoDiscovered : run.state === 'visible';
      npc.rotation.y = run.state === 'following' ? -0.22 : 0.22;
    }
  };
}
