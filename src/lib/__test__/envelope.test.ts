import {
  buildEnvelopes,
  createEnvelope,
  ENVELOPE_COUNT,
  fallCandidates,
  hangPose,
  LAND_POS,
  pickFallingIndex,
  REST_Y,
  stepEnvelope,
} from "@/lib/envelope";

const envelopes = buildEnvelopes();

describe("buildEnvelopes", () => {
  it("hangs many envelopes on the tree, deterministically", () => {
    expect(envelopes).toHaveLength(ENVELOPE_COUNT);
    expect(ENVELOPE_COUNT).toBeGreaterThanOrEqual(12);
    expect(buildEnvelopes()[3].home).toEqual(envelopes[3].home);
    expect(buildEnvelopes(5)[3].home).not.toEqual(envelopes[3].home);
  });

  it("keeps them up in the crown", () => {
    for (const e of envelopes) {
      expect(e.home[1]).toBeGreaterThan(1.8);
      expect(Math.abs(e.home[0])).toBeLessThan(4);
      expect(Math.abs(e.home[2])).toBeLessThan(3.2);
    }
  });

  it("puts several on the camera-facing front", () => {
    expect(envelopes.filter((e) => e.home[2] > 1).length).toBeGreaterThanOrEqual(4);
    expect(fallCandidates(envelopes).length).toBeGreaterThanOrEqual(3);
  });
});

describe("pickFallingIndex", () => {
  it("always picks a visible front envelope", () => {
    const candidates = fallCandidates(envelopes);
    for (let key = 0; key < 40; key++) {
      expect(candidates).toContain(pickFallingIndex(envelopes, key));
    }
  });

  it("is stable for a key and varies between keys", () => {
    expect(pickFallingIndex(envelopes, 4)).toBe(pickFallingIndex(envelopes, 4));
    const picks = new Set(Array.from({ length: 30 }, (_, k) => pickFallingIndex(envelopes, k)));
    expect(picks.size).toBeGreaterThanOrEqual(2);
  });
});

describe("hangPose", () => {
  it("hangs near home when calm", () => {
    for (let t = 0; t < 20; t += 0.41) {
      const p = hangPose(envelopes[0], t, 0);
      expect(Math.abs(p.x - envelopes[0].home[0])).toBeLessThan(0.05);
      expect(Math.abs(p.y - envelopes[0].home[1])).toBeLessThan(0.05);
    }
  });

  it("swings harder while the tree is shaken", () => {
    const spread = (shake: number) => {
      const rz = Array.from({ length: 300 }, (_, i) => hangPose(envelopes[0], i * 0.011, shake).rz);
      return Math.max(...rz) - Math.min(...rz);
    };
    expect(spread(1)).toBeGreaterThan(spread(0) + 0.2);
  });
});

describe("stepEnvelope", () => {
  const fall = (index = fallCandidates(envelopes)[0]) => {
    const e = createEnvelope(hangPose(envelopes[index], 0, 1));
    let t = 0;
    const heights: number[] = [];
    for (; t < 12 && !e.landed; t += 1 / 60) {
      stepEnvelope(e, 1 / 60, t);
      heights.push(e.y);
    }
    return { e, t, heights };
  };

  it("falls from the branches and lands flat within a few seconds", () => {
    const { e, t } = fall();
    expect(e.landed).toBe(true);
    expect(t).toBeGreaterThan(1);
    expect(t).toBeLessThan(8);
    expect(e.y).toBe(REST_Y);
    expect(e.rx).toBeCloseTo(-Math.PI / 2);
  });

  it("lands beside the boy whichever envelope fell", () => {
    for (const i of fallCandidates(envelopes)) {
      const { e } = fall(i);
      expect(Math.abs(e.x - LAND_POS[0])).toBeLessThan(0.6);
      expect(Math.abs(e.z - LAND_POS[2])).toBeLessThan(0.6);
    }
  });

  it("only ever moves downward and never goes below the ground", () => {
    const { heights } = fall();
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeLessThanOrEqual(heights[i - 1] + 1e-9);
      expect(heights[i]).toBeGreaterThanOrEqual(REST_Y);
    }
  });

  it("stops once landed", () => {
    const { e } = fall();
    const { x, y, z } = e;
    stepEnvelope(e, 1 / 60, 99);
    expect([e.x, e.y, e.z]).toEqual([x, y, z]);
  });
});
