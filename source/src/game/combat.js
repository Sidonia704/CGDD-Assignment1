import * as THREE from 'three';

export const GROUND_LOCK_SECONDS = .8;
export const SKY_LOCK_SECONDS = 2;
// Keep the sky layer below the vehicle coverage tops, independent of roofs.
export const skyAltitudeFor = level => Math.floor(Math.min(...level.threats.map(t => t.radius)) * .75);
export const antiAirHeightFor = skyAltitude => skyAltitude + 4;
export function insideAntiAirVolume(position, center, radius, skyAltitude) {
  return Math.hypot(position.x - center.x, position.z - center.z) <= radius
    && position.y >= center.y && position.y <= center.y + antiAirHeightFor(skyAltitude);
}

// Independent uninterrupted exposures: leaving a volume cancels its lock.
export function advanceLock(exposure, inside, dt, duration) {
  return inside ? Math.min(duration, exposure + dt) : 0;
}

// Relative-motion swept collision prevents fast drones/projectiles tunnelling.
export function sweptSphereHit(a, b, centerBefore, centerAfter, radius) {
  return sweptSphereTime(a, b, centerBefore, centerAfter, radius) !== null;
}

export function sweptSphereTime(a, b, centerBefore, centerAfter, radius) {
  const start = a.clone().sub(centerBefore);
  const end = b.clone().sub(centerAfter);
  const delta = end.sub(start);
  const c = start.lengthSq() - radius * radius;
  if (c <= 0) return 0;
  const aTerm = delta.lengthSq();
  const bTerm = 2 * start.dot(delta);
  const discriminant = bTerm * bTerm - 4 * aTerm * c;
  if (aTerm < 1e-12 || discriminant < 0) return null;
  const t = (-bTerm - Math.sqrt(discriminant)) / (2 * aTerm);
  return t >= 0 && t <= 1 ? t : null;
}

export function segmentBoxHit(start, end, box, padding = 0) {
  return segmentBoxTime(start, end, box, padding) !== null;
}

export function segmentBoxTime(start, end, box, padding = 0) {
  const bounds = box.clone().expandByScalar(padding);
  if (bounds.containsPoint(start)) return 0;
  const direction = end.clone().sub(start);
  const length = direction.length();
  if (!length) return null;
  const hit = new THREE.Ray(start, direction.divideScalar(length)).intersectBox(bounds, new THREE.Vector3());
  if (hit === null) return null;
  const t = start.distanceTo(hit) / length;
  return t <= 1 ? t : null;
}
