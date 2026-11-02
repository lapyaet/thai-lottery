"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  type InstancedMesh,
  Object3D,
  SphereGeometry,
} from "three";
import { leafTexture } from "@/component/lucky/foliageTextures";
import {
  createFaller,
  type Faller,
  litterScale,
  nextDropDelay,
  pickKind,
  regrow,
  stepFaller,
} from "@/lib/litter";
import type { Story } from "@/component/lucky/storyState";
import {
  branchPaths,
  buildTree,
  FRUIT_COLORS,
  ITEM_EULER_ORDER,
  type Item,
  LEAF_COLORS,
  mulberry32,
} from "@/lib/tree";
import { taperedTube } from "@/lib/treeGeometry";

const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * A curved leaf blade: pointed at both ends, folded along the mid-rib so the
 * edges curl back, with the tip curling over, rather than a flat cut-out.
 */
function makeLeafGeometry() {
  const cols = 6;
  const rows = 9;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    const width = Math.sin(Math.PI * v ** 0.75) * (1 - 0.25 * v);
    for (let i = 0; i <= cols; i++) {
      const u = (i / cols) * 2 - 1;
      const x = u * width * 0.19;
      const y = v * 0.44 - 0.22;
      const z = -Math.abs(u) * width * 0.07 + v * v * 0.08;
      positions.push(x, y, z);
      uvs.push(i / cols, v);
    }
  }
  const stride = cols + 1;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * stride + i;
      indices.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function makeFruitGeometry() {
  const geometry = new SphereGeometry(0.15, 24, 18);
  geometry.scale(1, 0.92, 1); // slightly squashed, apple-like
  return geometry;
}

function makeStemGeometry() {
  const geometry = new CylinderGeometry(0.012, 0.016, 0.1, 6);
  geometry.translate(0, 0.17, 0);
  return geometry;
}

type Sway = {
  dummy: Object3D;
  time: number;
  gust: number;
  grow: number;
  /** Fruit swings from its stem; leaves flutter. */
  hanging: boolean;
  /** Per item: when a loose leaf/fruit left (Infinity = still gone), so it regrows. */
  regrowAt: Float64Array;
};

/**
 * Update one InstancedMesh (plus an optional companion such as fruit stems).
 * Everything stays attached to the tree; shaking just makes it sway harder.
 * Kept outside the component so it can mutate freely.
 */
function updateAttached(
  mesh: InstancedMesh,
  extra: InstancedMesh | null,
  items: Item[],
  c: Sway,
) {
  items.forEach((item, i) => {
    const h = Math.max(0, (item.home[1] - 2) / 4);
    const amp = (0.012 + c.gust * 0.11) * h;
    c.dummy.position.set(
      item.home[0] +
        Math.sin(c.time * 2.2 + item.phase) * amp +
        c.gust * 0.08 * h,
      item.home[1] + Math.sin(c.time * 3 + item.phase) * amp * 0.4,
      item.home[2] + Math.cos(c.time * 2 + item.phase) * amp * 0.6,
    );
    if (c.hanging) {
      c.dummy.rotation.set(
        Math.sin(c.time * 2.6 + item.phase) * c.gust * 0.25,
        0,
        Math.sin(c.time * 3.1 + item.phase) * c.gust * 0.35,
      );
    } else {
      // [pitch, yaw, roll] in YXZ order; flutter perturbs each a little.
      c.dummy.rotation.set(
        item.rotation[0] + Math.sin(c.time * 6 + item.phase) * c.gust * 0.35,
        item.rotation[1] + Math.sin(c.time * 3.5 + item.phase) * c.gust * 0.3,
        item.rotation[2] + Math.cos(c.time * 5 + item.phase) * c.gust * 0.3,
      );
    }
    c.dummy.scale.setScalar(
      item.scale * c.grow * regrow(c.time - c.regrowAt[i]),
    );
    c.dummy.updateMatrix();
    mesh.setMatrixAt(i, c.dummy.matrix);
    extra?.setMatrixAt(i, c.dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (extra) extra.instanceMatrix.needsUpdate = true;
}

const TINT = new Color();
const LEAF_SLOTS = 40;
const FRUIT_SLOTS = 8;

type LitterState = {
  rnd: () => number;
  nextDrop: number;
  leaves: (Faller | null)[];
  fruits: (Faller | null)[];
};

function createLitter(): LitterState {
  return {
    rnd: mulberry32(555),
    nextDrop: 2.5,
    leaves: Array.from({ length: LEAF_SLOTS }, () => null),
    fruits: Array.from({ length: FRUIT_SLOTS }, () => null),
  };
}

type LitterContext = {
  time: number;
  dt: number;
  wind: number;
  shake: number;
  leaves: Item[];
  fruits: Item[];
  leafRegrow: Float64Array;
  fruitRegrow: Float64Array;
  leafMesh: InstancedMesh;
  fruitMesh: InstancedMesh;
  dummy: Object3D;
};

/**
 * Now and then a single leaf or fruit lets go, drifts down and lies on the
 * grass for a while before fading (its spot on the tree then regrows). Purely
 * scenery: nothing here affects the generated ticket.
 */
function updateLitter(st: LitterState, c: LitterContext) {
  if (c.time >= st.nextDrop) {
    st.nextDrop = c.time + nextDropDelay(st.rnd, c.shake);
    const kind = pickKind(st.rnd, c.shake);
    const items = kind === "leaf" ? c.leaves : c.fruits;
    const regrowAt = kind === "leaf" ? c.leafRegrow : c.fruitRegrow;
    const pool = kind === "leaf" ? st.leaves : st.fruits;
    const slot = pool.indexOf(null);
    // Choose something that is currently attached and grown.
    for (let tries = 0; slot >= 0 && tries < 8; tries++) {
      const i = Math.floor(st.rnd() * items.length);
      if (c.time - regrowAt[i] < 2.5) continue;
      regrowAt[i] = Number.POSITIVE_INFINITY;
      pool[slot] = createFaller(
        kind,
        i,
        items[i].home,
        items[i].rotation,
        st.rnd,
      );
      // Same colour as the leaf/fruit it came from.
      const poolMesh = kind === "leaf" ? c.leafMesh : c.fruitMesh;
      poolMesh.setColorAt(
        slot,
        TINT.set(
          (kind === "leaf" ? LEAF_COLORS : FRUIT_COLORS)[items[i].color],
        ),
      );
      if (poolMesh.instanceColor) poolMesh.instanceColor.needsUpdate = true;
      break;
    }
  }

  const draw = (
    mesh: InstancedMesh,
    pool: (Faller | null)[],
    regrowAt: Float64Array,
    items: Item[],
  ) => {
    pool.forEach((f, slot) => {
      if (!f) {
        c.dummy.scale.setScalar(0);
      } else {
        stepFaller(f, c.dt, c.wind + c.shake * 1.2, c.time);
        const k = litterScale(f);
        if (k <= 0) {
          regrowAt[f.source] = c.time;
          pool[slot] = null;
          c.dummy.scale.setScalar(0);
        } else {
          c.dummy.position.set(f.x, f.y, f.z);
          c.dummy.rotation.set(f.rx, f.ry, f.rz);
          c.dummy.scale.setScalar(items[f.source].scale * k);
        }
      }
      c.dummy.updateMatrix();
      mesh.setMatrixAt(slot, c.dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  draw(c.leafMesh, st.leaves, c.leafRegrow, c.leaves);
  draw(c.fruitMesh, st.fruits, c.fruitRegrow, c.fruits);
}

export function Bark() {
  const geometries = useMemo(
    () =>
      branchPaths().map((path, i) =>
        taperedTube(path.points, path.r0, path.r1, {
          radial: i === 0 ? 16 : 8,
          segments: i === 0 ? 40 : 20,
          flare: i === 0 ? 0.9 : 0,
          seed: i + 1,
        }),
      ),
    [],
  );

  return (
    <>
      {geometries.map((geometry, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static list
        <mesh key={i} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

export function Foliage({
  story,
  wind,
}: {
  story: React.RefObject<Story>;
  wind: React.RefObject<number>;
}) {
  const { leaves, fruits } = useMemo(() => buildTree(7), []);
  const leafGeometry = useMemo(() => makeLeafGeometry(), []);
  const leafMap = useMemo(() => leafTexture(), []);
  const fruitGeometry = useMemo(() => makeFruitGeometry(), []);
  const stemGeometry = useMemo(() => makeStemGeometry(), []);
  const dummy = useMemo(() => {
    const o = new Object3D();
    o.rotation.order = ITEM_EULER_ORDER;
    return o;
  }, []);

  const group = useRef<Group>(null);
  const leafMesh = useRef<InstancedMesh>(null);
  const fruitMesh = useRef<InstancedMesh>(null);
  const stemMesh = useRef<InstancedMesh>(null);
  const clock = useRef({ time: 0, growth: 0 });
  const fallenLeaves = useRef<InstancedMesh>(null);
  const fallenFruit = useRef<InstancedMesh>(null);
  const litter = useRef<LitterState>(createLitter());
  // -Infinity = attached and fully grown; +Infinity = currently fallen off.
  const leafRegrow = useRef(
    new Float64Array(leaves.length).fill(Number.NEGATIVE_INFINITY),
  );
  const fruitRegrow = useRef(
    new Float64Array(fruits.length).fill(Number.NEGATIVE_INFINITY),
  );

  // Per-instance colors: leaves vary from deep to yellow-green, fruit from red to gold.
  useLayoutEffect(() => {
    const color = new Color();
    leaves.forEach((item, i) => {
      leafMesh.current?.setColorAt(i, color.set(LEAF_COLORS[item.color]));
    });
    fruits.forEach((item, i) => {
      fruitMesh.current?.setColorAt(i, color.set(FRUIT_COLORS[item.color]));
    });
    // Loose leaves/fruit are tinted when they spawn; start with a neutral colour.
    for (let i = 0; i < LEAF_SLOTS; i++)
      fallenLeaves.current?.setColorAt(i, color.set(LEAF_COLORS[2]));
    for (let i = 0; i < FRUIT_SLOTS; i++)
      fallenFruit.current?.setColorAt(i, color.set(FRUIT_COLORS[0]));
    for (const m of [
      leafMesh.current,
      fruitMesh.current,
      fallenLeaves.current,
      fallenFruit.current,
    ]) {
      if (m?.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [leaves, fruits]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const s = clock.current;
    s.time += dt;
    s.growth = Math.min(1, s.growth + dt * 0.8);
    const shake = story.current?.shake ?? 0;
    const gust =
      (wind.current ?? 0) * (1 + 0.35 * Math.sin(s.time * 2.7)) + shake * 1.7;

    if (group.current) {
      group.current.rotation.z =
        Math.sin(s.time * 1.2) * 0.006 + shake * Math.sin(s.time * 12) * 0.028;
      group.current.rotation.x =
        Math.sin(s.time * 0.9) * 0.004 +
        shake * Math.sin(s.time * 12 + 1) * 0.012;
    }

    const grow = ease(s.growth);
    if (leafMesh.current) {
      updateAttached(leafMesh.current, null, leaves, {
        dummy,
        time: s.time,
        gust,
        grow,
        hanging: false,
        regrowAt: leafRegrow.current,
      });
    }
    if (fruitMesh.current) {
      updateAttached(fruitMesh.current, stemMesh.current, fruits, {
        dummy,
        time: s.time,
        gust,
        grow,
        hanging: true,
        regrowAt: fruitRegrow.current,
      });
    }
    if (fallenLeaves.current && fallenFruit.current) {
      updateLitter(litter.current, {
        time: s.time,
        dt,
        wind: wind.current ?? 0,
        shake,
        leaves,
        fruits,
        leafRegrow: leafRegrow.current,
        fruitRegrow: fruitRegrow.current,
        leafMesh: fallenLeaves.current,
        fruitMesh: fallenFruit.current,
        dummy,
      });
    }
  });

  return (
    <>
      <group ref={group}>
        <Bark />
        <instancedMesh
          ref={leafMesh}
          args={[leafGeometry, undefined, leaves.length]}
          frustumCulled={false}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={leafMap}
            bumpMap={leafMap}
            bumpScale={1.2}
            side={DoubleSide}
            roughness={0.55}
            // A faint self-glow stands in for light passing through thin leaves.
            emissive="#1d3d12"
            emissiveIntensity={0.35}
          />
        </instancedMesh>
        <instancedMesh
          ref={fruitMesh}
          args={[fruitGeometry, undefined, fruits.length]}
          frustumCulled={false}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            roughness={0.28}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
          />
        </instancedMesh>
        <instancedMesh
          ref={stemMesh}
          args={[stemGeometry, undefined, fruits.length]}
          frustumCulled={false}
          castShadow
        >
          <meshStandardMaterial color="#4a3320" roughness={1} />
        </instancedMesh>
      </group>
      {/* loose leaves and fruit, in world space */}
      <instancedMesh
        ref={fallenLeaves}
        args={[leafGeometry, undefined, LEAF_SLOTS]}
        frustumCulled={false}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={leafMap}
          bumpMap={leafMap}
          bumpScale={1.2}
          side={DoubleSide}
          roughness={0.55}
          emissive="#1d3d12"
          emissiveIntensity={0.35}
        />
      </instancedMesh>
      <instancedMesh
        ref={fallenFruit}
        args={[fruitGeometry, undefined, FRUIT_SLOTS]}
        frustumCulled={false}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          roughness={0.28}
          clearcoat={0.7}
          clearcoatRoughness={0.25}
        />
      </instancedMesh>
    </>
  );
}
