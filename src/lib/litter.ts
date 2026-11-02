/**
 * Loose leaves and fruit that now and then drift off the tree. Purely
 * decorative: they never influence which ticket is generated.
 */

export type LitterKind = "leaf" | "fruit";

export type Faller = {
  kind: LitterKind;
  /** Index of the attached leaf/fruit this one came from (it stays hidden meanwhile). */
  source: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  /** Wind responsiveness: leaves are light, fruit is heavy. */
  sail: number;
  floor: number;
  bounce: number;
  landed: boolean;
  /** Seconds since it landed. */
  rested: number;
};

const LEAF_GRAVITY = 2.2;
const LEAF_TERMINAL = 1.5;
const FRUIT_GRAVITY = 9.5;
/** How long a fallen leaf/fruit lies on the grass before it fades away. */
export const REST_SECONDS = 5;

export function createFaller(
  kind: LitterKind,
  source: number,
  home: readonly [number, number, number],
  rotation: readonly [number, number, number],
  rnd: () => number,
): Faller {
  const leaf = kind === "leaf";
  return {
    kind,
    source,
    x: home[0],
    y: home[1],
    z: home[2],
    vx: 0,
    vy: 0,
    vz: 0,
    rx: rotation[0],
    ry: rotation[1],
    rz: rotation[2],
    spinX: (rnd() - 0.5) * (leaf ? 5 : 1.5),
    spinY: (rnd() - 0.5) * (leaf ? 4 : 1.5),
    spinZ: (rnd() - 0.5) * (leaf ? 5 : 1.5),
    sail: leaf ? 0.7 + rnd() * 0.9 : 0.1 + rnd() * 0.1,
    floor: leaf ? 0.02 + rnd() * 0.04 : 0.15,
    bounce: 0.35,
    landed: false,
    rested: 0,
  };
}

/** Advance one faller by `dt` seconds. `wind` pushes toward +x. */
export function stepFaller(f: Faller, dt: number, wind: number, time: number): void {
  if (f.landed) {
    f.rested += dt;
    return;
  }

  if (f.kind === "leaf") {
    f.vy = Math.max(f.vy - LEAF_GRAVITY * dt, -LEAF_TERMINAL);
    f.vx += wind * 2.4 * f.sail * dt;
    f.vx *= 1 - Math.min(1, 1.1 * dt);
    f.vz += Math.sin(time * 3 + f.sail * 7) * 0.9 * dt;
    f.vz *= 1 - Math.min(1, 1.4 * dt);
    f.x += Math.sin(time * 4 + f.spinX) * 0.3 * dt; // flutter side to side
  } else {
    f.vy -= FRUIT_GRAVITY * dt;
    f.vx += wind * 1.5 * f.sail * dt;
    f.vx *= 1 - Math.min(1, 0.3 * dt);
  }

  f.x += f.vx * dt;
  f.y += f.vy * dt;
  f.z += f.vz * dt;
  f.rx += f.spinX * dt;
  f.ry += f.spinY * dt;
  f.rz += f.spinZ * dt;

  if (f.y <= f.floor) {
    f.y = f.floor;
    if (f.kind === "fruit" && f.vy < -1.5) {
      f.vy = -f.vy * f.bounce;
      f.bounce *= 0.4;
      f.vx *= 0.6;
    } else {
      f.landed = true;
      f.vx = f.vy = f.vz = 0;
      f.spinX = f.spinY = f.spinZ = 0;
      if (f.kind === "leaf") {
        f.rx = Math.PI / 2; // lie flat
        f.rz = 0;
      }
    }
  }
}

/** Seconds until the next loose leaf/fruit: rare when calm, frequent while shaken. */
export function nextDropDelay(rnd: () => number, shake: number): number {
  const calm = 2.2 + rnd() * 3.8;
  return shake > 0.3 ? 0.08 + rnd() * 0.22 : calm;
}

/** Roughly one in six drops is a fruit; the rest are leaves. */
export function pickKind(rnd: () => number, shake: number): LitterKind {
  return rnd() < (shake > 0.3 ? 0.05 : 0.16) ? "fruit" : "leaf";
}

/** Fade-out scale 1..0 once a landed faller has rested long enough. */
export function litterScale(f: Faller): number {
  if (!f.landed) return 1;
  const fade = Math.min(1, Math.max(0, (REST_SECONDS - f.rested) / 1.2));
  return fade;
}

/** How far the attached leaf/fruit has regrown (0 hidden .. 1 full) `since` seconds after its faller vanished. */
export function regrow(since: number): number {
  return Math.min(1, Math.max(0, since / 1.8));
}
