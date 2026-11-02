import { CANOPY, mulberry32 } from "@/lib/tree";
import type { Vec3 } from "@/lib/story";

/** How many golden envelopes hang on the tree. */
export const ENVELOPE_COUNT = 16;
/** Where the falling envelope lands, beside the boy. */
export const LAND_POS: Vec3 = [0.05, 0, 1.55];
/** Resting height of an envelope lying on the grass. */
export const REST_Y = 0.06;
/** Hover point while it opens: the middle of the view, close to the camera. */
export const OPEN_POS: Vec3 = [0.0, 3.3, 4.2];

export type HangingEnvelope = {
  home: Vec3;
  yaw: number;
  /** Size factor around 1. */
  scale: number;
  phase: number;
};

export type EnvelopePose = { x: number; y: number; z: number; rx: number; ry: number; rz: number };

/**
 * Envelopes hang just under the foliage surface. The first several are forced
 * to the camera-facing front so there are always plenty to see (and to drop).
 */
export function buildEnvelopes(seed = 21): HangingEnvelope[] {
  const rnd = mulberry32(seed);
  const frontBlobs = CANOPY.filter((b) => b.center[2] >= 0.25);
  const FRONT = 8;
  return Array.from({ length: ENVELOPE_COUNT }, (_, i) => {
    const front = i < FRONT;
    const pool = front ? frontBlobs : CANOPY;
    const blob = pool[Math.floor(rnd() * pool.length)];
    const theta = rnd() * Math.PI * 2;
    const up = rnd() * 1.1 - 0.65; // a little below the equator
    const r = Math.sqrt(1 - up * up);
    let dx = Math.cos(theta) * r;
    let dz = Math.sin(theta) * r;
    if (front) {
      // Face the camera.
      dz = Math.abs(dz) * 0.4 + 0.75;
      dx *= 0.7;
    }
    const len = Math.hypot(dx, up, dz);
    const home: Vec3 = [
      blob.center[0] + (dx / len) * blob.radius * 0.97,
      blob.center[1] + (up / len) * blob.radius * 0.9 - 0.1,
      blob.center[2] + (dz / len) * blob.radius * 0.97,
    ];
    return {
      home,
      yaw: Math.atan2(dx, dz) * 0.5 + (rnd() - 0.5) * 0.5,
      scale: 0.9 + rnd() * 0.25,
      phase: rnd() * Math.PI * 2,
    };
  });
}

/** Envelopes on the front of the tree, in clear view, that can be the one that falls. */
export function fallCandidates(envelopes: HangingEnvelope[]): number[] {
  return envelopes
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.home[2] > 1.0 && e.home[1] > 2.8 && e.home[1] < 5)
    .map(({ i }) => i);
}

/** Which envelope comes loose this time; stable for a given `key`, varies between keys. */
export function pickFallingIndex(envelopes: HangingEnvelope[], key: number): number {
  const candidates = fallCandidates(envelopes);
  const rnd = mulberry32(key * 7919 + 3);
  return candidates[Math.floor(rnd() * candidates.length)] ?? 0;
}

/** An envelope swinging from its string; swings wildly while the tree is shaken. */
export function hangPose(e: HangingEnvelope, time: number, shake: number): EnvelopePose {
  return {
    x: e.home[0] + Math.sin(time * 1.7 + e.phase) * 0.03 + Math.sin(time * 12 + e.phase) * 0.07 * shake,
    y: e.home[1] + Math.sin(time * 2.3 + e.phase) * 0.02 + Math.sin(time * 10 + e.phase) * 0.05 * shake,
    z: e.home[2],
    rx: Math.sin(time * 1.3 + e.phase) * 0.05,
    ry: e.yaw,
    rz: Math.sin(time * 1.9 + e.phase) * 0.09 + Math.sin(time * 11 + e.phase) * 0.28 * shake,
  };
}

export type Envelope = EnvelopePose & {
  vx: number;
  vy: number;
  vz: number;
  landed: boolean;
};

export function createEnvelope(from: EnvelopePose): Envelope {
  return { ...from, vx: 0.25, vy: 0, vz: 0, landed: false };
}

const GRAVITY = 5.5;
const TERMINAL = 2.2;

/** Advance the falling envelope: floaty descent, drifting toward the boy, then settling flat. */
export function stepEnvelope(e: Envelope, dt: number, time: number): void {
  if (e.landed) return;

  e.vy = Math.max(e.vy - GRAVITY * dt, -TERMINAL);
  // Drift toward the landing spot with a lazy sway.
  e.vx += ((LAND_POS[0] - e.x) * 1.6 - e.vx * 1.8) * dt;
  e.vz += ((LAND_POS[2] - e.z) * 1.6 - e.vz * 1.8) * dt;
  e.x += (e.vx + Math.sin(time * 3.2) * 0.5) * dt;
  e.y += e.vy * dt;
  e.z += e.vz * dt;

  // Flutter and tumble, easing toward lying flat (face up) near the ground.
  const near = Math.min(1, Math.max(0, 1 - (e.y - REST_Y) / 1.4));
  e.rx += ((-Math.PI / 2 - e.rx) * near * 4 + Math.sin(time * 4) * 1.4 * (1 - near)) * dt;
  e.rz += (Math.sin(time * 3.1) * 1.8 * (1 - near) - e.rz * near * 4) * dt;
  e.ry += (1.2 * (1 - near) - e.ry * near * 3) * dt;

  if (e.y <= REST_Y) {
    e.y = REST_Y;
    e.vx = e.vy = e.vz = 0;
    e.rx = -Math.PI / 2;
    e.rz = 0;
    e.landed = true;
  }
}
