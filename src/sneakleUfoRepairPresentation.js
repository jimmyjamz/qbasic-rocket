// RKT-75 visual-only repair payoff for Sneakle's existing UFO mesh.
// State remains in surfaceAdventureState; this file only makes the already-created
// saucer read as repaired once the Flux Capacitor has been installed.
import * as THREE from 'three';
import { surfaceAdventure } from './surfaceAdventureState.js';

const READY_GLOW = new THREE.Color(0x7df5ff);
const READY_HULL = new THREE.Color(0xf6f4ff);
const REPAIRED_PANEL = new THREE.Color(0x8affb3);
const DARK_CRACK = new THREE.Color(0x14091f);
const SMOKEY = new THREE.Color(0x6b6383);
const UNDERSIDE = new THREE.Color(0x44306f);

const tracked = {
  smoke: new Set(),
  cracks: new Set(),
  loosePanels: new Set(),
  sparks: new Set(),
  hulls: new Set(),
  ufoGroups: new Set(),
  ufoShells: new Set(),
  tradePrizes: new Set()
};

let renderPatched = false;
let addPatched = false;

export function isSneakleUfoSmokePart(part) {
  return part?.userData?.smokePhase !== undefined ||
    (part?.material?.transparent === true && part?.material?.color?.equals?.(SMOKEY));
}

export function isSneakleBrokenPanelPart(part) {
  return part?.isMesh &&
    part?.geometry?.type === 'BoxGeometry' &&
    part?.material?.color?.equals?.(DARK_CRACK);
}

export function isSneakleLoosePanelPart(part) {
  return part?.isMesh &&
    part?.geometry?.type === 'BoxGeometry' &&
    part?.material?.color?.equals?.(UNDERSIDE) &&
    Math.abs(part.position?.x ?? 0) > 0.75;
}

function isSneakleUfoReady() {
  const run = surfaceAdventure.run;
  return run?.level?.kind === 'theft' && run.state === 'stranded' &&
    (run.ufoLaunchReady || globalThis.document?.body?.dataset?.rocketTheftObjective === 'UFO READY');
}

function rememberOriginal(part) {
  if (!part || part.userData.rkt75Original) return;
  part.userData.rkt75Original = {
    visible: part.visible,
    opacity: part.material?.opacity,
    color: part.material?.color?.clone?.(),
    emissive: part.material?.emissive?.clone?.(),
    emissiveIntensity: part.material?.emissiveIntensity,
    rotation: part.rotation?.clone?.(),
    scale: part.scale?.clone?.()
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
  if (part.rotation && original.rotation) part.rotation.copy(original.rotation);
  if (part.scale && original.scale) part.scale.copy(original.scale);
}

function createReadyLight(index) {
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x7df5ff, depthTest: false })
  );
  light.name = `sneakleUfoReadyLight${index + 1}`;
  light.renderOrder = 300;
  return light;
}

export function ensureSneakleUfoReadyLights(ufoGroup) {
  let lights = ufoGroup?.getObjectByName?.('sneakleUfoReadyLights');
  if (lights) return lights;

  lights = new THREE.Group();
  lights.name = 'sneakleUfoReadyLights';
  [-1.05, -0.52, 0, 0.52, 1.05].forEach((x, index) => {
    const light = createReadyLight(index);
    light.position.set(x, 0.93, 0.66);
    lights.add(light);
  });
  lights.visible = false;
  ufoGroup.add(lights);
  return lights;
}

function createReadyPatch() {
  const patch = new THREE.Group();
  patch.name = 'sneakleUfoReadyPatch';
  patch.visible = false;

  const panelMaterial = new THREE.MeshBasicMaterial({ color: 0x8affb3, depthTest: false });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x7df5ff, depthTest: false, transparent: true, opacity: 0.82 });

  const repairedPanel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.1), panelMaterial);
  repairedPanel.name = 'sneakleUfoRepairedPanel';
  repairedPanel.position.set(-0.45, 0.95, 0.72);
  repairedPanel.renderOrder = 305;

  const readyCore = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 28), glowMaterial);
  readyCore.name = 'sneakleUfoReadyCore';
  readyCore.position.set(0.45, 0.94, 0.73);
  readyCore.rotation.x = Math.PI / 2;
  readyCore.renderOrder = 306;

  patch.add(repairedPanel, readyCore);
  return patch;
}

function ensureReadyPatch(ufoGroup) {
  let patch = ufoGroup?.getObjectByName?.('sneakleUfoReadyPatch');
  if (patch) return patch;
  patch = createReadyPatch();
  ufoGroup.add(patch);
  return patch;
}

function trackPart(part, parent) {
  if (!part) return;

  if (part.name === 'sneakleVisibleTradePrize') tracked.tradePrizes.add(part);

  if (part.isMesh) {
    if (isSneakleUfoSmokePart(part)) {
      tracked.smoke.add(part);
      if (parent) tracked.ufoGroups.add(parent);
    }
    if (part.userData?.sparkPhase !== undefined) {
      tracked.sparks.add(part);
      if (parent) tracked.ufoGroups.add(parent);
    }
    if (isSneakleBrokenPanelPart(part)) tracked.cracks.add(part);
    if (isSneakleLoosePanelPart(part)) tracked.loosePanels.add(part);
    if (part.geometry?.type === 'CylinderGeometry' && part.position?.y > 0.55) tracked.hulls.add(part);
  }

  const hasUfoChildren = part.children?.some?.((child) => child.userData?.smokePhase !== undefined || child.userData?.sparkPhase !== undefined);
  if (hasUfoChildren) {
    tracked.ufoGroups.add(part);
    if (parent) tracked.ufoShells.add(parent);
  }

  part.children?.forEach?.((child) => trackPart(child, part));
}

function patchObjectAdds() {
  if (addPatched) return;
  const originalAdd = THREE.Object3D.prototype.add;
  addPatched = true;
  THREE.Object3D.prototype.add = function addWithSneakleRepairTracking(...objects) {
    const result = originalAdd.apply(this, objects);
    objects.forEach((object) => trackPart(object, this));
    return result;
  };
}

function applyRepair(now = performance.now()) {
  const shouldRepair = isSneakleUfoReady();

  tracked.ufoShells.forEach((shell) => {
    rememberOriginal(shell);
    if (shouldRepair) {
      shell.rotation.z = 0;
      shell.position.y = Math.max(shell.position.y, 0.03);
    } else {
      restoreOriginal(shell);
    }
  });

  tracked.ufoGroups.forEach((ufoGroup) => {
    rememberOriginal(ufoGroup);
    const lights = ensureSneakleUfoReadyLights(ufoGroup);
    const patch = ensureReadyPatch(ufoGroup);
    if (shouldRepair) {
      ufoGroup.rotation.z = 0;
      lights.visible = true;
      patch.visible = true;
      patch.children.forEach((child, index) => {
        child.scale.setScalar(1 + Math.sin(now * 0.008 + index) * 0.04);
      });
      lights.children.forEach((light, index) => {
        light.scale.setScalar(1.05 + Math.sin(now * 0.009 + index) * 0.22);
      });
    } else {
      lights.visible = false;
      patch.visible = false;
      restoreOriginal(ufoGroup);
    }
  });

  tracked.smoke.forEach((part) => {
    rememberOriginal(part);
    if (shouldRepair) part.visible = false;
    else restoreOriginal(part);
  });

  tracked.cracks.forEach((part) => {
    rememberOriginal(part);
    if (shouldRepair) {
      part.visible = true;
      part.material.color.copy(REPAIRED_PANEL);
      part.rotation.z = 0;
      part.scale.set(1.25, 1.8, 1.8);
    } else restoreOriginal(part);
  });

  tracked.loosePanels.forEach((part) => {
    rememberOriginal(part);
    if (shouldRepair) part.visible = false;
    else restoreOriginal(part);
  });

  tracked.sparks.forEach((part) => {
    rememberOriginal(part);
    if (shouldRepair) {
      part.visible = true;
      part.material.color.copy(READY_GLOW);
      part.scale.setScalar(1.45 + Math.sin(now * 0.008 + part.userData.sparkPhase) * 0.18);
    } else restoreOriginal(part);
  });

  tracked.hulls.forEach((part) => {
    rememberOriginal(part);
    if (shouldRepair) {
      part.material.color.copy(READY_HULL);
      if (part.material?.emissive) {
        part.material.emissive.copy(READY_GLOW);
        part.material.emissiveIntensity = Math.max(part.material.emissiveIntensity ?? 0, 0.2);
      }
    } else restoreOriginal(part);
  });

  tracked.tradePrizes.forEach((part) => {
    rememberOriginal(part);
    if (shouldRepair) part.visible = false;
    else restoreOriginal(part);
  });
}

export function updateSneakleUfoRepairVisuals(scene, now = performance.now()) {
  // Keep the old scene argument for tests, but prefer tracked object references from
  // the actual Three.js add path. This avoids guessing by scene name or tree shape.
  scene?.traverse?.((object) => trackPart(object, object.parent));
  applyRepair(now);
}

function patchRenderer() {
  if (renderPatched) return;
  const originalRender = THREE.WebGLRenderer?.prototype?.render;
  if (!originalRender) return;
  renderPatched = true;
  THREE.WebGLRenderer.prototype.render = function renderWithSneakleRepairPayoff(scene, camera) {
    updateSneakleUfoRepairVisuals(scene, performance.now());
    return originalRender.call(this, scene, camera);
  };
}

patchObjectAdds();
patchRenderer();
