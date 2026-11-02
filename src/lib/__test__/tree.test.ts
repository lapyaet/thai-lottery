import {
  branchPaths,
  buildTree,
  CANOPY,
  FRUIT_COUNT,
  ITEM_EULER_ORDER,
  LEAF_COUNT,
} from "@/lib/tree";

const { leaves, fruits } = buildTree(7);

describe("buildTree", () => {
  it("creates the expected number of leaves and fruits", () => {
    expect(leaves).toHaveLength(LEAF_COUNT);
    expect(fruits).toHaveLength(FRUIT_COUNT);
  });

  it("is deterministic for a seed and varies between seeds", () => {
    expect(buildTree(7).leaves[0].home).toEqual(leaves[0].home);
    expect(buildTree(8).leaves[0].home).not.toEqual(leaves[0].home);
  });

  it("keeps everything above the ground and inside a sensible crown", () => {
    for (const item of [...leaves, ...fruits]) {
      expect(item.home[1]).toBeGreaterThan(1.5);
      expect(Math.abs(item.home[0])).toBeLessThan(3.6);
      expect(Math.abs(item.home[2])).toBeLessThan(3);
    }
  });

  it("orients leaves to droop outward with varied tilt and roll", () => {
    expect(ITEM_EULER_ORDER).toBe("YXZ");
    const pitches = leaves.map((l) => l.rotation[0]);
    expect(Math.min(...pitches)).toBeGreaterThanOrEqual(0.4);
    expect(Math.max(...pitches)).toBeLessThanOrEqual(2.6);
    expect(new Set(pitches.map((p) => p.toFixed(2))).size).toBeGreaterThan(100);
    for (const l of leaves) expect(Math.abs(l.rotation[2])).toBeLessThanOrEqual(0.45);
  });
});

describe("branchPaths", () => {
  it("starts with a tapering trunk and adds a branch per canopy blob", () => {
    const paths = branchPaths();
    expect(paths).toHaveLength(CANOPY.length + 1);
    expect(paths[0].r0).toBeGreaterThan(paths[0].r1);
    for (const path of paths) {
      expect(path.points.length).toBeGreaterThanOrEqual(4);
      expect(path.r0).toBeGreaterThan(path.r1);
    }
  });
});
