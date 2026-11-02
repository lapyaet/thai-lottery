import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Vector3,
} from "three";
import type { Vec3 } from "@/lib/tree";

/**
 * A tube along a smooth curve whose radius tapers from `r0` to `r1`, with a
 * root flare and a little bark-like radial wobble and color variation.
 */
export function taperedTube(
  points: Vec3[],
  r0: number,
  r1: number,
  { radial = 12, segments = 28, flare = 0, seed = 1 } = {},
): BufferGeometry {
  const curve = new CatmullRomCurve3(
    points.map((p) => new Vector3(...p)),
    false,
    "catmullrom",
    0.5,
  );
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dark = [0.3, 0.2, 0.13];
  const light = [0.42, 0.3, 0.2];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const n = frames.normals[i];
    const b = frames.binormals[i];
    const radius = r0 + (r1 - r0) * t ** 0.8 + flare * r0 * Math.exp(-t * 14);

    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const wobble =
        1 + 0.07 * Math.sin(a * 3 + t * 9 + seed) + 0.04 * Math.sin(a * 5 - t * 13 + seed * 2);
      const dx = n.x * cos + b.x * sin;
      const dy = n.y * cos + b.y * sin;
      const dz = n.z * cos + b.z * sin;
      positions.push(
        center.x + dx * radius * wobble,
        center.y + dy * radius * wobble,
        center.z + dz * radius * wobble,
      );
      normals.push(dx, dy, dz);
      const shade = 0.5 + 0.5 * Math.sin(a * 7 + t * 21 + seed * 3);
      colors.push(
        dark[0] + (light[0] - dark[0]) * shade,
        dark[1] + (light[1] - dark[1]) * shade,
        dark[2] + (light[2] - dark[2]) * shade,
      );
      uvs.push(j / radial, t);
    }
  }

  const stride = radial + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * stride + j;
      const b2 = a + stride;
      indices.push(a, b2, a + 1, b2, b2 + 1, a + 1);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}
