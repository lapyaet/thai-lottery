import { clamp01, fbm, smoothstep, valueNoise } from "@/lib/noise";

describe("noise", () => {
  it("stays within 0..1 and is deterministic", () => {
    for (let i = 0; i < 200; i++) {
      const x = i * 0.37 - 20;
      const y = i * 0.91 - 40;
      const n = valueNoise(x, y, 3);
      const f = fbm(x, y, 5, 3);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
      expect(valueNoise(x, y, 3)).toBe(n);
    }
  });

  it("changes with the seed and is continuous", () => {
    expect(fbm(1.3, 2.7, 5, 1)).not.toBe(fbm(1.3, 2.7, 5, 2));
    expect(Math.abs(valueNoise(5.5, 5.5) - valueNoise(5.5001, 5.5))).toBeLessThan(0.01);
  });

  it("clamps and smoothsteps", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });
});
