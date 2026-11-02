import {
  createFaller,
  litterScale,
  nextDropDelay,
  pickKind,
  REST_SECONDS,
  regrow,
  stepFaller,
} from "@/lib/litter";
import { mulberry32 } from "@/lib/tree";

const home = [0.5, 4, 0.3] as const;
const rotation = [1, 0.5, 0] as const;

const drop = (kind: "leaf" | "fruit", wind: number, seed = 1, seconds = 12) => {
  const rnd = mulberry32(seed);
  const f = createFaller(kind, 3, home, rotation, rnd);
  let t = 0;
  for (; t < seconds && !f.landed; t += 1 / 60) stepFaller(f, 1 / 60, wind, t);
  return { f, t };
};

describe("stepFaller", () => {
  it("falls from the tree and comes to rest on the ground", () => {
    for (const kind of ["leaf", "fruit"] as const) {
      const { f } = drop(kind, 0);
      expect(f.landed).toBe(true);
      expect(f.y).toBeLessThan(0.3);
      expect(f.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("fruit falls faster than a leaf", () => {
    expect(drop("fruit", 0).t).toBeLessThan(drop("leaf", 0).t);
  });

  it("wind carries leaves further than fruit", () => {
    const leaf = drop("leaf", 1).f;
    const fruit = drop("fruit", 1).f;
    expect(leaf.x - home[0]).toBeGreaterThan(fruit.x - home[0]);
    expect(leaf.x).toBeGreaterThan(drop("leaf", 0).f.x + 0.3);
  });

  it("lies flat and still once landed, counting rest time", () => {
    const { f } = drop("leaf", 0);
    expect(f.rx).toBeCloseTo(Math.PI / 2);
    const { x, y, z } = f;
    stepFaller(f, 0.5, 1, 99);
    expect([f.x, f.y, f.z]).toEqual([x, y, z]);
    expect(f.rested).toBeCloseTo(0.5);
  });

  it("remembers which attached leaf/fruit it came from", () => {
    expect(drop("leaf", 0).f.source).toBe(3);
  });
});

describe("scheduling", () => {
  it("drops are rare when calm and frequent when shaken", () => {
    const rnd = mulberry32(5);
    const calm = Array.from({ length: 50 }, () => nextDropDelay(rnd, 0));
    const shaken = Array.from({ length: 50 }, () => nextDropDelay(rnd, 1));
    expect(Math.min(...calm)).toBeGreaterThan(2);
    expect(Math.max(...shaken)).toBeLessThan(0.5);
  });

  it("mostly drops leaves, sometimes fruit", () => {
    const rnd = mulberry32(9);
    const kinds = Array.from({ length: 400 }, () => pickKind(rnd, 0));
    const fruit = kinds.filter((k) => k === "fruit").length;
    expect(fruit).toBeGreaterThan(20);
    expect(fruit).toBeLessThan(120);
  });
});

describe("fading and regrowing", () => {
  it("a landed faller fades out after resting", () => {
    const { f } = drop("leaf", 0);
    expect(litterScale(f)).toBe(1);
    f.rested = REST_SECONDS - 0.6;
    expect(litterScale(f)).toBeCloseTo(0.5);
    f.rested = REST_SECONDS + 1;
    expect(litterScale(f)).toBe(0);
    expect(litterScale({ ...f, landed: false })).toBe(1);
  });

  it("the attached leaf regrows smoothly", () => {
    expect(regrow(-1)).toBe(0);
    expect(regrow(0.9)).toBeCloseTo(0.5);
    expect(regrow(5)).toBe(1);
  });
});
