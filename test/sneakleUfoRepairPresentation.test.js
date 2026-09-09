import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  ensureSneakleUfoReadyLights,
  isSneakleBrokenPanelPart,
  isSneakleUfoSmokePart
} from '../src/sneakleUfoRepairPresentation.js';

test('Sneakle UFO repair presentation identifies smoke and broken-panel parts', () => {
  const smoke = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x6b6383, transparent: true, opacity: 0.34 })
  );
  smoke.userData.smokePhase = 1;
  assert.equal(isSneakleUfoSmokePart(smoke), true);

  const brokenPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x14091f })
  );
  assert.equal(isSneakleBrokenPanelPart(brokenPanel), true);

  const hull = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0xd7d5ff })
  );
  assert.equal(isSneakleUfoSmokePart(hull), false);
  assert.equal(isSneakleBrokenPanelPart(hull), false);
});

test('Sneakle UFO repair presentation adds reusable ready lights to the UFO group', () => {
  const ufo = new THREE.Group();
  const lights = ensureSneakleUfoReadyLights(ufo);
  assert.equal(lights.name, 'sneakleUfoReadyLights');
  assert.equal(lights.visible, false);
  assert.equal(lights.children.length, 5);
  assert.equal(ufo.getObjectByName('sneakleUfoReadyLights'), lights);
  assert.equal(ensureSneakleUfoReadyLights(ufo), lights);
});
