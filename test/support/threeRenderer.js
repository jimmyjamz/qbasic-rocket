// Keep real Three.js geometry/transforms; only the GPU renderer is replaced in Node.
export * from '../../node_modules/three/build/three.module.js';
export let renderedScene;
export let renderedCamera;
export class WebGLRenderer {
  setPixelRatio() {}
  setSize() {}
  render(scene, camera) {
    renderedScene = scene;
    renderedCamera = camera;
    scene.updateMatrixWorld();
  }
}
