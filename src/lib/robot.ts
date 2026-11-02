import type { ChatStatus } from "@/types/chat.type";

export type RobotMode =
  | "idle"
  | "listening"
  | "sending"
  | "thinking"
  | "talking"
  | "error"
  | "wave";

/**
 * Every animated number of the robot. Angles are in radians; arm values are
 * "forward raise" and "outward raise" so left and right share the same sign.
 */
export type Pose = {
  bob: number;
  bodyTilt: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  lShoulderFwd: number;
  lShoulderOut: number;
  lElbow: number;
  rShoulderFwd: number;
  rShoulderOut: number;
  rElbow: number;
  /** 0 closed, 1 fully open (before blinking). */
  eyeOpen: number;
  /** 0 bars, 1 scanning dots. */
  eyeScan: number;
  /** 0 bars, 1 happy squint. */
  eyeSmile: number;
  /** Mouth bar height while talking. */
  talk: number;
  /** 0..1 how much of the light turns red / green. */
  alert: number;
  ok: number;
  antennaGlow: number;
  /** Floating particles and base ring strength. */
  particles: number;
  ring: number;
};

export const POSE_KEYS = [
  "bob",
  "bodyTilt",
  "headYaw",
  "headPitch",
  "headRoll",
  "lShoulderFwd",
  "lShoulderOut",
  "lElbow",
  "rShoulderFwd",
  "rShoulderOut",
  "rElbow",
  "eyeOpen",
  "eyeScan",
  "eyeSmile",
  "talk",
  "alert",
  "ok",
  "antennaGlow",
  "particles",
  "ring",
] as const satisfies readonly (keyof Pose)[];

export function createPose(): Pose {
  return robotPose("idle", 0);
}

/** Which robot behaviour fits the conversation right now. */
export function deriveMode(
  status: ChatStatus,
  typing: boolean,
  transient: RobotMode | null,
): RobotMode {
  if (status === "error") return "error";
  if (status === "thinking") return "thinking";
  if (status === "talking") return "talking";
  if (transient) return transient;
  return typing ? "listening" : "idle";
}

const BLINK_GAPS = [3.1, 2.4, 4.2, 2.8, 3.7, 2.2, 4.6];
const BLINK_LEN = 0.18;
const BLINK_CYCLE = BLINK_GAPS.reduce((a, b) => a + b, 0);

/** Eye openness multiplier: 1 most of the time, a quick dip every 2-5 s. */
export function blinkOpen(t: number): number {
  let local = ((t % BLINK_CYCLE) + BLINK_CYCLE) % BLINK_CYCLE;
  for (const gap of BLINK_GAPS) {
    if (local < gap - BLINK_LEN) return 1;
    if (local < gap) {
      const u = (local - (gap - BLINK_LEN)) / BLINK_LEN;
      return 1 - Math.sin(u * Math.PI);
    }
    local -= gap;
  }
  return 1;
}

const sin = Math.sin;

/** The pose the robot is aiming for in `mode` at time `t` (seconds). */
export function robotPose(mode: RobotMode, t: number): Pose {
  const pose: Pose = {
    bob: 0.06 * sin(t * 1.6),
    bodyTilt: 0.03 * sin(t * 0.8),
    headYaw: 0.25 * sin(t * 0.4),
    headPitch: 0.05 * sin(t * 0.6),
    headRoll: 0,
    lShoulderFwd: 0.1 + 0.05 * sin(t * 1.2),
    lShoulderOut: 0.25 + 0.04 * sin(t * 1.2),
    lElbow: 0.3,
    rShoulderFwd: 0.1 + 0.05 * sin(t * 1.2 + 1.5),
    rShoulderOut: 0.25 + 0.04 * sin(t * 1.2 + 1.5),
    rElbow: 0.3,
    eyeOpen: 1,
    eyeScan: 0,
    eyeSmile: 0,
    talk: 0,
    alert: 0,
    ok: 0,
    antennaGlow: 0.55 + 0.2 * sin(t * 2),
    particles: 0.3,
    ring: 0.35 + 0.1 * sin(t * 2),
  };

  switch (mode) {
    case "listening":
      pose.headYaw = 0.45 + 0.03 * sin(t * 2);
      pose.headPitch = -0.05;
      pose.headRoll = 0.1;
      pose.bodyTilt = 0.1;
      pose.eyeOpen = 1.15;
      pose.antennaGlow = 0.95;
      pose.ring = 0.6;
      break;
    case "sending":
      pose.headPitch = 0.2 + 0.2 * sin(t * 10);
      pose.eyeSmile = 0.5;
      pose.antennaGlow = 1;
      pose.ring = 0.8;
      break;
    case "thinking":
      pose.headYaw = 0.35 * sin(t * 1.4);
      pose.headPitch = -0.12;
      pose.headRoll = 0.08 * sin(t * 0.9);
      pose.rShoulderFwd = 1.25;
      pose.rShoulderOut = 0.1;
      pose.rElbow = 1.9;
      pose.eyeScan = 1;
      pose.antennaGlow = 0.65 + 0.35 * sin(t * 9);
      pose.particles = 1;
      pose.ring = 0.7 + 0.2 * sin(t * 6);
      break;
    case "talking": {
      const burst = Math.abs(sin(t * 14) * sin(t * 5.3));
      pose.headPitch = 0.06 * sin(t * 7);
      pose.headYaw = 0.12 * sin(t * 1.3);
      pose.lShoulderFwd = 0.5 + 0.4 * sin(t * 3.1);
      pose.lShoulderOut = 0.55 + 0.2 * sin(t * 3.1);
      pose.lElbow = 0.9 + 0.3 * sin(t * 3.1 + 1);
      pose.rShoulderFwd = 0.5 + 0.4 * sin(t * 3.1 + Math.PI);
      pose.rShoulderOut = 0.55 + 0.2 * sin(t * 3.1 + Math.PI);
      pose.rElbow = 0.9 + 0.3 * sin(t * 3.1 + 1 + Math.PI);
      pose.eyeSmile = 0.6;
      pose.talk = 0.2 + 0.8 * burst;
      pose.antennaGlow = 0.7 + 0.3 * burst;
      pose.ring = 0.6 + 0.3 * burst;
      break;
    }
    case "error":
      pose.headYaw = 0.3 * sin(t * 14);
      pose.headPitch = 0.1;
      pose.lShoulderFwd = 0;
      pose.rShoulderFwd = 0;
      pose.lShoulderOut = 0.1;
      pose.rShoulderOut = 0.1;
      pose.lElbow = 0.1;
      pose.rElbow = 0.1;
      pose.alert = 1;
      pose.antennaGlow = 0.6 + 0.4 * Math.abs(sin(t * 8));
      pose.ring = 0.7;
      break;
    case "wave":
      pose.headRoll = 0.1;
      pose.rShoulderFwd = 0.2;
      pose.rShoulderOut = 2.3 + 0.3 * sin(t * 9);
      pose.rElbow = 0.5;
      pose.eyeSmile = 1;
      pose.ok = 1;
      pose.antennaGlow = 0.9;
      pose.ring = 0.7;
      break;
    default:
      break;
  }
  return pose;
}

/** Move `current` toward `target` in place; frame-rate independent so states never snap. */
export function approachPose(
  current: Pose,
  target: Pose,
  dt: number,
  rate = 7,
): Pose {
  const k = 1 - Math.exp(-rate * dt);
  for (const key of POSE_KEYS) {
    current[key] += (target[key] - current[key]) * k;
  }
  return current;
}
