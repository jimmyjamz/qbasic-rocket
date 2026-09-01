import * as THREE from 'three';
import { SPROUT_LEVEL } from './surfaceAdventureState.js';

export function createSurfaceAdventureView(createAstronaut, level = SPROUT_LEVEL) {
  const cinder = level.kind === 'steam';
  const frost = level.kind === 'ice';
  const contact = level.kind === 'aliens';
  const group = new THREE.Group();
  group.name = cinder ? 'cinderSurfaceAdventure' : frost ? 'frostSurfaceAdventure' : contact ? 'contactSurfaceAdventure' : 'sproutSurfaceAdventure';
  group.visible = false;
  const soil = new THREE.MeshStandardMaterial({ color: cinder ? 0x914b32 : frost ? 0xaeddf4 : contact ? 0x56449d : 0x265b44, roughness: frost ? 0.3 : 0.85, metalness: frost ? 0.08 : 0 });
  const vine = new THREE.MeshStandardMaterial({ color: 0x64c779, roughness: 0.65 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xb4ffc3, emissive: 0x48aa65, emissiveIntensity: 0.3 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(level.maxX - level.minX + 2, 0.6, 4.8), soil);
  floor.position.set((level.maxX + level.minX) / 2, -0.36, -0.8);
  group.add(floor);

  const barrier = new THREE.Mesh(new THREE.BoxGeometry(2, SPROUT_LEVEL.obstacleHeight, 1.4), vine);
  barrier.position.set(9, SPROUT_LEVEL.obstacleHeight / 2 - 0.06, 0);
  group.add(barrier);
  barrier.visible = !cinder && !frost && !contact;
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), glow);
    leaf.scale.set(1, 0.3, 0.6);
    leaf.rotation.z = i % 2 ? 0.35 : -0.35;
    leaf.position.set(8.15 + i * 0.28, 0.6 + (i % 3) * 0.3, 0.76);
    if (!cinder && !frost && !contact) group.add(leaf);
  }
  // Fixed decorative seed groves behind the single traversable obstacle.
  for (const x of [3, 5, 12, 15, 21]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 8), vine);
    stem.position.set(x, 0.7, -2);
    if (!cinder && !frost && !contact) group.add(stem);
    const seed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), cinder ? soil : glow);
    seed.position.set(x, cinder ? 0.4 : 1.6, -2);
    if (cinder) seed.scale.set(0.8, 2, 0.8);
    if (!frost && !contact) group.add(seed);
  }
  function sign(text, x, y, width = 4) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#102b29';
    ctx.fillRect(0, 0, 768, 128);
    ctx.strokeStyle = '#a2f2bd';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 762, 122);
    ctx.fillStyle = '#edfff3';
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
  if (!cinder && !frost && !contact) sign('SPACE + MOVE', 9, 2.25, 2.2);
  const beacon = sign(level.npcLabel, level.targetX, 1.7, 2);
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
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.55, 8), green);
      limb.position.y = -0.25;
      arm.add(limb);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), green);
      palm.scale.set(0.85, 0.65, 0.75);
      palm.position.y = -0.55;
      arm.add(palm);
      for (let finger = -1; finger <= 1; finger++) {
        const digit = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.16, 6), green);
        digit.position.set(finger * 0.05, -0.65, 0);
        digit.rotation.z = finger * 0.32;
        arm.add(digit);
      }
      arm.rotation.z = side * -0.38;
      alien.add(arm);
    }
    return alien;
  }
  const alienCrowd = new THREE.Group();
  const friendlyAlien = createAlien();
  const gardenGate = new THREE.Group();
  let gardenSign = null;
  if (contact) {
    [2.6, 3.35, 4.1, 4.85, 5.6, 6.35, 7.1].forEach((x, index) => {
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
  const portal = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.025, 8, 40), glow);
  portal.rotation.x = Math.PI / 2;
  portal.position.set(0, 0.01, 0);
  group.add(portal);
  const npc = createAstronaut();
  npc.children[0].material = npc.children[0].material.clone();
  npc.children[0].material.color.setHex(cinder ? 0xffac55 : frost ? 0xbdefff : 0x83df9c);
  npc.scale.setScalar(0.85);
  npc.name = "surfaceRescueNpc";
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
          leftArm.rotation.z = 0.35 + Math.sin(time * 6.1 + phase) * 0.65;
          rightArm.rotation.z = -0.35 - Math.cos(time * 5.4 + phase) * 0.65;
          // The lead greeter mirrors jetpack height at the boundary so the
          // all-altitude crowd collision is visible rather than an unseen wall.
          alien.position.y = index === 0 ? Math.max(hop, run.player.y) : hop;
        });
        const friendlyTime = performance.now() * 0.001;
        friendlyAlien.rotation.z = Math.sin(friendlyTime * 3) * 0.055;
        friendlyAlien.getObjectByName('leftAlienArm').rotation.z = 0.42;
        friendlyAlien.getObjectByName('rightAlienArm').rotation.z = -2.2 + Math.sin(friendlyTime * 7) * 0.32;
      }
      vortexStart = null;
      npc.scale.setScalar(0.85);
      npc.rotation.set(0, 0, 0);
      npc.visible = !contact && run.state !== 'boarded';
      npc.position.set(run.npc.x, run.npc.y, 0.18);
      beacon.visible = run.state === 'visible';
      npc.rotation.y = run.state === 'following' ? -0.22 : 0.22;
    }
  };
}
