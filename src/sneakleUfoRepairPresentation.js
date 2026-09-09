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

export function isSneakleUfoSmokePart(part) {
  return part?.userData?.smokePhase !== undefined ||
    (part?.material?.transparent === true && part?.material?.color?.equals?.(SMOKEY));
}

export function isSneakleBrokenPanelPart(part) {
  return part?.isMesh &&
    part?.geometry?.type === 'BoxGeometry' &&
    part?.material?.color?.equals?.(DARK_CRACK);
}

function isSneakleUfoReady() {
  const run = surfaceAdventure.run;
  return run?.level?.kind === 'theft' && run.state === 'stranded' &&
    (run.ufoLaunchReady || document?.body?.dataset?.rocketTheftObjective === 'UFO READY');
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

export function ensureSneakleUfoReadyLights(ufoGroup) {
  let lights = ufoGroup.getObjectByName('sneakleUfoReadyLights');
  if (lights) return lights;

  lights = new THREE.Group();
  lights.name = 'sneakleUfoReadyLights';
  [-0.95, -0.48, 0, 0.48, 0.95].forEach((x, index) => {
    const light = createReadyLight(index);
    light.position.set(x, 0.92, 0.62);
    lights.add(light);
  });
  lights.visible = false;
  ufoGroup.add(lights);
  return lights;
}

function findUfoGroup(scene) {
  let ufoGroup = null;
  scene?.traverse?.((object) => {
    if (ufoGroup) return;
    const hasSmokeChild = object?.children?.some?.((child) => child?.userData?.smokePhase !== undefined);
    const hasSparkChild = object?.children?.some?.((child) => child?.userData?.sparkPhase !== undefined);
    if (hasSmokeChild && hasSparkChild) ufoGroup = object;
  });
  return ufoGroup;
}

export function updateSneakleUfoRepairVisuals(scene, now = performance.now()) {
  const shouldRepair = isSneakleUfoReady();
  let foundUfoPart = false;

  scene?.traverse?.((part) => {
    if (!part?.isMesh) return;
    const isSmoke = isSneakleUfoSmokePart(part);
    const isBrokenPanel = isSneakleBrokenPanelPart(part);
    const isSpark = part.userData?.sparkPhase !== undefined;
    const isLikelyHull = part.geometry?.type === 'CylinderGeometry' && part.position?.y > 0.55;

    if (!isSmoke && !isBrokenPanel && !isSpark && !isLikelyHull) return;
    foundUfoPart = true;
    rememberOriginal(part);

    if (!shouldRepair) {
      restoreOriginal(part);
      return;
    }

    if (isSmoke) {
      part.visible = false;
      return;
    }

    if (isSpark) {
      part.visible = true;
      part.material.color.copy(READY_GLOW);
      part.scale.setScalar(1.45 + Math.sin(now * 0.008 + part.userData.sparkPhase) * 0.18);
      return;
    }

    if (isBrokenPanel) {
      part.visible = true;
      part.material.color.copy(REPAIRED_PANEL);
      part.scale.set(0.9, 1.8, 1.8);
      return;
    }

    if (isLikelyHull && part.material?.color) {
      part.material.color.copy(READY_HULL);
      if (part.material?.emissive) {
        part.material.emissive.copy(READY_GLOW);
        part.material.emissiveIntensity = Math.max(part.material.emissiveIntensity ?? 0, 0.2);
      }
    }
  });

  const ufoGroup = findUfoGroup(scene);
  if (!ufoGroup) return;

  const lights = ensureSneakleUfoReadyLights(ufoGroup);
  lights.visible = shouldRepair && foundUfoPart;
  if (shouldRepair) {
    lights.children.forEach((light, index) => {
      light.scale.setScalar(1.0 + Math.sin(now * 0.007 + index) * 0.22);
    });
  }
}

const originalRender = THREE.WebGLRenderer?.prototype?.render;
if (originalRender && !patched) {
  patched = true;
  THREE.WebGLRenderer.prototype.render = function renderWithSneakleRepairPayoff(scene, camera) {
    updateSneakleUfoRepairVisuals(scene, performance.now());
    return originalRender.call(this, scene, camera);
  };
}