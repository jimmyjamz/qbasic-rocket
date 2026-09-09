// RKT-75 visual-only repair payoff for Sneakle's existing UFO mesh.
// State remains in surfaceAdventureState; this file only makes the saucer itself
// read as repaired once the Flux Capacitor has been installed.
import * as THREE from 'three';
import { surfaceAdventure } from './surfaceAdventureState.js';

const READY_GLOW = new THREE.Color(0x7df5ff);
const READY_HULL = new THREE.Color(0xf6f4ff);
const REPAIRED_PANEL = new THREE.Color(0x8affb3);
const DARK_CRACK = new THREE.Color(0x14091f);
const SMOKEY = new THREE.Color(0x6b6383);
let patched = false;

function isLikelySmoke(part) {
  return part?.userData?.smokePhase !== undefined ||
    (part?.material?.transparent === true && part?.material?.color?.equals?.(SMOKEY));
}

function isLikelyBrokenPanel(part) {
  return part?.isMesh && part?.material?.color?.equals?.(DARK_CRACK);
}

function rememberOriginal(part) {
  if (!part || part.userData.rkt75Original) return;
  part.userData.rkt75Original = {
    visible: part.visible,
    opacity: part.material?.opacity,
    color: part.material?.color?.clone?.(),
    emissive: part.material?.emissive?.clone?.(),
    emissiveIntensity: part.material?.emissiveIntensity,
    scale: part.scale.clone()
  };
}

function restoreOriginal(part) {
  const original = part?.userData?.rkt75Original;
  if (!original) return;
  part.visible = original.visible;
  if (part.material?.opacity !== undefined && original.opacity !== undefined) part.material.opacity = original.opacity;
  if (part.material?.color && original.color) part.material.color.copy(original.color);
  if (part.material?.emissive && original.emissive) part.material.emissive.copy(original.emissive);
  if (part.material?.emissiveIntensity !== undefined && original.emissiveIntensity !== undefined) {
    part.material.emissiveIntensity = original.emissiveIntensity;
  }
  part.scale.copy(original.scale);
}

function createReadyLight(index) {
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x7df5ff, depthTest: false })
  );
  light.name = `sneakleUfoReadyLight${index + 1}`;
  light.renderOrder = 260;
  return light;
}

function ensureReadyLights(ufoGroup) {
  let lights = ufoGroup.getObjectByName('sneakleUfoReadyLights');
  if (lights) return lights;

  lights = new THREE.Group();
  lights.name = 'sneakleUfoReadyLights';
  [-0.8, -0.4, 0, 0.4, 0.8].forEach((x, index) => {
    const light = createReadyLight(index);
    light.position.set(x, 0.92, 0.62);
    lights.add(light);
  });
  lights.visible = false;
  ufoGroup.add(lights);
  return lights;
}

function updateExistingUfoMesh(scene, now) {
  const run = surfaceAdventure.run;
  const shouldRepair = run?.level?.kind === 'theft' && run.state === 'stranded' && run.ufoLaunchReady;
  const theftView = scene.getObjectByName?.('theftSurfaceAdventure');
  if (!theftView) return;

  theftView.traverse((part) => {
    if (!part?.isMesh) return;
    rememberOriginal(part);

    if (!shouldRepair) {
      restoreOriginal(part);
      return;
    }

    if (isLikelySmoke(part)) {
      part.visible = false;
      return;
    }

    if (part.userData?.sparkPhase !== undefined) {
      part.visible = true;
      part.material.color.copy(READY_GLOW);
      part.scale.setScalar(1.45 + Math.sin(now * 0.008 + part.userData.sparkPhase) * 0.18);
      return;
    }

    if (isLikelyBrokenPanel(part)) {
      part.visible = true;
      part.material.color.copy(REPAIRED_PANEL);
      part.scale.set(0.9, 1.8, 1.8);
      return;
    }

    if (part.geometry?.type === 'CylinderGeometry' && part.position?.y > 0.55) {
      part.material.color.lerp(READY_HULL, 0.35);
    }

    if (part.material?.emissive) {
      part.material.emissive.copy(READY_GLOW);
      part.material.emissiveIntensity = Math.max(part.material.emissiveIntensity ?? 0, 0.18);
    }
  });

  const brokenUfoShell = theftView.children.find((child) => child?.children?.some?.((grandchild) =>
    grandchild?.children?.some?.((part) => part?.userData?.smokePhase !== undefined)
  ));
  const ufoGroup = brokenUfoShell?.children?.[0];
  if (!ufoGroup) return;

  const lights = ensureReadyLights(ufoGroup);
  lights.visible = shouldRepair;
  if (shouldRepair) {
    lights.children.forEach((light, index) => {
      light.scale.setScalar(1.0 + Math.sin(now * 0.007 + index) * 0.22);
    });
  }
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!patched) {
  patched = true;
  THREE.WebGLRenderer.prototype.render = function renderWithSneakleRepairPayoff(scene, camera) {
    updateExistingUfoMesh(scene, performance.now());
    return originalRender.call(this, scene, camera);
  };
}
