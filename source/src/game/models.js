import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const templates = new Map();
export async function loadModels(onProgress) {
  const loader = new GLTFLoader();
  const names = ['drone', 'tank', 'anti-aircraft', 'missile', ...Array.from({ length: 11 }, (_, i) => `building-${i}`)];
  let loaded = 0;
  await Promise.all(names.map(async name => {
    const gltf = await loader.loadAsync(`./assets/models/${name}.glb`);
    gltf.scene.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true; node.receiveShadow = true; node.userData.sharedAsset = true;
        if (name.startsWith('building')) addFacade(node.material);
      }
    });
    templates.set(name, gltf.scene);
    onProgress(++loaded / names.length);
  }));
}

// World-space facade details fit all eleven source meshes without missing UVs.
function addFacade(material) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vFacadePosition; varying vec3 vFacadeNormal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFacadePosition=(modelMatrix*vec4(transformed,1.)).xyz; vFacadeNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader = 'varying vec3 vFacadePosition; varying vec3 vFacadeNormal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float wall=1.-step(.55,abs(vFacadeNormal.y));
      float horizontal=abs(vFacadeNormal.x)>.5?vFacadePosition.z:vFacadePosition.x;
      vec2 cell=vec2(horizontal/3.1,vFacadePosition.y/3.6);
      vec2 uv=fract(cell);
      float windowMask=step(.17,uv.x)*step(uv.x,.77)*step(.25,uv.y)*step(uv.y,.76)*wall*step(2.,vFacadePosition.y);
      float lit=step(.81,fract(sin(dot(floor(cell),vec2(12.9898,78.233)))*43758.5453));
      diffuseColor.rgb=mix(diffuseColor.rgb, mix(vec3(.075,.13,.16),vec3(.5,.38,.2),lit),windowMask*.84);
      diffuseColor.rgb*=1.-wall*.13*step(.94,uv.y);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.26,.15,.055)*lit*windowMask;');
  };
  material.customProgramCacheKey = () => 'last-dash-facade-v1';
}

export function modelInstance(name, dimensions, centered = false) {
  const model = templates.get(name).clone(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  if (Array.isArray(dimensions)) model.scale.set(dimensions[0] / size.x, dimensions[1] / size.y, dimensions[2] / size.z);
  else model.scale.setScalar(dimensions / Math.max(size.x, size.y, size.z));
  if (centered) model.position.y = -size.y * model.scale.y / 2;
  return model;
}
