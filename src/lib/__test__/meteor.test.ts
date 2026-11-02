import { meteorState, nextMeteorDelay, spawnMeteor } from "@/lib/meteor";
import { mulberry32 } from "@/lib/tree";

describe("shooting stars", () => {
  it("appear only every few seconds", () => {
    const rnd = mulberry32(1);
    const delays = Array.from({ length: 200 }, () => nextMeteorDelay(rnd));
    expect(Math.min(...delays)).toBeGreaterThanOrEqual(3.5);
    expect(Math.max(...delays)).toBeLessThanOrEqual(11);
  });

  it("enter high in the sky and head downward", () => {
    const rnd = mulberry32(2);
    for (let i = 0; i < 100; i++) {
      const m = spawnMeteor(rnd);
      expect(m.y0).toBeGreaterThan(20);
      expect(Math.sin(m.angle)).toBeLessThan(0);
      expect(m.life).toBeGreaterThan(0.7);
    }
  });

  it("travel toward the opposite side of the sky from where they start", () => {
    const rnd = mulberry32(3);
    for (let i = 0; i < 100; i++) {
      const m = spawnMeteor(rnd);
      const end = meteorState(m, m.life);
      expect(Math.sign(end.x - m.x0)).toBe(-Math.sign(m.x0));
    }
  });

  it("flare in, then fade away completely", () => {
    const m = spawnMeteor(mulberry32(4));
    expect(meteorState(m, 0).alpha).toBe(0);
    expect(meteorState(m, m.life * 0.15).alpha).toBeGreaterThan(0.5);
    expect(meteorState(m, m.life).alpha).toBe(0);
    for (let t = 0; t <= m.life; t += 0.05) {
      const a = meteorState(m, t).alpha;
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  it("move steadily along their path", () => {
    const m = spawnMeteor(mulberry32(5));
    const a = meteorState(m, 0.2);
    const b = meteorState(m, 0.4);
    const c = meteorState(m, 0.6);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(Math.hypot(c.x - b.x, c.y - b.y), 5);
  });
});
