import {
  BOUNDS,
  createRabbits,
  type Rabbit,
  rabbitPose,
  stepRabbits,
} from "@/lib/rabbit";
import { mulberry32 } from "@/lib/tree";

function simulate(seed: number, seconds: number, onStep?: (rabbits: Rabbit[], t: number) => void) {
  const rnd = mulberry32(seed);
  const rabbits = createRabbits(rnd);
  const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) {
    stepRabbits(rabbits, dt, rnd);
    onStep?.(rabbits, t);
  }
  return rabbits;
}

describe("rabbit behaviour", () => {
  it("creates two playmates and a loner", () => {
    const rabbits = createRabbits(mulberry32(1));
    expect(rabbits).toHaveLength(3);
    expect(rabbits[0].buddy).toBe(1);
    expect(rabbits[1].buddy).toBe(0);
    expect(rabbits[2].buddy).toBe(-1);
    expect([rabbits[0].mode, rabbits[1].mode].sort()).toEqual(["chase", "flee"]);
  });

  it("stays inside the meadow and never sinks below the ground", () => {
    simulate(3, 90, (rabbits, t) => {
      for (const r of rabbits) {
        expect(r.x).toBeGreaterThanOrEqual(BOUNDS.minX - 1e-6);
        expect(r.x).toBeLessThanOrEqual(BOUNDS.maxX + 1e-6);
        expect(r.z).toBeGreaterThanOrEqual(BOUNDS.minZ - 1e-6);
        expect(r.z).toBeLessThanOrEqual(BOUNDS.maxZ + 1e-6);
        const pose = rabbitPose(r, t);
        expect(pose.y).toBeGreaterThanOrEqual(0);
        expect(pose.y).toBeLessThanOrEqual(0.5);
      }
    });
  });

  it("does everything a playful rabbit does", () => {
    const seen = new Set<string>();
    let leaped = false;
    simulate(5, 120, (rabbits) => {
      for (const r of rabbits) {
        seen.add(r.state);
        if (r.state === "hop" && r.binky) leaped = true;
      }
    });
    expect(seen).toEqual(new Set(["pause", "hop", "nibble", "rear"]));
    expect(leaped).toBe(true);
  });

  it("keeps the playmates close together", () => {
    let total = 0;
    let n = 0;
    simulate(8, 90, (rabbits) => {
      total += Math.hypot(rabbits[0].x - rabbits[1].x, rabbits[0].z - rabbits[1].z);
      n += 1;
    });
    const mean = total / n;
    // Random wandering in this patch would average roughly 4.5 m apart.
    expect(mean).toBeLessThan(3.6);
  });

  it("makes the playmates swap roles over time", () => {
    const roles = new Set<string>();
    simulate(2, 60, (rabbits) => roles.add(rabbits[0].mode));
    expect(roles).toEqual(new Set(["chase", "flee"]));
  });

  it("is deterministic for a seed", () => {
    const a = simulate(11, 20).map((r) => [r.x, r.z]);
    const b = simulate(11, 20).map((r) => [r.x, r.z]);
    expect(a).toEqual(b);
  });
});

describe("rabbitPose", () => {
  const rabbit = (): Rabbit => ({ ...createRabbits(mulberry32(1))[0], state: "hop", hopHeight: 0.2, hopT: 0 });

  it("leaves and lands on the ground, peaking mid-hop", () => {
    const r = rabbit();
    expect(rabbitPose(r, 0).y).toBe(0);
    r.hopT = 0.5;
    expect(rabbitPose(r, 0).y).toBeCloseTo(0.2);
    r.hopT = 1;
    expect(rabbitPose(r, 0).y).toBeCloseTo(0);
  });

  it("twists in the air only for a binky", () => {
    const r = rabbit();
    r.hopT = 0.5;
    expect(rabbitPose(r, 0).twist).toBe(0);
    r.binky = true;
    expect(rabbitPose(r, 0).twist).toBeGreaterThan(1);
  });

  it("lowers its head to nibble and rears up on its hind legs", () => {
    const nibbling = { ...rabbit(), state: "nibble" as const };
    expect(rabbitPose(nibbling, 0).headDown).toBeGreaterThan(0.3);
    const rearing = { ...rabbit(), state: "rear" as const, timer: 0.9 };
    expect(rabbitPose(rearing, 0).pitch).toBeGreaterThan(0.9);
  });
});
