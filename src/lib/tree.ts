/**
 * Layout and falling physics for the lucky tree. Pure functions so the 3D
 * scene stays a thin renderer and this logic can be unit tested.
 */

export type Vec3 = [number, number, number];

export type Blob = { center: Vec3; radius: number };

/** Overlapping spheres that make up the tree crown. */
export const CANOPY: Blob[] = [
  { center: [0, 4.2, 0], radius: 1.5 },
  { center: [-1.5, 3.6, 0.3], radius: 1.15 },
  { center: [1.5, 3.5, -0.2], radius: 1.15 },
  { center: [0.3, 5.1, 0.1], radius: 1.0 },
  { center: [-0.9, 4.6, -0.9], radius: 1.0 },
  { center: [1.0, 4.3, 0.95], radius: 1.05 },
  { center: [-0.5, 3.3, 1.0], radius: 0.9 },
  { center: [-2.3, 3.1, -0.3], radius: 0.8 },
  { center: [2.3, 3.0, 0.2], radius: 0.8 },
  { center: [0.6, 5.7, -0.2], radius: 0.6 },
  { center: [-1.2, 4.9, 0.7], radius: 0.8 },
];

export const TRUNK_HEIGHT = 3.4;
export const LEAF_COUNT = 1500;
export const FRUIT_COUNT = 40;
export const GROUND_Y = 0;

export const LEAF_COLORS = [
  "#2d7a34",
  "#3c9142",
  "#4fa84c",
  "#6bbd57",
  "#8acb5f",
  "#a6d46a",
];
export const FRUIT_COLORS = ["#d62828", "#e63946", "#f4722b", "#f4a924", "#c1121f"];

export type BranchPath = { points: Vec3[]; r0: number; r1: number };

/** Trunk plus one curved branch to every canopy blob (and a few twigs). */
export function branchPaths(): BranchPath[] {
  const paths: BranchPath[] = [
    {
      points: [
        [0, 0, 0],
        [0.06, 0.9, 0.02],
        [-0.04, 1.8, 0],
        [0.03, 2.7, 0.02],
        [0, TRUNK_HEIGHT, 0],
      ],
      r0: 0.42,
      r1: 0.13,
    },
  ];
  CANOPY.forEach(({ center: [x, y, z] }, i) => {
    const startY = 2.1 + (i % 5) * 0.22;
    paths.push({
      points: [
        [0, startY, 0],
        [x * 0.35, startY + (y - startY) * 0.35 + 0.15, z * 0.35],
        [x * 0.7, startY + (y - startY) * 0.7 + 0.1, z * 0.7],
        [x * 0.92, y - 0.45, z * 0.92],
      ],
      r0: 0.14 - (i % 3) * 0.02,
      r1: 0.03,
    });
  });
  return paths;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Item = {
  home: Vec3;
  rotation: Vec3;
  scale: number;
  /** Index into LEAF_COLORS / FRUIT_COLORS. */
  color: number;
  /** Sway phase offset. */
  phase: number;
};

function pointInBlob(blob: Blob, rnd: () => number, shell: number): Vec3 {
  // Uniform direction on a sphere, radius biased toward the surface by `shell`.
  const u = rnd() * 2 - 1;
  const theta = rnd() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  const r = blob.radius * (shell + (1 - shell) * Math.cbrt(rnd()));
  return [
    blob.center[0] + r * s * Math.cos(theta),
    blob.center[1] + r * u * 0.85,
    blob.center[2] + r * s * Math.sin(theta),
  ];
}

/** Rotation order used for items: yaw first, then pitch, then roll. */
export const ITEM_EULER_ORDER = "YXZ";

export function buildTree(seed = 7): { leaves: Item[]; fruits: Item[] } {
  const rnd = mulberry32(seed);
  const pickBlob = () => CANOPY[Math.floor(rnd() * CANOPY.length)];

  const leaves: Item[] = Array.from({ length: LEAF_COUNT }, () => {
    const blob = pickBlob();
    const home = pointInBlob(blob, rnd, 0.35);
    // Leaves face away from the middle of their cluster, tip drooping out and
    // down by a varying amount, like real foliage.
    const outward = Math.atan2(home[0] - blob.center[0], home[2] - blob.center[2]);
    return {
      home,
      // [pitch, yaw, roll] applied in "YXZ" order.
      rotation: [0.4 + rnd() * 2.2, outward + (rnd() - 0.5) * 1.1, (rnd() - 0.5) * 0.9],
      scale: 0.75 + rnd() * 0.6,
      color: Math.floor(rnd() * LEAF_COLORS.length),
      phase: rnd() * Math.PI * 2,
    };
  });

  const fruits: Item[] = Array.from({ length: FRUIT_COUNT }, () => {
    const home = pointInBlob(pickBlob(), rnd, 0.82);
    // Let fruit hang slightly below the foliage surface.
    home[1] -= 0.12;
    return {
      home,
      rotation: [0, 0, 0],
      scale: 0.8 + rnd() * 0.4,
      color: Math.floor(rnd() * FRUIT_COLORS.length),
      phase: rnd() * Math.PI * 2,
    };
  });

  return { leaves, fruits };
}
