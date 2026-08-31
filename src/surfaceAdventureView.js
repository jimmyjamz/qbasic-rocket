import * as THREE from 'three';
import { SPROUT_LEVEL } from './surfaceAdventureState.js';

export function createSurfaceAdventureView(createAstronaut, level = SPROUT_LEVEL) {
  const cinder = level.kind === 'steam';
  const group = new THREE.Group();
  group.name = cinder ? 'cinderSurfaceAdventure' : 'sproutSurfaceAdventure';
  group.visible = false;
  const soil = new THREE.MeshStandardMaterial({ color: cinder ? 0x914b32 : 0x265b44, roughness: 0.85 });
  const vine = new THREE.MeshStandardMaterial({ color: 0x64c779, roughness: 0.65 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xb4ffc3, emissive: 0x48aa65, emissiveIntensity: 0.3 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(level.maxX - level.minX + 2, 0.6, 4.8), soil);
  floor.position.set((level.maxX + level.minX) / 2, -0.36, -0.8);
  group.add(floor);

  const barrier = new THREE.Mesh(new THREE.BoxGeometry(2, SPROUT_LEVEL.obstacleHeight, 1.4), vine);
  barrier.position.set(9, SPROUT_LEVEL.obstacleHeight / 2 - 0.06, 0);
  group.add(barrier);
  barrier.visible = !cinder;
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), glow);
    leaf.scale.set(1, 0.3, 0.6);
    leaf.rotation.z = i % 2 ? 0.35 : -0.35;
    leaf.position.set(8.15 + i * 0.28, 0.6 + (i % 3) * 0.3, 0.76);
    if (!cinder) group.add(leaf);
  }
  // Fixed decorative seed groves behind the single traversable obstacle.
  for (const x of [3, 5, 12, 15, 21]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 8), vine);
    stem.position.set(x, 0.7, -2);
    if (!cinder) group.add(stem);
    const seed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), cinder ? soil : glow);
    seed.position.set(x, cinder ? 0.4 : 1.6, -2);
    if (cinder) seed.scale.set(0.8, 2, 0.8);
    group.add(seed);
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
  if (!cinder) sign('SPACE + MOVE', 9, 2.25, 2.2);
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
  const portal = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.025, 8, 40), glow);
  portal.rotation.x = Math.PI / 2;
  portal.position.set(0, 0.01, 0);
  group.add(portal);
  const npc = createAstronaut();
  npc.children[0].material = npc.children[0].material.clone();
  npc.children[0].material.color.setHex(cinder ? 0xffac55 : 0x83df9c);
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
      vortexStart = null;
      npc.scale.setScalar(0.85);
      npc.rotation.set(0, 0, 0);
      npc.visible = run.state !== 'boarded';
      npc.position.set(run.npc.x, run.npc.y, 0.18);
      beacon.visible = run.state === 'visible';
      npc.rotation.y = run.state === 'following' ? -0.22 : 0.22;
    }
  };
}
