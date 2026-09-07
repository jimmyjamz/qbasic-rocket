import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import * as THREE from 'three';
import { createSurfaceAdventureView } from '../src/surfaceAdventureView.js';
import { createSurfaceRun, THEFT_LEVEL, SPROUT_LEVEL, surfaceAdventure } from '../src/surfaceAdventureState.js';
import { primeSneakleRunForStage, getDevTestStartRequest } from '../src/devTestStart.js';

test('surface view owns and updates the full Sneakle trade, including reset and independent views', () => {
  const dom = new JSDOM();
  const previousDocument = globalThis.document;
  globalThis.document = dom.window.document;
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, strokeRect() {}, fillText() {} });
  const astronaut = () => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
    return group;
  };
  const oldRun = surfaceAdventure.run;
  try {
    const originalAdd = THREE.Object3D.prototype.add;
    const view = createSurfaceAdventureView(astronaut, THEFT_LEVEL);
    const trade = view.group.getObjectByName('sneakleVisibleCheetosTradeOverlay');
    assert.equal(trade.parent, view.group);
    assert.equal(THREE.Object3D.prototype.add, originalAdd);
    const { backpack, alien, prize, backpackLabel, alienLabel, prizeLabel } = trade.userData;
    surfaceAdventure.run = createSurfaceRun(THEFT_LEVEL);
    const run = primeSneakleRunForStage('hatch');
    // Update before displaying the parent must still prepare the objects.
    view.update(run);
    view.group.visible = true;
    assert.equal(trade.visible, true);
    assert.equal(backpack.visible, true);
    assert.equal(alien.visible, true);
    assert.equal(prize.visible, false);
    assert.equal(backpackLabel.visible, false);
    assert.equal(backpack.position.x, THEFT_LEVEL.backpackX);
    assert.equal(alien.position.x, THEFT_LEVEL.tradeAlienX);

    for (const stage of ['backpack', 'cheetos', 'flux']) {
      assert.equal(getDevTestStartRequest(new URL(`http://localhost/?testStage=${stage}`)).stage, stage);
      assert.equal(getDevTestStartRequest(new URL(`https://example.com/?testStage=${stage}`)), null);
      surfaceAdventure.run = createSurfaceRun(THEFT_LEVEL);
      const staged = primeSneakleRunForStage(stage);
      assert.equal(staged.wobbleCoilInstalled, true);
      view.update(staged);
      assert.equal(backpack.visible, stage === 'backpack');
      assert.equal(backpackLabel.visible, stage === 'backpack');
      assert.equal(alien.visible, true);
      assert.equal(alienLabel.visible, stage !== 'flux');
      assert.equal(prize.visible, stage === 'flux');
      assert.equal(prizeLabel.visible, stage === 'flux');
      assert.equal(staged.hasCheetos, stage === 'cheetos');
      assert.equal(staged.fluxCapacitorCollected, stage === 'flux');
    }

    const fresh = createSurfaceRun(THEFT_LEVEL);
    view.update(fresh);
    for (const object of [backpack, alien, prize, backpackLabel, alienLabel, prizeLabel]) {
      assert.equal(object.visible, false);
    }
    fresh.startTheft();
    fresh.update(0.8, { x: 1, y: 0 });
    view.update(fresh);
    assert.equal(backpack.visible, false);
    fresh.update(1.2, { x: 1, y: 0 });
    view.update(fresh);
    assert.equal(backpack.visible, false, 'bag stays hidden while aliens board');
    fresh.update(1.05, { x: 1, y: 0 });
    view.update(fresh);
    assert.equal(backpack.visible, true, 'delayed toss has started');
    fresh.update(1.05, { x: 1, y: 0 });
    view.update(fresh);
    assert.equal(backpack.visible, true);
    const restingPosition = backpack.position.clone();
    const restingRotation = backpack.rotation.clone();
    const bounds = new THREE.Box3().setFromObject(backpack);
    assert.ok(bounds.getSize(new THREE.Vector3()).y < 0.9, 'bag is smaller than the astronaut');
    assert.ok(Math.abs(bounds.min.y) < 0.001, 'bag rests on the floor');
    fresh.update(0.2, { x: 1, y: 0 });
    view.update(fresh);
    assert.equal(fresh.state, 'stranded');
    assert.equal(backpack.visible, true);
    assert.deepEqual(backpack.position, restingPosition, 'no teleport at the end of theft');
    assert.ok(backpack.rotation.equals(restingRotation), 'no upright reset');
    const second = createSurfaceAdventureView(astronaut, THEFT_LEVEL);
    assert.notEqual(second.group.getObjectByName(trade.name), trade);
    assert.equal(createSurfaceAdventureView(astronaut, SPROUT_LEVEL).group.getObjectByName(trade.name), undefined);
  } finally {
    surfaceAdventure.run = oldRun;
    globalThis.document = previousDocument;
    dom.window.close();
  }
});
