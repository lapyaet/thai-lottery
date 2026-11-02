"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  type InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { fbm } from "@/lib/noise";
import { BOUNDS } from "@/lib/rabbit";
import { HOUSE, HOUSE_YAW, SPOT, START } from "@/lib/story";
import { mulberry32 } from "@/lib/tree";

const TUFTS = 2300;
const BLADES_PER_TUFT = 6;
const FLOWERS = 260;

/**
 * How tall the grass may grow here: kept short around the trunk and along the
 * path (so the boy's feet show) and on the lawn where the rabbits play.
 */
function lawn(x: number, z: number): number {
  const pad = 0.8;
  const onLawn =
    x > BOUNDS.minX - pad &&
    x < BOUNDS.maxX + pad &&
    z > BOUNDS.minZ - pad &&
    z < BOUNDS.maxZ + pad;
  if (onLawn) return 0.3;
  const px = SPOT[0] - START[0];
  const pz = SPOT[2] - START[2];
  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - START[0]) * px + (z - START[2]) * pz) / (px * px + pz * pz),
    ),
  );
  const nearPath =
    Math.hypot(x - (START[0] + px * t), z - (START[2] + pz * t)) < 1.5;
  if (nearPath || Math.hypot(x, z) < 2.4) return 0.42;
  return 1;
}

/** Is this spot taken by the house, the path, the trunk or too close to the camera? */
function blocked(x: number, z: number): boolean {
  const dx = x - HOUSE[0];
  const dz = z - HOUSE[2];
  const lx = dx * Math.cos(HOUSE_YAW) - dz * Math.sin(HOUSE_YAW);
  const lz = dx * Math.sin(HOUSE_YAW) + dz * Math.cos(HOUSE_YAW);
  if (Math.abs(lx) < 2.5 && lz > -1.9 && lz < 2.35) return true;

  // Path from the door to the tree.
  const px = SPOT[0] - START[0];
  const pz = SPOT[2] - START[2];
  const len2 = px * px + pz * pz;
  const t = Math.max(
    0,
    Math.min(1, ((x - START[0]) * px + (z - START[2]) * pz) / len2),
  );
  if (Math.hypot(x - (START[0] + px * t), z - (START[2] + pz * t)) < 0.78)
    return true;

  if (Math.hypot(x, z) < 0.65) return true; // trunk
  return z > 8.2; // right in front of the camera
}

/**
 * A curved blade, wide at the base and tapering to a point, with a dark-to-light
 * gradient up its length. Height is 1; each instance scales it.
 */
function makeBlade() {
  const rows = 5;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const base = new Color("#244d1c");
  const tip = new Color("#a9d46a");
  const c = new Color();
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    const half = 0.032 * (1 - v) ** 0.75 + (j === rows ? 0 : 0.002);
    const z = v * v * 0.22;
    c.copy(base).lerp(tip, v ** 0.8);
    if (j === rows) {
      positions.push(0, v, z);
      colors.push(c.r, c.g, c.b);
    } else {
      positions.push(-half, v, z, half, v, z);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < rows - 1; j++) {
    const a = j * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const top = (rows - 1) * 2;
  indices.push(top, top + 1, rows * 2);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

type Uniforms = { uTime: { value: number }; uWind: { value: number } };

function updateUniforms(u: Uniforms, time: number, wind: number) {
  u.uTime.value = time;
  u.uWind.value = wind;
}

function useGrassMaterial(uniforms: Uniforms) {
  return useMemo(() => {
    const m = new MeshStandardMaterial({
      vertexColors: true,
      side: DoubleSide,
      roughness: 0.82,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uWind = uniforms.uWind;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTime;\nuniform float uWind;",
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float h = clamp(position.y, 0.0, 1.0);
          vec3 rootW = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float ph = rootW.x * 0.6 + rootW.z * 0.45;
          float sway = sin(uTime * 1.7 + ph) * 0.5 + sin(uTime * 3.3 + ph * 1.9) * 0.2;
          float bend = (0.06 + uWind * 0.6) * (sway + 0.9);
          transformed.x += bend * h * h * 0.5;
          transformed.z += bend * h * h * 0.18;`,
        );
    };
    return m;
  }, [uniforms]);
}

/** Tufted grass that bends in the wind on the GPU, plus wildflowers. */
export default function Meadow({ wind }: { wind: React.RefObject<number> }) {
  const blade = useMemo(() => makeBlade(), []);
  const uniforms = useMemo<Uniforms>(
    () => ({ uTime: { value: 0 }, uWind: { value: 0.2 } }),
    [],
  );
  const material = useGrassMaterial(uniforms);
  const grass = useRef<InstancedMesh>(null);
  const stems = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const centres = useRef<InstancedMesh>(null);

  const data = useMemo(() => {
    const rnd = mulberry32(5);
    const blades: {
      x: number;
      z: number;
      yaw: number;
      lean: number;
      h: number;
      w: number;
      color: Color;
    }[] = [];
    const flowers: { x: number; z: number; h: number; color: Color }[] = [];
    const dry = new Color("#b9b052");
    const lush = new Color("#4d9a3a");
    const bright = new Color("#8fc85a");
    const petals = ["#ffffff", "#ffe066", "#ff8fb3", "#c9a3ff", "#ffb347"].map(
      (c) => new Color(c),
    );

    let attempts = 0;
    let tufts = 0;
    while (tufts < TUFTS && attempts < TUFTS * 6) {
      attempts += 1;
      // Denser near the middle, thinning toward the edge of the meadow.
      const r = 17 * rnd() ** 0.65;
      const a = rnd() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (blocked(x, z)) continue;
      tufts += 1;
      const patch = fbm(x * 0.12 + 3, z * 0.12, 3, 4);
      const tall = (0.6 + patch * 0.9) * lawn(x, z);
      const tint = new Color()
        .copy(lush)
        .lerp(bright, fbm(x * 0.2, z * 0.2 + 9, 3, 8));
      if (patch > 0.68) tint.lerp(dry, (patch - 0.68) * 3);
      for (let k = 0; k < BLADES_PER_TUFT; k++) {
        blades.push({
          x: x + (rnd() - 0.5) * 0.16,
          z: z + (rnd() - 0.5) * 0.16,
          yaw: rnd() * Math.PI * 2,
          lean: 0.08 + rnd() * 0.55,
          h: (0.28 + rnd() * 0.62) * tall,
          w: 0.8 + rnd() * 0.7,
          color: tint.clone().multiplyScalar(0.82 + rnd() * 0.36),
        });
      }
      if (flowers.length < FLOWERS && rnd() < 0.12) {
        flowers.push({
          x: x + (rnd() - 0.5) * 0.3,
          z: z + (rnd() - 0.5) * 0.3,
          h: 0.22 + rnd() * 0.22,
          color: petals[Math.floor(rnd() * petals.length)],
        });
      }
    }
    return { blades, flowers };
  }, []);

  useLayoutEffect(() => {
    const o = new Object3D();
    o.rotation.order = "YXZ";
    data.blades.forEach((b, i) => {
      o.position.set(b.x, 0, b.z);
      o.rotation.set(b.lean, b.yaw, 0);
      o.scale.set(b.w, b.h, b.w);
      o.updateMatrix();
      grass.current?.setMatrixAt(i, o.matrix);
      grass.current?.setColorAt(i, b.color);
    });
    if (grass.current) {
      grass.current.instanceMatrix.needsUpdate = true;
      if (grass.current.instanceColor)
        grass.current.instanceColor.needsUpdate = true;
    }

    data.flowers.forEach((f, i) => {
      o.rotation.set(0, 0, 0);
      o.position.set(f.x, f.h / 2, f.z);
      o.scale.set(1, f.h, 1);
      o.updateMatrix();
      stems.current?.setMatrixAt(i, o.matrix);
      o.position.set(f.x, f.h, f.z);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      heads.current?.setMatrixAt(i, o.matrix);
      centres.current?.setMatrixAt(i, o.matrix);
      heads.current?.setColorAt(i, f.color);
    });
    for (const m of [stems.current, heads.current, centres.current]) {
      if (m) m.instanceMatrix.needsUpdate = true;
    }
    if (heads.current?.instanceColor)
      heads.current.instanceColor.needsUpdate = true;
  }, [data]);

  useFrame(({ clock }) => {
    updateUniforms(uniforms, clock.elapsedTime, wind.current ?? 0.2);
  });

  return (
    <>
      <instancedMesh
        ref={grass}
        args={[blade, material, data.blades.length]}
        frustumCulled={false}
        receiveShadow
      />
      <instancedMesh
        ref={stems}
        args={[undefined, undefined, data.flowers.length]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.004, 0.005, 1, 5]} />
        <meshStandardMaterial color="#4d8a3a" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={heads}
        args={[undefined, undefined, data.flowers.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.04, 10, 6]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh
        ref={centres}
        args={[undefined, undefined, data.flowers.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.016, 8, 6]} />
        <meshStandardMaterial color="#f0b400" roughness={0.6} />
      </instancedMesh>
    </>
  );
}
