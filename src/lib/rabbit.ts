/**
 * Rabbit behaviour for the meadow: hopping, chasing each other, rearing up to
 * look around, nibbling and the odd joyful leap ("binky"). Pure functions so
 * the 3D model only has to render what these return.
 */

export type RabbitState = "pause" | "hop" | "nibble" | "rear";
export type RabbitMode = "wander" | "chase" | "flee";

export type Rabbit = {
  id: number;
  x: number;
  z: number;
  yaw: number;
  state: RabbitState;
  mode: RabbitMode;
  /** Id of the rabbit this one plays with, or -1. */
  buddy: number;
  /** Seconds left in the current pause/nibble/rear. */
  timer: number;
  /** Progress through the current hop, 0..1. */
  hopT: number;
  hopDuration: number;
  hopHeight: number;
  hopFrom: [number, number];
  hopTo: [number, number];
  /** True for a leap with a mid-air twist. */
  binky: boolean;
  target: [number, number];
  /** Seconds until playmates swap roles (chaser/chased). */
  roleTimer: number;
};

/** The patch of meadow the rabbits roam (in front of the tree, clear of the boy's path). */
export const BOUNDS = { minX: -2.6, maxX: 5.0, minZ: 2.4, maxZ: 5.8 };
const HOP_DISTANCE = 0.62;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const dist = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz);

function randomPoint(rnd: () => number): [number, number] {
  return [
    BOUNDS.minX + rnd() * (BOUNDS.maxX - BOUNDS.minX),
    BOUNDS.minZ + rnd() * (BOUNDS.maxZ - BOUNDS.minZ),
  ];
}

/** Two playmates (one chasing the other) and a solitary nibbler. */
export function createRabbits(rnd: () => number): Rabbit[] {
  const make = (id: number, mode: RabbitMode, buddy: number): Rabbit => {
    const [x, z] = randomPoint(rnd);
    return {
      id,
      x,
      z,
      yaw: rnd() * Math.PI * 2,
      state: "pause",
      mode,
      buddy,
      timer: rnd() * 0.8,
      hopT: 0,
      hopDuration: 0.42,
      hopHeight: 0.2,
      hopFrom: [x, z],
      hopTo: [x, z],
      binky: false,
      target: randomPoint(rnd),
      roleTimer: 6 + rnd() * 6,
    };
  };
  return [make(0, "chase", 1), make(1, "flee", 0), make(2, "wander", -1)];
}

function startHop(r: Rabbit, tx: number, tz: number, rnd: () => number, binky: boolean) {
  const dx = tx - r.x;
  const dz = tz - r.z;
  const len = Math.hypot(dx, dz) || 1;
  const step = Math.min(HOP_DISTANCE * (binky ? 1.25 : 0.85 + rnd() * 0.3), len);
  r.hopFrom = [r.x, r.z];
  r.hopTo = [
    clamp(r.x + (dx / len) * step, BOUNDS.minX, BOUNDS.maxX),
    clamp(r.z + (dz / len) * step, BOUNDS.minZ, BOUNDS.maxZ),
  ];
  r.hopT = 0;
  r.binky = binky;
  r.hopDuration = binky ? 0.62 : 0.4 + rnd() * 0.08;
  r.hopHeight = binky ? 0.42 : 0.17 + rnd() * 0.07;
  r.state = "hop";
}

function decide(r: Rabbit, others: Rabbit[], rnd: () => number) {
  const buddy = others.find((o) => o.id === r.buddy);

  if (buddy && r.mode === "chase") {
    const d = dist(r.x, r.z, buddy.x, buddy.z);
    if (d < 0.8) {
      // Caught up: celebrate with a leap or a pause.
      if (rnd() < 0.5) startHop(r, r.x + (rnd() - 0.5) * 2, r.z + (rnd() - 0.5) * 2, rnd, true);
      else {
        r.state = "pause";
        r.timer = 0.3 + rnd() * 0.5;
      }
      return;
    }
    startHop(r, buddy.x, buddy.z, rnd, false);
    return;
  }

  if (buddy && r.mode === "flee") {
    const d = dist(r.x, r.z, buddy.x, buddy.z);
    if (d < 2.4) {
      // Dart away from the chaser, then loop back toward open space.
      const [cx, cz] = [(BOUNDS.minX + BOUNDS.maxX) / 2, (BOUNDS.minZ + BOUNDS.maxZ) / 2];
      const away = [r.x - buddy.x, r.z - buddy.z];
      const tx = r.x + away[0] * 2 + (cx - r.x) * 0.25 + (rnd() - 0.5);
      const tz = r.z + away[1] * 2 + (cz - r.z) * 0.25 + (rnd() - 0.5);
      startHop(r, tx, tz, rnd, rnd() < 0.12);
      return;
    }
  }

  const roll = rnd();
  if (roll < 0.55) {
    if (dist(r.x, r.z, r.target[0], r.target[1]) < 0.6) r.target = randomPoint(rnd);
    startHop(r, r.target[0], r.target[1], rnd, false);
  } else if (roll < 0.8) {
    r.state = "nibble";
    r.timer = 1.2 + rnd() * 1.8;
  } else if (roll < 0.92) {
    r.state = "rear";
    r.timer = 1 + rnd() * 0.8;
  } else {
    startHop(r, r.x + (rnd() - 0.5) * 3, r.z + (rnd() - 0.5) * 3, rnd, true);
  }
}

/** Advance every rabbit by `dt` seconds. */
export function stepRabbits(rabbits: Rabbit[], dt: number, rnd: () => number): void {
  for (const r of rabbits) {
    r.roleTimer -= dt;
    if (r.roleTimer <= 0 && r.buddy >= 0) {
      // Swap who chases whom.
      r.mode = r.mode === "chase" ? "flee" : "chase";
      r.roleTimer = 7 + rnd() * 6;
    }

    if (r.state === "hop") {
      r.hopT = Math.min(1, r.hopT + dt / r.hopDuration);
      const e = r.hopT;
      r.x = r.hopFrom[0] + (r.hopTo[0] - r.hopFrom[0]) * e;
      r.z = r.hopFrom[1] + (r.hopTo[1] - r.hopFrom[1]) * e;
      const want = Math.atan2(r.hopTo[0] - r.hopFrom[0], r.hopTo[1] - r.hopFrom[1]);
      const diff = Math.atan2(Math.sin(want - r.yaw), Math.cos(want - r.yaw));
      r.yaw += diff * Math.min(1, dt * 12);
      if (r.hopT >= 1) {
        r.state = "pause";
        r.binky = false;
        r.timer = r.mode === "wander" ? 0.12 + rnd() * 0.3 : 0.04 + rnd() * 0.12;
      }
      continue;
    }

    r.timer -= dt;
    if (r.timer <= 0) decide(r, rabbits, rnd);
  }
}

export type RabbitPose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** Body pitch: positive tilts the nose up. */
  pitch: number;
  /** Mid-air twist about the vertical axis (binky). */
  twist: number;
  /** Head pitch: positive lowers the head to nibble. */
  headDown: number;
  /** 0 folded .. 1 stretched out (hind legs push, front legs reach). */
  stretch: number;
  /** Ear angle offset (alert vs relaxed). */
  ears: number;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

export function rabbitPose(r: Rabbit, time: number): RabbitPose {
  const base: RabbitPose = {
    x: r.x,
    y: 0,
    z: r.z,
    yaw: r.yaw,
    pitch: 0,
    twist: 0,
    headDown: 0,
    stretch: 0,
    ears: 0.15 + Math.sin(time * 1.3 + r.id) * 0.05,
  };

  switch (r.state) {
    case "hop": {
      const u = r.hopT;
      const arc = 4 * u * (1 - u);
      return {
        ...base,
        y: r.hopHeight * arc,
        // Nose up at take-off, nose down on landing.
        pitch: (0.5 - u) * 0.9 * Math.min(1, arc * 2),
        twist: r.binky ? Math.sin(Math.PI * u) * 1.4 : 0,
        stretch: Math.sin(Math.PI * u),
        ears: -0.25 * arc + 0.1,
      };
    }
    case "nibble":
      return {
        ...base,
        headDown: 0.55 + Math.sin(time * 9 + r.id * 2) * 0.18,
        ears: 0.05,
      };
    case "rear": {
      const k = smooth(Math.min(1, Math.max(0, 1 - Math.abs(r.timer - 0.9) / 0.5)));
      return { ...base, pitch: 1.05 * Math.max(0.0, Math.min(1, k * 1.4)), ears: 0.4 };
    }
    default:
      return base;
  }
}
