import * as THREE from 'three';

const random = (a, b) => a + Math.random() * (b - a);
const warm = new THREE.Color(0xffb13b);
const smoke = new THREE.Color(0x697077);

export class FlightEffects {
  constructor(scene) {
    this.scene = scene;
    this.capacity = 2400;
    this.cursor = 0;
    this.particles = Array.from({ length: this.capacity }, () => ({ life: 0, maxLife: 1, position: new THREE.Vector3(), velocity: new THREE.Vector3(), size: 1, smoke: false, gravity: 0, color: new THREE.Color() }));
    this.positions = new Float32Array(this.capacity * 3);
    this.colors = new Float32Array(this.capacity * 3);
    this.sizes = new Float32Array(this.capacity);
    this.alphas = new Float32Array(this.capacity);
    const geometry = new THREE.BufferGeometry();
    for (const [key, array, count] of [['position', this.positions, 3], ['color', this.colors, 3], ['size', this.sizes, 1], ['alpha', this.alphas, 1]]) geometry.setAttribute(key, new THREE.BufferAttribute(array, count).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, vertexColors: true,
      uniforms: { viewportScale: { value: 650 } },
      vertexShader: `attribute float size; attribute float alpha; varying vec3 vColor; varying float vAlpha; uniform float viewportScale;
        void main(){ vColor=color; vAlpha=alpha; vec4 p=modelViewMatrix*vec4(position,1.); gl_PointSize=clamp(size*viewportScale/max(1.,-p.z),1.,160.); gl_Position=projectionMatrix*p; }`,
      fragmentShader: `varying vec3 vColor; varying float vAlpha;
        void main(){ float d=length(gl_PointCoord-.5)*2.; if(d>1.||vAlpha<=0.) discard; float a=pow(1.-d,1.7)*vAlpha; gl_FragColor=vec4(vColor,a); #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    // Shader preprocessor directives must begin their own lines.
    material.fragmentShader = material.fragmentShader.replace('; #include', ';\n#include');
    this.points = new THREE.Points(geometry, material); this.points.frustumCulled = false; scene.add(this.points);
    this.debris = []; this.rings = []; this.flashes = [];
    this.chunkGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.chunkMaterial = new THREE.MeshStandardMaterial({ color: 0x344044, metalness: .65, roughness: .55 });
    this.ambientTime = 0;
  }

  emit(position, velocity, { life = 1, size = 1, color = warm, smoke: isSmoke = false, gravity = 0 } = {}) {
    const p = this.particles[this.cursor++ % this.capacity];
    p.position.copy(position); p.velocity.copy(velocity); p.life = p.maxLife = life;
    p.size = size; p.color.copy(color); p.smoke = isSmoke; p.gravity = gravity;
  }

  trail(position, direction, missile = false) {
    this.emit(position, direction.clone().multiplyScalar(-2), { life: missile ? .35 : .12, size: missile ? 1.5 : .45, color: warm });
    if (missile) this.emit(position, new THREE.Vector3(random(-.7, .7), 1, random(-.7, .7)), { life: 2.5, size: 2, color: smoke, smoke: true });
  }

  muzzle(position) {
    for (let i = 0; i < 12; i++) this.emit(position, new THREE.Vector3(random(-3, 3), random(1, 5), random(-3, 3)), { life: .2, size: 1.6 });
    this.flash(position, 28, .12);
  }

  flash(position, intensity, life) {
    if (this.flashes.length >= 16) { const oldest = this.flashes.shift(); this.scene.remove(oldest.light); oldest.light.dispose(); }
    const light = new THREE.PointLight(0xffa13d, intensity, 45); light.position.copy(position); this.scene.add(light);
    this.flashes.push({ light, life, maxLife: life, intensity });
  }

  explode(position, scale = 1, object = null, inheritedVelocity = new THREE.Vector3()) {
    for (let i = 0; i < 210 * scale; i++) {
      const direction = new THREE.Vector3(random(-1, 1), random(-.35, 1), random(-1, 1)).normalize();
      const isSmoke = i % 3 === 0;
      this.emit(position.clone().addScaledVector(direction, random(0, 1.8) * scale), direction.multiplyScalar(random(3, isSmoke ? 10 : 28) * scale), {
        life: isSmoke ? random(2.5, 5.5) : random(.4, 1.6), size: isSmoke ? random(2.5, 5) * scale : random(.2, 1.1),
        color: isSmoke ? smoke : new THREE.Color().setHSL(random(.035, .13), 1, random(.5, .8)), smoke: isSmoke, gravity: isSmoke ? -1 : 15
      });
    }
    this.flash(position, 160 * scale, .65);
    // Cannon hits need sparks, not dozens of rigid fragments per round.
    if (scale < .3) return;
    const ring = new THREE.Mesh(new THREE.RingGeometry(.85, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffca79, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.copy(position); this.scene.add(ring); this.rings.push({ mesh: ring, life: .8, scale });
    if (object) {
      object.updateWorldMatrix(true, true);
      let count = 0;
      object.traverse(node => {
        if (!node.isMesh || !node.userData.sharedAsset || count++ > 10) return;
        const piece = new THREE.Mesh(node.geometry, node.material);
        node.matrixWorld.decompose(piece.position, piece.quaternion, piece.scale);
        this.addDebris(piece, inheritedVelocity);
      });
    }
    for (let i = 0; i < 16; i++) {
      const chunk = new THREE.Mesh(this.chunkGeometry, this.chunkMaterial);
      chunk.position.copy(position); chunk.scale.set(random(.15, .6), random(.1, .5), random(.3, 1.1)).multiplyScalar(scale);
      this.addDebris(chunk, inheritedVelocity);
    }
  }

  addDebris(mesh, inheritedVelocity) {
    if (this.debris.length >= 128) this.scene.remove(this.debris.shift().mesh);
    mesh.castShadow = true; this.scene.add(mesh);
    this.debris.push({ mesh, life: 5, velocity: inheritedVelocity.clone().multiplyScalar(.25).add(new THREE.Vector3(random(-12, 12), random(6, 18), random(-12, 12))), spin: new THREE.Vector3(random(-4, 4), random(-4, 4), random(-4, 4)) });
  }

  update(dt, drone, active, speed, boosting) {
    this.ambientTime += dt;
    if (active && this.ambientTime > .055) {
      this.ambientTime = 0;
      const origin = drone.position;
      this.emit(origin.clone().add(new THREE.Vector3(random(-26, 26), random(-12, 16), random(-30, 30))), new THREE.Vector3(.6, .15, -.3), { life: 3, size: .1, color: new THREE.Color(0xb4c4bc) });
      if (origin.y < 10) this.emit(new THREE.Vector3(origin.x + random(-3, 3), .4, origin.z + random(-3, 3)), new THREE.Vector3(random(-3, 3), .5, random(-3, 3)), { life: 1, size: 1.4, color: new THREE.Color(0x8e8877), smoke: true });
      if (boosting || speed > 38) {
        const behind = new THREE.Vector3(0, 0, 1).applyQuaternion(drone.quaternion);
        this.emit(origin.clone().addScaledVector(behind, 1.6), behind.multiplyScalar(2), { life: .3, size: boosting ? .6 : .2, color: new THREE.Color(0x63e6e0) });
      }
    }
    for (let i = 0; i < this.capacity; i++) {
      const p = this.particles[i]; p.life -= dt;
      if (p.life <= 0) { this.alphas[i] = 0; continue; }
      p.velocity.y -= p.gravity * dt;
      p.position.addScaledVector(p.velocity, dt);
      if (p.smoke) p.velocity.multiplyScalar(Math.exp(-1.2 * dt));
      p.position.toArray(this.positions, i * 3); p.color.toArray(this.colors, i * 3);
      this.sizes[i] = p.size * (p.smoke ? 1 + (1 - p.life / p.maxLife) * 2.8 : 1);
      this.alphas[i] = Math.min(1, p.life / p.maxLife * 2) * (p.smoke ? .45 : 1);
    }
    for (const attr of Object.values(this.points.geometry.attributes)) attr.needsUpdate = true;
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const p = this.debris[i]; p.life -= dt; p.velocity.y -= 18 * dt; p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += p.spin.x * dt; p.mesh.rotation.y += p.spin.y * dt; p.mesh.rotation.z += p.spin.z * dt;
      if (p.mesh.position.y < .3) { p.mesh.position.y = .3; p.velocity.multiplyScalar(.55); p.velocity.y = Math.abs(p.velocity.y) * .4; p.spin.multiplyScalar(.7); }
      if (p.life <= 0) { this.scene.remove(p.mesh); this.debris.splice(i, 1); }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const p = this.rings[i]; p.life -= dt; p.mesh.scale.setScalar((1 - p.life / .8) * 22 * p.scale + 1); p.mesh.material.opacity = Math.max(0, p.life);
      if (p.life <= 0) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); this.rings.splice(i, 1); }
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const p = this.flashes[i]; p.life -= dt; p.light.intensity = p.intensity * Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) { this.scene.remove(p.light); p.light.dispose(); this.flashes.splice(i, 1); }
    }
  }

  clear() {
    this.particles.forEach(p => { p.life = 0; }); this.alphas.fill(0);
    this.debris.forEach(p => this.scene.remove(p.mesh)); this.debris = [];
    this.rings.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }); this.rings = [];
    this.flashes.forEach(p => { this.scene.remove(p.light); p.light.dispose(); }); this.flashes = [];
  }
}
