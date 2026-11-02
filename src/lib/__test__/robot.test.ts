import {
  approachPose,
  blinkOpen,
  createPose,
  deriveMode,
  POSE_KEYS,
  robotPose,
  type RobotMode,
} from "@/lib/robot";

const MODES: RobotMode[] = [
  "idle",
  "listening",
  "sending",
  "thinking",
  "talking",
  "error",
  "wave",
];

describe("deriveMode", () => {
  it("lets chat status win over typing", () => {
    expect(deriveMode("error", true, null)).toBe("error");
    expect(deriveMode("thinking", true, "wave")).toBe("thinking");
    expect(deriveMode("talking", false, null)).toBe("talking");
  });

  it("falls back to transient, then listening, then idle", () => {
    expect(deriveMode("idle", true, "wave")).toBe("wave");
    expect(deriveMode("idle", true, null)).toBe("listening");
    expect(deriveMode("idle", false, null)).toBe("idle");
  });
});

describe("blinkOpen", () => {
  it("stays within 0..1 and is mostly open", () => {
    let open = 0;
    const samples = 2000;
    for (let i = 0; i < samples; i++) {
      const v = blinkOpen(i * 0.02);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      if (v === 1) open++;
    }
    expect(open / samples).toBeGreaterThan(0.9);
  });

  it("actually closes at least once per cycle", () => {
    let min = 1;
    for (let t = 0; t < 30; t += 0.01) min = Math.min(min, blinkOpen(t));
    expect(min).toBeLessThan(0.1);
  });
});

describe("robotPose", () => {
  it("returns finite numbers for every mode over time", () => {
    for (const mode of MODES) {
      for (let t = 0; t < 10; t += 0.37) {
        const pose = robotPose(mode, t);
        for (const key of POSE_KEYS) expect(Number.isFinite(pose[key])).toBe(true);
      }
    }
  });

  it("expresses each state", () => {
    expect(robotPose("thinking", 1).eyeScan).toBe(1);
    expect(robotPose("error", 1).alert).toBe(1);
    expect(robotPose("wave", 1).ok).toBe(1);
    expect(robotPose("wave", 1).rShoulderOut).toBeGreaterThan(1.8);
    expect(robotPose("listening", 1).headYaw).toBeGreaterThan(0.3);
    expect(robotPose("idle", 1).talk).toBe(0);
  });
});

describe("approachPose", () => {
  it("moves toward the target without overshooting and never snaps", () => {
    const current = createPose();
    const target = robotPose("error", 0);
    const before = Math.abs(target.alert - current.alert);
    approachPose(current, target, 1 / 60);
    const after = Math.abs(target.alert - current.alert);
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(0);
    for (let i = 0; i < 600; i++) approachPose(current, target, 1 / 60);
    expect(current.alert).toBeCloseTo(1, 3);
  });
});
