/**
 * Shooting stars for the night sky. A meteor streaks across the upper sky for
 * about a second; they appear every few seconds at random. Pure functions so
 * the renderer only has to draw what these return.
 */

export type Meteor = {
  /** Start position in view space (x right, y up), in sky units. */
  x0: number;
  y0: number;
  /** Direction of travel in radians (0 = right, negative = down-right). */
  angle: number;
  speed: number;
  life: number;
  /** Streak length. */
  length: number;
};

export const METEOR_LIFE_MIN = 0.8;

/** Seconds until the next shooting star. */
export function nextMeteorDelay(rnd: () => number): number {
  return 3.5 + rnd() * 7.5;
}

/** A new meteor that enters near the top of the view and streaks down across it. */
export function spawnMeteor(rnd: () => number): Meteor {
  const fromRight = rnd() < 0.5;
  const dip = 0.35 + rnd() * 0.35;
  return {
    x0: (fromRight ? 1 : -1) * (14 + rnd() * 22),
    y0: 24 + rnd() * 16,
    // Heading down and toward the other side.
    angle: fromRight ? Math.PI + dip : -dip,
    speed: 55 + rnd() * 35,
    life: METEOR_LIFE_MIN + rnd() * 0.5,
    length: 12 + rnd() * 10,
  };
}

export type MeteorState = { x: number; y: number; alpha: number };

/** Where the meteor's head is, and how bright, `t` seconds after it appeared. */
export function meteorState(m: Meteor, t: number): MeteorState {
  const u = Math.min(1, Math.max(0, t / m.life));
  // Quick flare in, long fade out.
  const alpha = Math.min(1, u * 8) * (1 - u) ** 1.5;
  return {
    x: m.x0 + Math.cos(m.angle) * m.speed * t,
    y: m.y0 + Math.sin(m.angle) * m.speed * t,
    alpha,
  };
}
