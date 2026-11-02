import { celestialDirection } from "@/lib/sky";

const len = (v: number[]) => Math.hypot(v[0], v[1], v[2]);

describe("celestialDirection", () => {
  it("returns a unit vector in front of the camera and above the horizon", () => {
    for (const night of [false, true]) {
      const d = celestialDirection(1440, 900, night);
      expect(len(d)).toBeCloseTo(1, 5);
      expect(d[2]).toBeLessThan(0);
      expect(d[1]).toBeGreaterThan(0);
    }
  });

  it("puts the sun left and the moon right of centre", () => {
    expect(celestialDirection(1440, 900, false)[0]).toBeLessThan(0);
    expect(celestialDirection(1440, 900, true)[0]).toBeGreaterThan(0);
  });

  it("keeps the body inside the horizontal view on narrow phones", () => {
    const [x, , z] = celestialDirection(390, 800, false);
    const angle = Math.atan(Math.abs(x) / Math.abs(z));
    const halfH = Math.atan(Math.tan((40 * Math.PI) / 360) * (390 / 800));
    expect(angle).toBeLessThan(halfH);
  });

  it("caps the offset on very wide screens", () => {
    const [x, , z] = celestialDirection(3000, 900, false);
    expect(Math.atan(Math.abs(x) / Math.abs(z))).toBeLessThanOrEqual(0.5 + 1e-9);
  });

  it("sits lower on tall screens than on wide ones", () => {
    expect(celestialDirection(390, 800, true)[1]).toBeLessThan(
      celestialDirection(1440, 900, true)[1],
    );
  });
});
