/**
 * The timeline of the lucky-tree story: where the boy is, how far the door is
 * open and how hard the tree shakes at time `t` in each phase. Pure functions
 * so the 3D scene only has to render what these return.
 */

export type StoryPhase =
  | "idle"
  | "walking"
  | "shaking"
  | "dropping"
  | "opening"
  | "done"
  | "returning";

export type Vec3 = [number, number, number];

/** House centre on the ground; its door faces the tree. */
export const HOUSE: Vec3 = [-5.5, 0, -3.5];
/** Rotation about Y that turns the house's +z (door side) toward the tree. */
export const HOUSE_YAW = Math.atan2(0 - HOUSE[0], 0.7 - HOUSE[2]);
/** Where the boy appears: just outside the door. */
export const DOOR_DISTANCE = 1.95;
export const START: Vec3 = [
  HOUSE[0] + Math.sin(HOUSE_YAW) * DOOR_DISTANCE,
  0,
  HOUSE[2] + Math.cos(HOUSE_YAW) * DOOR_DISTANCE,
];
/** Where he stands to shake the tree (in front of the trunk, on the left). */
export const SPOT: Vec3 = [-0.6, 0, 0.78];

/** Unit vector pointing from the door into the house. */
const INTO_HOUSE: [number, number] = [-Math.sin(HOUSE_YAW), -Math.cos(HOUSE_YAW)];
/** A spot just inside the doorway: the walk starts and ends here, out of sight. */
export const INSIDE: Vec3 = [START[0] + INTO_HOUSE[0] * 1.2, 0, START[2] + INTO_HOUSE[1] * 1.2];
/** Distance from `INSIDE` at which the boy steps through the wall line. */
const THRESHOLD = 0.8;

export const WALK_SPEED = 1.7;
/** Seconds to speed up from standing (and to slow down to a stop). */
export const RAMP = 0.55;
/** Ground covered by one footstep; the stride is driven by distance so feet never skate. */
export const STEP_LENGTH = 0.68;
export const WALK_DISTANCE = Math.hypot(SPOT[0] - INSIDE[0], SPOT[2] - INSIDE[2]);
export const WALK_TIME = WALK_DISTANCE / WALK_SPEED + RAMP;
export const SHAKE_TIME = 2.6;
/** Time after landing before the story moves on to opening. */
export const LAND_PAUSE = 0.7;
export const OPEN_TIME = 2.6;
/** The whole walk home, plus the door closing behind him. */
export const RETURN_TIME = WALK_TIME + 0.7;

const WALK_YAW = Math.atan2(SPOT[0] - INSIDE[0], SPOT[2] - INSIDE[2]);
/** Heading for the walk home (the reverse of the walk out). */
const HOME_YAW = WALK_YAW + Math.PI;
/** Facing the trunk from the shaking spot. */
const TRUNK_YAW = Math.atan2(0 - SPOT[0], 0 - SPOT[2]);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => clamp01(t) ** 2 * (3 - 2 * clamp01(t));

/** Interpolate two headings along the shorter way round. */
function lerpAngle(a: number, b: number, t: number): number {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * t;
}

/**
 * Distance walked `t` seconds after setting off: speeds up smoothly, cruises,
 * then eases to a stop, so there are no sudden jumps in speed.
 */
export function walkDistance(t: number): number {
  const v = WALK_SPEED;
  const r = RAMP;
  const T = WALK_TIME;
  const D = WALK_DISTANCE;
  if (t <= 0) return 0;
  if (t < r) return 0.5 * (v / r) * t * t;
  if (t < T - r) return 0.5 * v * r + v * (t - r);
  if (t < T) return D - 0.5 * (v / r) * (T - t) ** 2;
  return D;
}

/** Walking speed in m/s at time `t` (the derivative of `walkDistance`). */
export function walkSpeed(t: number): number {
  const v = WALK_SPEED;
  const r = RAMP;
  const T = WALK_TIME;
  if (t <= 0 || t >= T) return 0;
  if (t < r) return (v * t) / r;
  if (t < T - r) return v;
  return (v * (T - t)) / r;
}

/** Foot-cycle phase in radians: one footstep per `STEP_LENGTH` of ground covered. */
export function stridePhase(distance: number): number {
  return (distance * Math.PI) / STEP_LENGTH;
}

export type BoyPose = {
  visible: boolean;
  x: number;
  z: number;
  yaw: number;
  /** True while walking; drives the stride. */
  moving: boolean;
  /** Foot-cycle phase in radians (driven by distance walked). */
  stride: number;
  /** 0 standing .. 1 full walking speed; scales the swing of arms and legs. */
  speed: number;
  arms: "swing" | "push" | "down";
  /** Forward/back rocking while pushing the trunk, -1..1. */
  rock: number;
  /** Head tilt: 0 forward, 1 looking up at the tree. */
  lookUp: number;
};

export function boyPose(phase: StoryPhase, t: number): BoyPose {
  const base: BoyPose = {
    visible: true,
    x: SPOT[0],
    z: SPOT[2],
    yaw: TRUNK_YAW,
    moving: false,
    stride: 0,
    speed: 0,
    arms: "down",
    rock: 0,
    lookUp: 0,
  };

  switch (phase) {
    case "idle":
      return { ...base, visible: false, x: INSIDE[0], z: INSIDE[2], yaw: WALK_YAW };
    case "walking": {
      const d = walkDistance(t);
      const f = d / WALK_DISTANCE;
      const remaining = WALK_DISTANCE - d;
      return {
        ...base,
        // Hidden behind the wall until he steps through the doorway.
        visible: d >= THRESHOLD,
        x: INSIDE[0] + (SPOT[0] - INSIDE[0]) * f,
        z: INSIDE[2] + (SPOT[2] - INSIDE[2]) * f,
        // Turns to face the trunk over the last stretch.
        yaw: lerpAngle(WALK_YAW, TRUNK_YAW, smooth(1 - remaining / 1.1)),
        moving: t < WALK_TIME,
        stride: stridePhase(d),
        speed: walkSpeed(t) / WALK_SPEED,
        arms: t < WALK_TIME ? "swing" : "push",
      };
    }
    case "shaking":
      return { ...base, arms: "push", rock: Math.sin(t * 13) * clamp01(t / 0.25) };
    case "dropping":
      return { ...base, arms: "down", lookUp: clamp01(t / 0.4) };
    case "returning": {
      const d = walkDistance(t);
      const f = d / WALK_DISTANCE;
      const remaining = WALK_DISTANCE - d;
      return {
        ...base,
        // Out of sight once he has stepped through the doorway.
        visible: remaining > THRESHOLD - 0.05,
        x: SPOT[0] + (INSIDE[0] - SPOT[0]) * f,
        z: SPOT[2] + (INSIDE[2] - SPOT[2]) * f,
        // Turns away from the trunk as he sets off.
        yaw: lerpAngle(TRUNK_YAW, HOME_YAW, smooth(t / 0.5)),
        moving: t < WALK_TIME,
        stride: stridePhase(d),
        speed: walkSpeed(t) / WALK_SPEED,
        arms: "swing",
      };
    }
    default:
      return { ...base, arms: "down", lookUp: 0.2 };
  }
}

/**
 * Door opening 0 (closed) .. 1 (open). It opens as the boy steps out and closes
 * behind him; on the way home it opens as he approaches and closes once he is in.
 */
export function doorOpen(phase: StoryPhase, t: number): number {
  if (phase === "walking") {
    if (t < 0.35) return t / 0.35;
    if (t < 1.7) return 1;
    return clamp01(1 - (t - 1.7) / 0.6);
  }
  if (phase === "returning") {
    if (t >= WALK_TIME) return clamp01(1 - (t - WALK_TIME) / 0.6);
    const remaining = WALK_DISTANCE - walkDistance(t);
    return clamp01((2.6 - remaining) / 0.6);
  }
  return 0;
}

/** How hard the tree shakes, 0..1. */
export function shakeAmount(phase: StoryPhase, t: number): number {
  if (phase === "shaking") return clamp01(t / 0.3) * (t > SHAKE_TIME - 0.3 ? 0.85 : 1);
  if (phase === "dropping") return clamp01(1 - t / 0.7) * 0.6;
  return 0;
}
