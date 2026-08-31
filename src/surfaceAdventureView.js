import * as THREE from 'three';
import { SPROUT_LEVEL } from './surfaceAdventureState.js';

export function createSurfaceAdventureView(createAstronaut) {
  const group = new THREE.Group();
  group.name = 'sproutSurfaceAdventure';
  group.visible = false;
  const soil = new THREE.MeshStandardMaterial({ color: 0x265b44, roughness: 0.85 });
  const vine = new THREE.MeshStandardMaterial({ color: 0x64c779, roughness: 0.65 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xb4ffc3, emissive: 0x48aa65, emissiveIntensity: 0.3 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 4.8), soil);
  floor.position.set(10, -0.36, -0.8);
  group.add(floor);

  const barrier = new THREE.Mesh(new THREE.BoxGeometry(2, SPROUT_LEVEL.obstacleHeight, 1.4), vine);
  barrier.position.set(9, SPROUT_LEVEL.obstacleHeight / 2 - 0.06, 0);
  group.add(barrier);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), glow);
    leaf.scale.set(1, 0.3, 0.6);
    leaf.rotation.z = i % 2 ? 0.35 : -0.35;
    leaf.position.set(8.15 + i * 0.28, 0.6 + (i % 3) * 0.3, 0.76);
    group.add(leaf);
  }
  // Fixed decorative seed groves behind the single traversable obstacle.
  for (const x of [3, 5, 12, 15, 21]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6, 8), vine);
    stem.position.set(x, 0.7, -2);
    group.add(stem);
    const seed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), glow);
    seed.position.set(x, 1.6, -2);
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
  sign('ROCKET RETURN · E', 0, 3.6);
  sign('VINES · HOLD SPACE + MOVE', 9, 2.6, 5);
  const beacon = sign('BOTANIST · SOS', 19, 2.2, 3.5);
  const portal = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 40), glow);
  portal.position.set(0, 0.82, 0.45);
  group.add(portal);
  const npc = createAstronaut();
  npc.children[0].material = npc.children[0].material.clone();
  npc.children[0].material.color.setHex(0x83df9c);
  npc.scale.setScalar(0.85);
  group.add(npc);
  return {
    group,
    update(run) {
      npc.visible = run.state !== 'boarded';
      npc.position.set(run.npc.x, run.npc.y, 0.18);
      beacon.visible = run.state === 'visible';
      npc.rotation.y = run.state === 'following' ? -0.22 : 0.22;
    }
  };
}
