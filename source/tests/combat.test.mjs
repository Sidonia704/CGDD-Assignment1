import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Box3 } from 'three';
import { advanceLock, skyAltitudeFor, antiAirHeightFor, insideAntiAirVolume, sweptSphereHit, sweptSphereTime, segmentBoxHit, segmentBoxTime, GROUND_LOCK_SECONDS, SKY_LOCK_SECONDS } from '../src/game/combat.js';

test('ground and sky locks complete at their own thresholds and exit cancels exposure', () => {
  for (const duration of [GROUND_LOCK_SECONDS, SKY_LOCK_SECONDS]) {
    let value = 0;
    for (let i = 0; i < duration * 100 - 1; i++) value = advanceLock(value, true, .01, duration);
    assert.ok(value < duration);
    assert.equal(advanceLock(value, true, .02, duration), duration);
    assert.equal(advanceLock(value, false, .016, duration), 0);
    assert.equal(advanceLock(0, true, .1, duration), .1);
  }
});
test('defense layers leave no untracked vertical passage even at footprint edges', () => {
  for (const radii of [[40, 38, 36], [41, 38, 35, 36], [35, 34, 33, 32, 32]]) {
    const sky = skyAltitudeFor({ threats: radii.map(radius => ({ radius })) });
    assert.ok(sky < 30);
    assert.equal(antiAirHeightFor(sky), sky + 4);
    for (const radius of radii) {
      const center = new Vector3(25, 0, -10);
      for (const fraction of [0, .5, .99, 1]) {
        for (let altitude = 0; altitude <= 90; altitude += .5) {
          const position = new Vector3(center.x + radius * fraction, altitude, center.z);
          assert.ok(insideAntiAirVolume(position, center, radius, sky) || altitude >= sky);
        }
      }
      assert.ok(!insideAntiAirVolume(new Vector3(center.x + radius + .1, 10, center.z), center, radius, sky));
    }
  }
});
test('fast crossing counts as impact even when both endpoints are outside', () => {
  const center = new Vector3();
  assert.ok(sweptSphereHit(new Vector3(-10, 0, 0), new Vector3(10, 0, 0), center, center, 1));
  assert.ok(!sweptSphereHit(new Vector3(-10, 3, 0), new Vector3(10, 3, 0), center, center, 1));
  assert.ok(sweptSphereHit(center, center, new Vector3(-10, 0, 0), new Vector3(10, 0, 0), 1));
});
test('buildings intercept fast projectiles but not segments ending before the wall', () => {
  const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  assert.ok(segmentBoxHit(new Vector3(-10, 0, 0), new Vector3(10, 0, 0), box));
  assert.ok(!segmentBoxHit(new Vector3(-10, 0, 0), new Vector3(-5, 0, 0), box));
});

test('first contact distinguishes cover from a drone in front of the wall', () => {
  const a = new Vector3(-10, 0, 0), b = new Vector3(10, 0, 0);
  const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  assert.equal(segmentBoxTime(a, b, box), .45);
  const near = new Vector3(-5, 0, 0), far = new Vector3(5, 0, 0);
  assert.ok(sweptSphereTime(a, b, near, near, 1) < segmentBoxTime(a, b, box));
  assert.ok(sweptSphereTime(a, b, far, far, 1) > segmentBoxTime(a, b, box));
});
