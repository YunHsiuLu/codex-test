import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { magnitude, cameraFingerprint } from './model.js';

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1220');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  camera.position.set(11, 9, 13);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('aria-label', '三維向量場景，拖曳旋轉，雙指或滾輪縮放');
  container.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1, 0);
  controls.minDistance = 0.5;
  controls.maxDistance = 700;
  const grid = new THREE.GridHelper(20, 20, '#46566f', '#263348');
  scene.add(grid);
  scene.add(new THREE.AxesHelper(8));
  const objects = new THREE.Group();
  scene.add(objects);
  function labelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.font = '32px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = color; ctx.fillText(text, 256, 50, 500);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.scale.set(4.8, .75, 1);
    return sprite;
  }
  for (const [axis, position, color] of [['X', [8.5, 0, 0], '#ff7f91'], ['Y', [0, 8.5, 0], '#7beaac'], ['Z', [0, 0, 8.5], '#87b7ff']]) {
    const sprite = labelSprite(axis, color); sprite.position.set(...position); scene.add(sprite);
  }
  function clear() {
    const geometries = new Set(), materials = new Set();
    objects.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => { m.map?.dispose(); m.dispose(); });
    objects.clear();
  }
  function update(vectors) {
    clear();
    for (const vector of Object.values(vectors)) {
      const origin = new THREE.Vector3(...['x', 'y', 'z'].map(k => vector.origin[k]));
      const direction = new THREE.Vector3(...['x', 'y', 'z'].map(k => vector.components[k]));
      const length = magnitude(vector);
      if (length > 1e-8) {
        const head = Math.min(.55, length * .25);
        const arrow = new THREE.ArrowHelper(direction.clone().normalize(), origin, length, vector.color, head, head * .48);
        // ArrowHelper shares geometry globally; own clones can be safely disposed on updates.
        arrow.line.geometry = arrow.line.geometry.clone();
        arrow.cone.geometry = arrow.cone.geometry.clone();
        objects.add(arrow);
      }
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.085, 12, 8), new THREE.MeshBasicMaterial({ color: vector.color }));
      dot.position.copy(origin); objects.add(dot);
      const label = labelSprite(vector.label + (length === 0 ? '（零向量）' : ''), vector.color);
      label.position.copy(origin).add(direction).add(new THREE.Vector3(0, .45, 0));
      objects.add(label);
    }
    container.dataset.vectorCount = String(Object.keys(vectors).length);
  }
  const observer = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  observer.observe(container);
  renderer.setAnimationLoop(() => {
    controls.update(); renderer.render(scene, camera);
    // Local-only diagnostic for testing camera independence; never passed to the store.
    container.dataset.camera = JSON.stringify(cameraFingerprint(camera, controls));
  });
  return { update, reset: () => { camera.position.set(11, 9, 13); controls.target.set(0, 1, 0); controls.update(); } };
}
