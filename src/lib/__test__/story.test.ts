import {
  boyPose,
  doorOpen,
  HOUSE,
  HOUSE_YAW,
  INSIDE,
  OPEN_TIME,
  RAMP,
  RETURN_TIME,
  SHAKE_TIME,
  shakeAmount,
  SPOT,
  START,
  STEP_LENGTH,
  stridePhase,
  WALK_DISTANCE,
  WALK_SPEED,
  WALK_TIME,
  walkDistance,
  walkSpeed,
} from "@/lib/story";

const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

describe("story geometry", () => {
  it("puts the door on the side of the house that faces the tree", () => {
    const toStart = [START[0] - HOUSE[0], START[2] - HOUSE[2]];
    const facing = [Math.sin(HOUSE_YAW), Math.cos(HOUSE_YAW)];
    expect(toStart[0] * facing[0] + toStart[1] * facing[1]).toBeGreaterThan(1);
    expect(facing[0]).toBeGreaterThan(0);
  });

  it("starts the walk inside the house, behind the doorstep", () => {
    const toInside = [INSIDE[0] - HOUSE[0], INSIDE[2] - HOUSE[2]];
    const facing = [Math.sin(HOUSE_YAW), Math.cos(HOUSE_YAW)];
    const along = toInside[0] * facing[0] + toInside[1] * facing[1];
    expect(along).toBeLessThan(1.55); // inside the front wall (half the depth)
    expect(along).toBeGreaterThan(0);
  });

  it("has a sensible walk length", () => {
    expect(WALK_TIME).toBeGreaterThan(2);
    expect(WALK_TIME).toBeLessThan(7);
  });
});

describe("walkDistance and walkSpeed", () => {
  it("covers the whole path, starting and ending at rest", () => {
    expect(walkDistance(0)).toBe(0);
    expect(walkDistance(WALK_TIME)).toBeCloseTo(WALK_DISTANCE, 6);
    expect(walkDistance(WALK_TIME + 5)).toBeCloseTo(WALK_DISTANCE, 6);
    expect(walkSpeed(0)).toBe(0);
    expect(walkSpeed(WALK_TIME)).toBe(0);
  });

  it("speeds up, cruises and slows down", () => {
    expect(walkSpeed(RAMP / 2)).toBeCloseTo(WALK_SPEED / 2, 6);
    expect(walkSpeed(WALK_TIME / 2)).toBeCloseTo(WALK_SPEED, 6);
    expect(walkSpeed(WALK_TIME - RAMP / 2)).toBeCloseTo(WALK_SPEED / 2, 6);
  });

  it("never jumps: speed is continuous and position never goes backward", () => {
    let prevD = 0;
    let prevV = 0;
    for (let t = 0; t <= WALK_TIME + 0.2; t += 1 / 120) {
      const d = walkDistance(t);
      const v = walkSpeed(t);
      expect(d).toBeGreaterThanOrEqual(prevD - 1e-9);
      expect(d - prevD).toBeLessThanOrEqual(WALK_SPEED / 120 + 1e-9);
      expect(Math.abs(v - prevV)).toBeLessThan((WALK_SPEED / RAMP) * (1 / 120) + 1e-6);
      prevD = d;
      prevV = v;
    }
  });

  it("ties the stride to the ground covered, one step per step length", () => {
    expect(stridePhase(0)).toBe(0);
    expect(stridePhase(STEP_LENGTH)).toBeCloseTo(Math.PI);
    expect(stridePhase(STEP_LENGTH * 4)).toBeCloseTo(4 * Math.PI);
  });
});

describe("boyPose: walking out", () => {
  it("is hidden inside the house when idle", () => {
    expect(boyPose("idle", 0).visible).toBe(false);
  });

  it("starts out of sight, then steps through the doorway", () => {
    expect(boyPose("walking", 0).visible).toBe(false);
    expect(boyPose("walking", 0.3).visible).toBe(false);
    expect(boyPose("walking", 1.5).visible).toBe(true);
  });

  it("walks from the doorway to the tree and stops there", () => {
    const mid = boyPose("walking", WALK_TIME / 2);
    expect(mid.moving).toBe(true);
    expect(mid.arms).toBe("swing");
    expect(mid.speed).toBeCloseTo(1, 6);
    const end = boyPose("walking", WALK_TIME);
    expect(end.x).toBeCloseTo(SPOT[0], 5);
    expect(end.z).toBeCloseTo(SPOT[2], 5);
    expect(end.moving).toBe(false);
    expect(end.speed).toBe(0);
  });

  it("moves smoothly: small steps every frame, no teleports", () => {
    let prev = boyPose("walking", 0);
    for (let t = 1 / 60; t <= WALK_TIME; t += 1 / 60) {
      const p = boyPose("walking", t);
      expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThanOrEqual(WALK_SPEED / 60 + 1e-6);
      expect(Math.abs(angleDiff(p.yaw, prev.yaw))).toBeLessThan(0.2);
      expect(p.stride - prev.stride).toBeGreaterThanOrEqual(-1e-9);
      prev = p;
    }
  });

  it("turns to face the trunk as he arrives", () => {
    const early = boyPose("walking", 1.5).yaw;
    const arrived = boyPose("walking", WALK_TIME).yaw;
    expect(Math.abs(angleDiff(arrived, early))).toBeGreaterThan(0.5);
    expect(arrived).toBeCloseTo(boyPose("shaking", 0).yaw, 6);
  });
});

describe("boyPose: at the tree", () => {
  it("pushes the trunk while shaking, rocking back and forth", () => {
    const poses = [0.4, 0.5, 0.6, 0.7].map((t) => boyPose("shaking", t));
    for (const p of poses) {
      expect(p.arms).toBe("push");
      expect([p.x, p.z]).toEqual([SPOT[0], SPOT[2]]);
    }
    expect(Math.max(...poses.map((p) => p.rock))).toBeGreaterThan(0.3);
    expect(Math.min(...poses.map((p) => p.rock))).toBeLessThan(-0.3);
  });

  it("looks up when the envelope drops, then relaxes", () => {
    expect(boyPose("dropping", 0.5).lookUp).toBe(1);
    expect(boyPose("opening", 1).lookUp).toBeLessThan(0.5);
    expect(boyPose("done", 1).visible).toBe(true);
  });
});

describe("doorOpen", () => {
  it("opens before the boy steps out, then closes behind him", () => {
    expect(doorOpen("walking", 0)).toBe(0);
    expect(doorOpen("walking", 0.35)).toBe(1);
    expect(doorOpen("walking", 1.2)).toBe(1);
    expect(doorOpen("walking", 2.6)).toBe(0);
  });

  it("is already fully open by the time he reaches the wall", () => {
    // He crosses the wall line after about 0.7s.
    let tWall = 0;
    while (walkDistance(tWall) < 0.8) tWall += 0.01;
    expect(doorOpen("walking", tWall)).toBe(1);
  });

  it("is closed in every phase that does not involve the door", () => {
    for (const p of ["idle", "shaking", "dropping", "opening", "done"] as const) {
      expect(doorOpen(p, 1)).toBe(0);
    }
  });

  it("opens as the boy nears home and closes once he is inside", () => {
    expect(doorOpen("returning", 0.2)).toBe(0);
    expect(doorOpen("returning", WALK_TIME - 0.1)).toBe(1);
    expect(doorOpen("returning", RETURN_TIME)).toBeLessThan(0.01);
  });
});

describe("boyPose: returning home", () => {
  it("starts at the tree and walks back through the door", () => {
    const start = boyPose("returning", 0);
    expect([start.x, start.z]).toEqual([SPOT[0], SPOT[2]]);
    expect(start.visible).toBe(true);
    const end = boyPose("returning", WALK_TIME);
    expect(end.x).toBeCloseTo(INSIDE[0], 5);
    expect(end.z).toBeCloseTo(INSIDE[2], 5);
  });

  it("walks the reverse of the way out, facing away from the tree", () => {
    const out = boyPose("walking", WALK_TIME / 2);
    const home = boyPose("returning", WALK_TIME / 2);
    // Heading differs by about a half turn.
    expect(Math.abs(Math.abs(angleDiff(home.yaw, out.yaw)) - Math.PI)).toBeLessThan(0.2);
  });

  it("disappears once he has stepped into the doorway", () => {
    expect(boyPose("returning", WALK_TIME - 0.02).visible).toBe(false);
    expect(boyPose("returning", WALK_TIME / 2).visible).toBe(true);
  });

  it("moves smoothly the whole way", () => {
    let prev = boyPose("returning", 0);
    for (let t = 1 / 60; t <= WALK_TIME; t += 1 / 60) {
      const p = boyPose("returning", t);
      expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThanOrEqual(WALK_SPEED / 60 + 1e-6);
      expect(Math.abs(angleDiff(p.yaw, prev.yaw))).toBeLessThan(0.2);
      prev = p;
    }
  });

  it("does not shake the tree and takes a sensible time", () => {
    expect(shakeAmount("returning", 1)).toBe(0);
    expect(RETURN_TIME).toBeGreaterThan(WALK_TIME);
    expect(RETURN_TIME).toBeLessThan(8);
  });
});

describe("shakeAmount", () => {
  it("ramps up while shaking and fades once the envelope drops", () => {
    expect(shakeAmount("idle", 1)).toBe(0);
    expect(shakeAmount("walking", 1)).toBe(0);
    expect(shakeAmount("shaking", 0)).toBe(0);
    expect(shakeAmount("shaking", 1)).toBe(1);
    expect(shakeAmount("shaking", SHAKE_TIME)).toBeGreaterThan(0.5);
    expect(shakeAmount("dropping", 0)).toBeGreaterThan(0.3);
    expect(shakeAmount("dropping", 1)).toBe(0);
    expect(shakeAmount("done", 1)).toBe(0);
  });
});

it("has a positive opening duration", () => {
  expect(OPEN_TIME).toBeGreaterThan(1);
});
