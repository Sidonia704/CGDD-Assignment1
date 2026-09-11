// Convert the student's FBX originals into indexed, shared browser meshes.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
};
// The supplied drone references Image_* files that were not supplied. Replace
// these with local PBR materials; never request the missing texture filenames.
THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const originalWarn = console.warn;
console.warn = (...args) => { if (!String(args[0]).includes('ShininessExponent')) originalWarn(...args); };
const output = new URL('../public/assets/models/', import.meta.url);
await mkdir(output, { recursive: true });
let buildingIndex = 0;
const manifest = [];

async function exportModel(root, name, drone = false) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  root.traverse(node => {
    if (!node.isMesh) return;
    const source = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    source.applyMatrix4(node.matrixWorld);
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const groups = source.groups.length ? source.groups : [{ start: 0, count: source.attributes.position.count, materialIndex: 0 }];
    for (const group of groups) {
      const old = materials[group.materialIndex] || materials[0];
      const color = drone
        ? new THREE.Color(/prop_[1-4]/.test(node.name) ? 0x36bbae : /upper_body|top_board/.test(node.name) ? 0x789093 : /screw/.test(node.name) ? 0x82929c : 0x26323c)
        : old.color.clone().lerp(new THREE.Color(name.startsWith('building') ? 0x809398 : 0x747d61), .32);
      const key = color.getHexString();
      if (!buckets.has(key)) buckets.set(key, { color, geometries: [] });
      const geometry = new THREE.BufferGeometry();
      for (const attr of ['position', 'normal']) {
        if (source.attributes[attr]) geometry.setAttribute(attr, new THREE.Float32BufferAttribute(source.attributes[attr].array.slice(group.start * 3, (group.start + group.count) * 3), 3));
      }
      buckets.get(key).geometries.push(geometry);
    }
    source.dispose();
  });
  const model = new THREE.Group();
  for (const { color, geometries } of buckets.values()) {
    const merged = mergeGeometries(geometries);
    const geometry = mergeVertices(merged, .0001);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .68, metalness: name.startsWith('building') ? .05 : .32 }));
    model.add(mesh);
    geometries.forEach(g => g.dispose()); merged.dispose();
  }
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 1 / Math.max(size.x, size.y, size.z);
  for (const mesh of model.children) {
    mesh.geometry.translate(-center.x, -box.min.y, -center.z);
    mesh.geometry.scale(scale, scale, scale);
  }
  const data = await new GLTFExporter().parseAsync(model, { binary: true });
  await writeFile(new URL(`${name}.glb`, output), Buffer.from(data));
  manifest.push({ name, bytes: data.byteLength, size: size.multiplyScalar(scale).toArray(), meshes: model.children.length });
}

for (const name of ['drone', 'tank', 'anti-aircraft', 'missile', 'buildingset1', 'buildingset2', 'buildingset3', 'buildingset4']) {
  const bytes = await readFile(new URL(`../../models/${name}.fbx`, import.meta.url));
  const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  if (name.startsWith('building')) {
    root.updateMatrixWorld(true);
    const meshes = []; root.traverse(n => { if (n.isMesh) meshes.push(n); });
    for (const mesh of meshes) {
      const standalone = mesh.clone(); standalone.matrix.copy(mesh.matrixWorld); standalone.matrixAutoUpdate = false;
      await exportModel(standalone, `building-${buildingIndex++}`);
    }
  } else await exportModel(root, name, name === 'drone');
}
await writeFile(new URL('manifest.json', output), JSON.stringify(manifest, null, 2));
console.log(`Prepared ${manifest.length} models (${(manifest.reduce((n, m) => n + m.bytes, 0) / 1048576).toFixed(1)} MB); original FBX files preserved.`);
