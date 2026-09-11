import * as THREE from 'three';
import { loadModels, modelInstance } from './models.js';
import { FlightEffects } from './effects.js';
import { GROUND_LOCK_SECONDS, SKY_LOCK_SECONDS, skyAltitudeFor, antiAirHeightFor, insideAntiAirVolume, advanceLock, sweptSphereTime, segmentBoxHit, segmentBoxTime } from './combat.js';
import '../styles/site.css';

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

const LEVELS = [
  {
    name: 'OPEN-SPACE INTERCEPT', shortName: 'Challenge 01', boundary: 170,
    spawn: [0, 12, 112], maxSpeed: 58, acceleration: 22, handling: 2.45, turnRate: 1.32,
    targetSpeed: 7, targetDefenseRadius: 18,
    targetPath: [[-46, 3, -92], [48, 3, -92], [62, 3, -45], [-40, 3, -44]],
    threats: [
      { path: [[-55, 0, 22], [52, 0, 12]], radius: 40, lockRate: 125, moveSpeed: 8 },
      { path: [[65, 0, 5], [-35, 0, -18]], radius: 38, lockRate: 125, moveSpeed: 7 },
      { path: [[-58, 0, -55], [50, 0, -68]], radius: 36, lockRate: 125, moveSpeed: 8 }
    ],
    obstacles: []
  },
  {
    name: 'RESTRICTED APPROACH', shortName: 'Challenge 02', boundary: 150,
    spawn: [0, 11, 112], maxSpeed: 60, acceleration: 23, handling: 2.35, turnRate: 1.28,
    targetSpeed: 8, targetDefenseRadius: 19,
    targetPath: [[-56, 3, -105], [55, 3, -105], [68, 3, -58], [-50, 3, -55]],
    threats: [
      { path: [[-66, 0, 38], [48, 0, 24]], radius: 41, lockRate: 125, moveSpeed: 9 },
      { path: [[56, 0, -38], [-48, 0, -46]], radius: 38, lockRate: 125, moveSpeed: 7 },
      { path: [[-64, 0, 78], [64, 0, 68]], radius: 35, lockRate: 125, moveSpeed: 8 },
      { path: [[-64, 0, -92], [62, 0, -82]], radius: 36, lockRate: 125, moveSpeed: 9 }
    ],
    obstacles: [
      [-58, 8, 66, 18, 16, 20], [-22, 12, 50, 18, 24, 18], [30, 9, 52, 20, 18, 20], [65, 14, 30, 18, 28, 18],
      [-66, 15, -5, 18, 30, 20], [-25, 10, -4, 24, 20, 18], [23, 16, -13, 20, 32, 20], [66, 11, -26, 18, 22, 18],
      [-48, 13, -72, 22, 26, 20], [8, 9, -64, 20, 18, 24]
    ]
  },
  {
    name: 'URBAN INTERCEPT', shortName: 'Challenge 03', boundary: 126,
    spawn: [0, 13, 108], maxSpeed: 62, acceleration: 24, handling: 2.2, turnRate: 1.2,
    targetSpeed: 9.5, targetDefenseRadius: 20,
    targetPath: [[-46, 3, -106], [47, 3, -106], [54, 3, -72], [-48, 3, -70]],
    threats: [
      { path: [[-68, 0, 56], [36, 0, 48]], radius: 35, lockRate: 125, moveSpeed: 9 },
      { path: [[59, 0, 7], [-45, 0, -4]], radius: 34, lockRate: 125, moveSpeed: 8 },
      { path: [[-51, 0, -58], [55, 0, -55]], radius: 33, lockRate: 125, moveSpeed: 10 },
      { path: [[-78, 0, 86], [72, 0, 78]], radius: 32, lockRate: 125, moveSpeed: 8 },
      { path: [[-70, 0, -92], [70, 0, -88]], radius: 32, lockRate: 125, moveSpeed: 9 }
    ],
    obstacles: [
      [-80, 18, 84, 28, 36, 28], [-31, 26, 82, 26, 52, 26], [31, 22, 82, 26, 44, 26], [80, 30, 78, 28, 60, 30],
      [-80, 25, 34, 28, 50, 26], [-31, 15, 36, 26, 30, 30], [31, 28, 33, 26, 56, 30], [80, 20, 28, 28, 40, 24],
      [-80, 20, -19, 28, 40, 28], [-31, 30, -16, 26, 60, 26], [31, 18, -18, 26, 36, 28], [80, 27, -22, 28, 54, 26],
      [-80, 28, -69, 28, 56, 26], [-31, 20, -66, 26, 40, 28], [31, 30, -66, 26, 60, 28], [80, 18, -72, 28, 36, 26]
    ]
  }
];

const ui = Object.fromEntries([
  'game-canvas', 'mission-select', 'launch-button', 'hud', 'level-label', 'level-name', 'lock-state', 'lock-fill', 'lock-value',
  'lock-hint', 'speed-value', 'speed-fill', 'impact-tick', 'altitude-value', 'authority-dots', 'target-distance',
  'impact-speed', 'boost-state', 'target-marker', 'marker-distance', 'flight-message', 'danger-flash', 'result-panel', 'sky-fill', 'sky-status', 'sky-hint',
  'result-code', 'result-title', 'result-detail', 'result-speed', 'result-lock', 'retry-button', 'choose-button',
  'controls-button', 'controls-dialog', 'close-controls'
].map((id) => [id.replaceAll('-', '_'), document.getElementById(id)]));

let selectedLevel = 0;
let levelIndex = 0;
let level = LEVELS[0];
let state = 'select';
let elapsed = 0;
let lastTime = performance.now();
let lockValue = 0;
let skyExposure = 0;
let skyAltitude = skyAltitudeFor(LEVELS[0]);
let skyCooldown = 0;
let projectiles = [];
let resultDelay = 0;
let pendingResult = null;
let modelsReady = false;
const previousDronePosition = new THREE.Vector3();
const previousTargetPosition = new THREE.Vector3();
let messageTimer = 0;
let boostCharge = 1;
let boostActive = 0;
let lastBeep = 0;
let audio = null;
let obstacles = [];
let threats = [];
let target = null;
let drone = null;
let velocity = new THREE.Vector3();
let mouseDeltaX = 0;
let mouseDeltaY = 0;
const keys = new Set();

const renderer = new THREE.WebGLRenderer({ canvas: ui.game_canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bafb5);
scene.fog = new THREE.FogExp2(0x9bafb5, 0.0028);
const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 900);
const world = new THREE.Group();
scene.add(world);
const effects = new FlightEffects(scene);

scene.add(new THREE.HemisphereLight(0xb9dbe0, 0x18222a, 2.1));
const sun = new THREE.DirectionalLight(0xeaf8f5, 3.2);
sun.position.set(-80, 130, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = .5; sun.shadow.camera.far = 420;
sun.shadow.normalBias = .06;
sun.shadow.camera.left = -190; sun.shadow.camera.right = 190; sun.shadow.camera.top = 190; sun.shadow.camera.bottom = -190;
scene.add(sun);

function material(color, roughness = 0.8, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function buildDrone() {
  const group = new THREE.Group();
  group.add(modelInstance('drone', 4.4, true));
  for (const [x, z] of [[-1.47, -1.2], [1.47, -1.2], [-1.47, 1.28], [1.47, 1.28]]) {
    const rotor = new THREE.Mesh(new THREE.CircleGeometry(.69, 24), new THREE.MeshBasicMaterial({ color: 0x9ce9dc, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false }));
    rotor.rotation.x = -Math.PI / 2; rotor.position.set(x, .2, z); group.add(rotor);
  }
  const glow = new THREE.PointLight(0x35f1dc, 5, 16); glow.position.z = 1.6; group.add(glow);
  return group;
}

function buildTarget() {
  const group = new THREE.Group();
  const visual = modelInstance('tank', 8.6); visual.position.y = -3; group.add(visual);
  const beacon = new THREE.PointLight(0xffb545, 12, 28); beacon.position.y = 5; group.add(beacon);
  return { group, visual, progress: 0, exposure: 0, cooldown: 0 };
}

function makeGround(boundary) {
  const pixels = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    const value = 110 + Math.floor(Math.random() * 50);
    pixels[i] = value; pixels[i + 1] = value; pixels[i + 2] = value; pixels[i + 3] = 255;
  }
  const surface = new THREE.DataTexture(pixels, 128, 128); surface.wrapS = surface.wrapT = THREE.RepeatWrapping;
  surface.repeat.set(45, 45); surface.colorSpace = THREE.SRGBColorSpace; surface.needsUpdate = true;
  const groundMaterial = material(0x627475, 1); groundMaterial.map = surface;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(boundary * 2, boundary * 2, 20, 20), groundMaterial);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  const grid = new THREE.GridHelper(boundary * 2, 28, 0x6c9399, 0x39585f); grid.position.y = .05; grid.material.opacity = .34; grid.material.transparent = true; world.add(grid);
  if (levelIndex > 0) {
    const roadMaterial = material(0x303b40, .96);
    const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xa5a68d, transparent: true, opacity: .55 });
    for (const x of [-55, 0, 55]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(13, boundary * 2), roadMaterial);
      road.rotation.x = -Math.PI / 2; road.position.set(x, .065, 0); road.receiveShadow = true; world.add(road);
      for (let z = -boundary + 5; z < boundary; z += 11) {
        const marking = new THREE.Mesh(new THREE.PlaneGeometry(.18, 4), laneMaterial);
        marking.rotation.x = -Math.PI / 2; marking.position.set(x, .08, z); world.add(marking);
      }
    }
  }
  const borderMaterial = new THREE.MeshBasicMaterial({ color: 0x35f1dc, transparent: true, opacity: .42 });
  for (const [x, z, sx, sz] of [[0, -boundary, boundary * 2, .45], [0, boundary, boundary * 2, .45], [-boundary, 0, .45, boundary * 2], [boundary, 0, .45, boundary * 2]]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(sx, .25, sz), borderMaterial); line.position.set(x, .18, z); world.add(line);
  }
  for (let i = -boundary + 12; i < boundary; i += 24) {
    for (const [x, z] of [[i, -boundary], [i, boundary], [-boundary, i], [boundary, i]]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.25, 8, .25), borderMaterial); post.position.set(x, 4, z); world.add(post);
    }
  }
}

function addObstacle(spec, urban) {
  const [x, halfY, z, sx, sy, sz] = spec;
  const mesh = modelInstance(`building-${obstacles.length % 11}`, [sx, sy, sz]);
  mesh.position.set(x, halfY - sy / 2, z); world.add(mesh);
  const box = new THREE.Box3().setFromObject(mesh);
  obstacles.push({ mesh, box });
}

function addThreat(config, index) {
  const group = new THREE.Group();
  const height = antiAirHeightFor(skyAltitude);
  const zone = new THREE.Mesh(new THREE.CylinderGeometry(config.radius, config.radius, height, 48), new THREE.MeshBasicMaterial({ color: 0xff4035, transparent: true, opacity: .075, depthWrite: false, side: THREE.DoubleSide }));
  zone.position.y = height / 2;
  group.add(zone);
  const ring = new THREE.Mesh(new THREE.RingGeometry(config.radius - .6, config.radius, 64), new THREE.MeshBasicMaterial({ color: 0xff554c, transparent: true, opacity: .7, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .15; group.add(ring);
  const vehicle = modelInstance('anti-aircraft', 8); group.add(vehicle);
  const light = new THREE.PointLight(0xff4035, 7, config.radius * 1.2); light.position.y = 4; group.add(light);
  group.position.set(...config.path[0]); world.add(group);
  threats.push({ ...config, group, vehicle, zone, progress: index * .31, exposure: 0, cooldown: 0 });
}

function clearWorld() {
  effects.clear();
  for (const projectile of projectiles) removeProjectile(projectile);
  projectiles = [];
  while (world.children.length) {
    const child = world.children[0]; world.remove(child);
    child.traverse?.((node) => {
      if (node.userData.sharedAsset) return;
      node.geometry?.dispose();
      if (Array.isArray(node.material)) node.material.forEach((m) => { m.map?.dispose(); m.dispose(); }); else { node.material?.map?.dispose(); node.material?.dispose(); }
    });
  }
  obstacles = []; threats = []; target = null; drone = null;
}

function setupLevel(index) {
  levelIndex = index; level = LEVELS[index]; clearWorld(); makeGround(level.boundary);
  skyAltitude = skyAltitudeFor(level);
  const ceiling = new THREE.GridHelper(level.boundary * 2, 16, 0xffa04f, 0xd2a67d);
  ceiling.position.y = skyAltitude; ceiling.material.transparent = true; ceiling.material.opacity = .22; ceiling.material.depthWrite = false; world.add(ceiling);
  level.obstacles.forEach((spec) => addObstacle(spec, index === 2));
  level.threats.forEach(addThreat);
  target = buildTarget(); target.group.position.set(...level.targetPath[0]); world.add(target.group);
  const defenseRing = new THREE.Mesh(new THREE.RingGeometry(level.targetDefenseRadius - .45, level.targetDefenseRadius, 64), new THREE.MeshBasicMaterial({ color: 0xffb545, transparent: true, opacity: .42, side: THREE.DoubleSide }));
  defenseRing.rotation.x = -Math.PI / 2; defenseRing.position.y = -2.85; target.group.add(defenseRing); target.defenseRing = defenseRing;
  const tankZone = new THREE.Mesh(new THREE.SphereGeometry(level.targetDefenseRadius, 40, 16), new THREE.MeshBasicMaterial({ color: 0xffb545, transparent: true, opacity: .055, side: THREE.DoubleSide, depthWrite: false }));
  target.group.add(tankZone);
  drone = buildDrone(); drone.position.set(...level.spawn); world.add(drone);
  drone.quaternion.identity(); velocity.set(0, 0, 0); mouseDeltaX = 0; mouseDeltaY = 0;
  lockValue = 0; skyExposure = 0; skyCooldown = 0; boostCharge = 1; boostActive = 0; elapsed = 0; messageTimer = 4; pendingResult = null; resultDelay = 0;
  ui.flight_message.textContent = 'NO AUTO-THRUST — MOVE, AIM, AND HOVER INDEPENDENTLY';
  ui.level_label.textContent = level.shortName.toUpperCase(); ui.level_name.textContent = level.name;
  ui.impact_speed.textContent = skyAltitude; ui.impact_tick.hidden = true;
  previousDronePosition.copy(drone.position); previousTargetPosition.copy(target.group.position);
  updateCamera(true); updateHUD();
}

function moveAlongPath(object, points, moveSpeed, dt) {
  if (points.length < 2) return;
  // Advance across a segment boundary without jumping back to its old start.
  let remaining = moveSpeed * dt;
  while (remaining > 0) {
    const index = Math.floor(object.progress) % points.length;
    const length = new THREE.Vector3(...points[index]).distanceTo(new THREE.Vector3(...points[(index + 1) % points.length]));
    const distanceToEnd = (1 - (object.progress % 1)) * Math.max(length, 1);
    if (remaining < distanceToEnd) { object.progress += remaining / Math.max(length, 1); break; }
    remaining -= distanceToEnd; object.progress = Math.floor(object.progress) + 1;
  }
  const aIndex = Math.floor(object.progress) % points.length;
  const bIndex = (aIndex + 1) % points.length;
  const a = new THREE.Vector3(...points[aIndex]);
  const b = new THREE.Vector3(...points[bIndex]);
  const t = object.progress - Math.floor(object.progress);
  object.group.position.lerpVectors(a, b, t);
  object.group.rotation.y = Math.atan2(a.x - b.x, a.z - b.z);
}

function inputAxis(positive, negative) { return (keys.has(positive) ? 1 : 0) - (keys.has(negative) ? 1 : 0); }

function updateDrone(dt) {
  const forwardInput = inputAxis('KeyW', 'KeyS');
  const strafeInput = inputAxis('KeyD', 'KeyA');
  const verticalInput = (keys.has('Space') ? 1 : 0) - (keys.has('ControlLeft') || keys.has('ControlRight') ? 1 : 0);
  const rollInput = inputAxis('KeyE', 'KeyQ');
  const actualSpeed = velocity.length();
  const speedRatio = clamp(actualSpeed / level.maxSpeed, 0, 1.25);
  const controlAuthority = lerp(1, .38, Math.pow(clamp(speedRatio, 0, 1), 1.35));

  if (mouseDeltaX || mouseDeltaY) {
    const yawRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -mouseDeltaX * .00175 * controlAuthority);
    drone.quaternion.premultiply(yawRotation);
    const localRight = new THREE.Vector3(1, 0, 0).applyQuaternion(drone.quaternion).normalize();
    const pitchRotation = new THREE.Quaternion().setFromAxisAngle(localRight, -mouseDeltaY * .00161 * controlAuthority);
    drone.quaternion.premultiply(pitchRotation).normalize();
    mouseDeltaX = 0; mouseDeltaY = 0;
  }

  if (rollInput) {
    const rollAxis = new THREE.Vector3(0, 0, -1).applyQuaternion(drone.quaternion).normalize();
    const rollRotation = new THREE.Quaternion().setFromAxisAngle(rollAxis, rollInput * 1.85 * controlAuthority * dt);
    drone.quaternion.premultiply(rollRotation).normalize();
  }

  if ((keys.has('ShiftLeft') || keys.has('ShiftRight')) && boostCharge > .1 && boostActive <= 0) {
    boostActive = .85; boostCharge = Math.max(0, boostCharge - .65); showMessage('BOOST COMMITTED — TURN AUTHORITY REDUCED', 1.4);
  }
  if (boostActive > 0) boostActive -= dt; else boostCharge = Math.min(1, boostCharge + dt * .13);

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(drone.quaternion).normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(drone.quaternion).normalize();
  const acceleration = new THREE.Vector3()
    .addScaledVector(forward, forwardInput * level.acceleration)
    .addScaledVector(right, strafeInput * level.acceleration * .82)
    .addScaledVector(new THREE.Vector3(0, 1, 0), verticalInput * level.acceleration * .76);
  if (boostActive > 0) acceleration.addScaledVector(forward, 27);
  velocity.addScaledVector(acceleration, dt);
  const hasTranslationInput = Boolean(forwardInput || strafeInput || verticalInput || boostActive > 0);
  velocity.multiplyScalar(Math.exp(-(hasTranslationInput ? .34 : 1.55) * dt));
  const maximumSpeed = level.maxSpeed + (boostActive > 0 ? 13 : 0);
  if (velocity.length() > maximumSpeed) velocity.setLength(maximumSpeed);
  drone.position.addScaledVector(velocity, dt);

  if (drone.position.y <= 1.1) return crashed('You descended below the recoverable flight envelope. Watch altitude before committing to the next turn.');
  if (Math.abs(drone.position.x) > level.boundary || Math.abs(drone.position.z) > level.boundary) return crashed('Momentum carried the drone outside the test airspace. Reduce speed before correcting near the boundary.');
  if (obstacles.some((item) => segmentBoxHit(previousDronePosition, drone.position, item.box, .9))) return crashed('There was not enough room to complete the turn. Slow down before entering the restricted gap.');
  target.group.updateWorldMatrix(true, true);
  const tankBounds = new THREE.Box3().setFromObject(target.visual);
  const relativeStart = previousDronePosition.clone().add(target.group.position).sub(previousTargetPosition);
  if (segmentBoxHit(relativeStart, drone.position, tankBounds, .9)) return win(velocity.length());
}

function updateThreats(dt) {
  let groundProgress = 0;
  for (const threat of threats) {
    threat.zone.material.opacity = .065 + Math.sin(elapsed * 2.4 + threat.progress) * .018;
    updateGroundDefense(threat, threat.radius, dt);
    groundProgress = Math.max(groundProgress, threat.exposure / GROUND_LOCK_SECONDS);
  }
  updateGroundDefense(target, level.targetDefenseRadius, dt);
  groundProgress = Math.max(groundProgress, target.exposure / GROUND_LOCK_SECONDS);
  skyExposure = advanceLock(skyExposure, drone.position.y >= skyAltitude, dt, SKY_LOCK_SECONDS);
  skyCooldown = Math.max(0, skyCooldown - dt);
  if (skyExposure >= SKY_LOCK_SECONDS && skyCooldown <= 0 && projectiles.filter(p => p.missile).length < 3) {
    const launcher = threats.reduce((nearest, t) => t.group.position.distanceToSquared(drone.position) < nearest.group.position.distanceToSquared(drone.position) ? t : nearest, threats[0]);
    fireProjectile(launcher.group.position.clone().add(new THREE.Vector3(0, 6, 0)), true);
    skyCooldown = 2.5;
  }
  lockValue = groundProgress * 100;
  updateAudio(groundProgress > 0 || skyExposure > 0 || projectiles.some(p => p.missile));
}

function updateGroundDefense(defense, radius, dt) {
  const inside = defense === target
    ? drone.position.distanceTo(defense.group.position) <= radius
    : insideAntiAirVolume(drone.position, defense.group.position, radius, skyAltitude);
  defense.exposure = advanceLock(defense.exposure, inside, dt, GROUND_LOCK_SECONDS);
  defense.cooldown = Math.max(0, defense.cooldown - dt);
  defense.dustTime = (defense.dustTime || 0) + dt;
  if (defense.dustTime > .12) {
    defense.dustTime = 0;
    effects.emit(new THREE.Vector3(defense.group.position.x, .4, defense.group.position.z), new THREE.Vector3(.7, .6, .3), { life: 1.8, size: 2.3, color: new THREE.Color(0x938d79), smoke: true });
  }
  if (defense.exposure >= GROUND_LOCK_SECONDS && defense.cooldown <= 0) {
    fireProjectile(defense.group.position.clone().add(new THREE.Vector3(0, defense === target ? 1 : 4.4, 0)), false);
    defense.cooldown = .12;
  }
}

function fireProjectile(origin, missile) {
  const speed = missile ? 42 : 180;
  const intercept = drone.position.clone().addScaledVector(velocity, origin.distanceTo(drone.position) / speed);
  const direction = intercept.sub(origin).normalize();
  const group = new THREE.Group();
  if (missile) {
    group.add(modelInstance('missile', 3.8, true));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.25, 1.8, 10), new THREE.MeshBasicMaterial({ color: 0xffca78 }));
    flame.rotation.x = Math.PI / 2; flame.position.z = 2.3; group.add(flame);
  } else {
    const tracer = new THREE.Mesh(new THREE.CylinderGeometry(.07, .12, 3.6, 6), new THREE.MeshBasicMaterial({ color: 0xffdc7b }));
    tracer.rotation.x = Math.PI / 2; group.add(tracer);
  }
  group.position.copy(origin); scene.add(group);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
  projectiles.push({ group, missile, direction, speed, age: 0, trailTime: 0 });
  effects.muzzle(origin);
  if (missile) showMessage('MISSILE INBOUND — DESCEND AND USE COVER', 2);
}

function removeProjectile(projectile) {
  scene.remove(projectile.group);
  projectile.group.traverse(n => { if (n.isMesh && !n.userData.sharedAsset) { n.geometry.dispose(); n.material.dispose(); } });
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; const before = p.group.position.clone(); p.age += dt;
    if (p.missile && state === 'playing') {
      const desired = drone.position.clone().addScaledVector(velocity, Math.min(.45, before.distanceTo(drone.position) / 115)).sub(before).normalize();
      const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), desired);
      p.group.quaternion.rotateTowards(rotation, 2.8 * dt);
      p.direction.set(0, 0, -1).applyQuaternion(p.group.quaternion);
      p.speed = Math.min(115, p.speed + 65 * dt);
    }
    p.group.position.addScaledVector(p.direction, p.speed * dt);
    p.trailTime += dt;
    if (p.trailTime >= .025) {
      // Sample the entire travelled segment so the smoke trail has no gaps.
      const steps = Math.max(1, Math.ceil(before.distanceTo(p.group.position) / 1.4));
      for (let j = 0; j < steps; j++) effects.trail(before.clone().lerp(p.group.position, j / steps), p.direction, p.missile);
      p.trailTime = 0;
    }
    let blockTime = Infinity;
    for (const obstacle of obstacles) {
      const t = segmentBoxTime(before, p.group.position, obstacle.box, .1);
      if (t !== null) blockTime = Math.min(blockTime, t);
    }
    if (p.group.position.y < .1) blockTime = Math.min(blockTime, Math.max(0, (before.y - .1) / (before.y - p.group.position.y)));
    const droneTime = state === 'playing' ? sweptSphereTime(before, p.group.position, previousDronePosition, drone.position, p.missile ? 2 : 1.3) : null;
    const hit = droneTime !== null && droneTime < blockTime;
    const blocked = Number.isFinite(blockTime) && !hit;
    if (blocked || hit || p.age > (p.missile ? 9 : 2)) {
      if (blocked || hit) p.group.position.lerpVectors(before, p.group.position.clone(), hit ? droneTime : blockTime);
      if (blocked) effects.explode(p.group.position, p.missile ? .45 : .08);
      removeProjectile(p); projectiles.splice(i, 1);
      if (hit) shotDown(p.missile ? 'A missile launched after 2 seconds above the amber grid intercepted your drone. Descend before lock completes, or put solid cover between you and the missile.' : 'A tank or anti-air vehicle tracked you for 0.8 seconds and its gunfire hit the drone. Shorten exposure and keep an escape route.');
    }
  }
}

function updateCamera(immediate = false) {
  if (!drone) return;
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(drone.quaternion).normalize();
  const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(drone.quaternion).normalize();
  const desired = drone.position.clone().addScaledVector(forward, -14).addScaledVector(localUp, 5.2);
  if (immediate) camera.position.copy(desired); else camera.position.lerp(desired, .09);
  camera.up.lerp(localUp, immediate ? 1 : .1).normalize();
  const lookAt = drone.position.clone().addScaledVector(forward, 16).addScaledVector(localUp, 1.4);
  camera.lookAt(lookAt);
}

function updateTargetMarker() {
  if (!target || !drone) return;
  const vector = target.group.position.clone(); vector.y += 4; vector.project(camera);
  const behind = vector.z > 1;
  const x = clamp((vector.x * .5 + .5) * innerWidth, 70, innerWidth - 70);
  const y = clamp((-vector.y * .5 + .5) * (innerHeight - 64), 70, innerHeight - 150);
  ui.target_marker.style.left = `${behind ? innerWidth - x : x}px`;
  ui.target_marker.style.top = `${y}px`;
  const distance = Math.round(drone.position.distanceTo(target.group.position));
  ui.marker_distance.textContent = `${distance} m`; ui.target_distance.textContent = distance;
}

function updateHUD() {
  if (!drone) return;
  const actualSpeed = velocity.length();
  ui.speed_value.textContent = Math.round(actualSpeed);
  ui.speed_fill.style.width = `${clamp(actualSpeed / (level.maxSpeed + 13), 0, 1) * 100}%`;
  ui.altitude_value.textContent = Math.max(0, Math.round(drone.position.y));
  ui.lock_value.textContent = String(Math.round(lockValue)).padStart(3, '0');
  ui.lock_fill.style.width = `${lockValue}%`;
  const lockState = lockValue <= 0 ? 'SAFE' : lockValue < 35 ? 'DETECTED' : 'LOCKING';
  ui.lock_state.textContent = lockState;
  ui.lock_state.style.color = lockValue > 0 ? '#ff6258' : '#fff';
  ui.lock_hint.textContent = lockValue <= 0 ? 'NO ACTIVE TRACK' : lockValue < 35 ? 'LEAVE RED VOLUME' : 'BREAK LOCK IMMEDIATELY';
  if (lockValue >= 100) ui.lock_hint.textContent = 'GUNFIRE — BREAK AWAY';
  const missiles = projectiles.filter(p => p.missile);
  ui.sky_fill.style.width = `${skyExposure / SKY_LOCK_SECONDS * 100}%`;
  ui.sky_status.textContent = missiles.length ? `MISSILE INBOUND ×${missiles.length}` : skyExposure > 0 ? `SKY LOCK ${skyExposure.toFixed(1)} / 2.0s` : 'SKY TRACK CLEAR';
  ui.sky_hint.textContent = missiles.length ? `CLOSEST ${Math.round(Math.min(...missiles.map(p => p.group.position.distanceTo(drone.position))))} m · DESCEND / USE COVER` : `ABOVE ${skyAltitude} m: 2s TO MISSILE LAUNCH`;
  ui.danger_flash.style.opacity = String(Math.max(lockValue / 260, skyExposure / 6, missiles.length ? .35 : 0));
  const authority = lerp(1, .38, Math.pow(clamp(actualSpeed / level.maxSpeed, 0, 1), 1.35));
  [...ui.authority_dots.children].forEach((dot, i) => dot.classList.toggle('active', i < Math.ceil(authority * 5)));
  ui.boost_state.textContent = boostActive > 0 ? 'ACTIVE' : boostCharge > .65 ? 'READY' : `${Math.round(boostCharge * 100)}%`;
  updateTargetMarker();
  if (messageTimer > 0) messageTimer -= 1 / 60; else ui.flight_message.textContent = '';
}

function showMessage(text, duration = 1.4) { ui.flight_message.textContent = text; messageTimer = Math.max(messageTimer, duration); }

function createAudio() {
  if (audio) return;
  const context = new AudioContext();
  const engine = context.createOscillator(); const engineGain = context.createGain();
  engine.type = 'sawtooth'; engine.frequency.value = 48; engineGain.gain.value = .018;
  engine.connect(engineGain).connect(context.destination); engine.start();
  audio = { context, engine, engineGain };
}

function updateAudio(inThreat) {
  if (!audio) return;
  audio.engine.frequency.setTargetAtTime(42 + velocity.length() * 1.05, audio.context.currentTime, .08);
  audio.engineGain.gain.setTargetAtTime(state === 'playing' ? .012 + velocity.length() / 5000 : 0, audio.context.currentTime, .1);
  if (inThreat && performance.now() - lastBeep > lerp(850, 120, lockValue / 100)) {
    const oscillator = audio.context.createOscillator(); const gain = audio.context.createGain();
    oscillator.type = 'square'; oscillator.frequency.value = 540 + lockValue * 3.2;
    gain.gain.setValueAtTime(.06, audio.context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.context.currentTime + .09);
    oscillator.connect(gain).connect(audio.context.destination); oscillator.start(); oscillator.stop(audio.context.currentTime + .1); lastBeep = performance.now();
  }
}

function endMission(won, title, detail) {
  if (state !== 'playing') return;
  state = 'resolving'; pendingResult = won ? 'won' : 'failed'; resultDelay = 1.9; keys.clear();
  effects.explode(drone.position, 1, drone, velocity);
  drone.visible = false;
  if (won) { effects.explode(target.group.position, 1.7, target.visual); target.group.visible = false; }
  if (document.pointerLockElement) document.exitPointerLock();
  ui.result_code.textContent = won ? 'MISSION COMPLETE' : 'MISSION FAILED';
  ui.result_code.style.color = won ? '#25e0d0' : '#ff6258'; ui.result_title.textContent = title; ui.result_detail.textContent = detail;
  ui.result_speed.textContent = `${Math.round(velocity.length())} m/s`; ui.result_lock.textContent = `GUN ${Math.round(lockValue)}% / SKY ${Math.round(skyExposure / SKY_LOCK_SECONDS * 100)}%`;
  ui.target_marker.hidden = true;
  if (audio) audio.engineGain.gain.setTargetAtTime(0, audio.context.currentTime, .08);
}

function win(actualSpeed) { endMission(true, 'YOU DESTROYED THE ENEMY TANK', `Impact registered at ${Math.round(actualSpeed)} m/s. You preserved enough momentum while keeping room for the final correction.`); }
function shotDown(detail) { endMission(false, 'YOU WERE SHOT DOWN', detail); }
function crashed(detail) { endMission(false, 'YOU CRASHED', detail); }

function launch(index) {
  if (!modelsReady) return;
  createAudio(); audio.context.resume(); setupLevel(index); state = 'playing';
  ui.mission_select.hidden = true; ui.result_panel.hidden = true; ui.hud.hidden = false;
  ui.target_marker.hidden = false;
  ui.game_canvas.requestPointerLock?.()?.catch?.(() => showMessage('CLICK THE FLIGHT VIEW TO ENABLE MOUSE LOOK', 3));
}

function returnToSelect() {
  state = 'select'; keys.clear(); ui.hud.hidden = true; ui.result_panel.hidden = true; ui.mission_select.hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
  if (audio) audio.engineGain.gain.setTargetAtTime(0, audio.context.currentTime, .08);
}

function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - lastTime) / 1000, .033); lastTime = time;
  if (state === 'playing') {
    elapsed += dt;
    previousDronePosition.copy(drone.position); previousTargetPosition.copy(target.group.position);
    moveAlongPath(target, level.targetPath, level.targetSpeed, dt);
    for (const threat of threats) moveAlongPath(threat, threat.path, threat.moveSpeed, dt);
    updateDrone(dt);
    if (state === 'playing') { updateThreats(dt); updateProjectiles(dt); }
    updateCamera(); updateHUD();
  } else if (state === 'resolving') {
    resultDelay -= dt;
    updateProjectiles(dt);
    if (resultDelay <= 0) { state = pendingResult; ui.result_panel.hidden = false; }
  }
  if (drone) effects.update(dt, drone, state === 'playing', velocity.length(), boostActive > 0);
  renderer.render(scene, camera);
}

function resize() {
  const width = ui.game_canvas.clientWidth; const height = ui.game_canvas.clientHeight;
  renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
  effects.points.material.uniforms.viewportScale.value = height * renderer.getPixelRatio() * .85;
}

document.querySelectorAll('.mission-card').forEach((card) => card.addEventListener('click', () => {
  selectedLevel = Number(card.dataset.level);
  document.querySelectorAll('.mission-card').forEach((item) => { const active = item === card; item.classList.toggle('selected', active); item.setAttribute('aria-checked', String(active)); });
  if (modelsReady) ui.launch_button.innerHTML = `Launch challenge 0${selectedLevel + 1} <span aria-hidden="true">→</span>`;
}));
ui.launch_button.addEventListener('click', () => launch(selectedLevel));
ui.retry_button.addEventListener('click', () => launch(levelIndex));
ui.choose_button.addEventListener('click', returnToSelect);
ui.controls_button.addEventListener('click', () => ui.controls_dialog.showModal());
ui.close_controls.addEventListener('click', () => ui.controls_dialog.close());
ui.controls_dialog.addEventListener('click', (event) => { if (event.target === ui.controls_dialog) ui.controls_dialog.close(); });

window.addEventListener('keydown', (event) => {
  if (['Space', 'ControlLeft', 'ControlRight'].includes(event.code)) event.preventDefault();
  if (event.code === 'KeyR' && state === 'playing') launch(levelIndex);
  if (event.code === 'Escape') keys.clear(); else keys.add(event.code);
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('resize', resize);
document.addEventListener('mousemove', (event) => {
  if (state !== 'playing' || document.pointerLockElement !== ui.game_canvas) return;
  mouseDeltaX += event.movementX;
  mouseDeltaY += event.movementY;
});
document.addEventListener('pointerlockchange', () => {
  if (state === 'playing' && document.pointerLockElement !== ui.game_canvas) showMessage('CLICK THE FLIGHT VIEW TO RECAPTURE MOUSE LOOK', 3);
});
ui.game_canvas.addEventListener('click', () => {
  if (state === 'playing' && document.pointerLockElement !== ui.game_canvas) ui.game_canvas.requestPointerLock?.();
});

ui.launch_button.disabled = true;
resize(); animate(performance.now());
loadModels(progress => { ui.launch_button.textContent = `Preparing aircraft & terrain · ${Math.round(progress * 100)}%`; })
  .then(() => { modelsReady = true; setupLevel(0); ui.launch_button.disabled = false; ui.launch_button.textContent = `Launch challenge 0${selectedLevel + 1} →`; })
  .catch(error => { console.error('Model loading failed', error); ui.launch_button.textContent = 'Assets could not load — refresh to retry'; });
