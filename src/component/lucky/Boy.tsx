"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  LatheGeometry,
  Vector2,
} from "three";
import {
  longyiTexture,
  shirtTexture,
  skinTexture,
} from "@/component/lucky/clothTextures";
import type { Story } from "@/component/lucky/storyState";
import { type BoyPose, boyPose } from "@/lib/story";

const SKIN = "#d39a6c";
const LIPS = "#a85a4a";
const SHIRT = "#f6efca";
const INDIGO = "#33407f";
const HAIR = "#5a3b22";

type Parts = {
  root: Group | null;
  body: Group | null;
  torso: Group | null;
  head: Group | null;
  eyeL: Group | null;
  eyeR: Group | null;
  hem: Group | null;
  armL: Group | null;
  armR: Group | null;
  elbowL: Group | null;
  elbowR: Group | null;
  thighL: Group | null;
  thighR: Group | null;
  kneeL: Group | null;
  kneeR: Group | null;
  footL: Group | null;
  footR: Group | null;
};

/** Eyelids close for a moment every few seconds. */
function blink(t: number): number {
  const k = (t % 3.4) - 3.25;
  return k > 0 && k < 0.15 ? 1 - Math.abs(k - 0.075) / 0.075 : 0;
}

/** Smoothed joint angles, so the pose eases between states instead of snapping. */
type Joints = Record<string, number>;

function damp(
  j: Joints,
  key: string,
  target: number,
  dt: number,
  k: number,
): number {
  const current = j[key] ?? target;
  const next = current + (target - current) * (1 - Math.exp(-k * dt));
  j[key] = next;
  return next;
}

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** The longyi as a piece of cloth whose vertices follow the legs. */
type Cloth = {
  geometry: CylinderGeometry;
  /** Rest positions (x, y, z per vertex). */
  base: Float32Array;
  /** Height down the cloth: 0 at the waist .. 1 at the hem. */
  h: Float32Array;
  /** Angle around the body: 0 at the front, positive toward the left. */
  phi: Float32Array;
};

/** Thigh and shin lengths below the hip, matching the leg rig. */
const THIGH_LENGTH = 0.38;
/** Waist to hip joint, and the full height of the cloth. */
const WAIST_TO_HIP = 0.04;
const CLOTH_HEIGHT = 0.62;

/**
 * Where a leg is, front to back, `depth` metres below the hip joint:
 * positive = forward. The thigh swings from the hip, the shin from the knee.
 */
function legReach(depth: number, thigh: number, knee: number): number {
  const upper = Math.min(depth, THIGH_LENGTH);
  const lower = Math.max(0, depth - THIGH_LENGTH);
  return -(upper * Math.sin(thigh) + lower * Math.sin(thigh + knee));
}

/**
 * Drapes the longyi over the legs. A leg stepping forward pushes the cloth in
 * front of it; a leg stepping back pushes the cloth behind it; the far side
 * just hangs and gets dragged along a little. A soft ripple runs down the hem.
 */
function updateCloth(
  c: Cloth,
  legs: { thighL: number; thighR: number; kneeL: number; kneeR: number },
  time: number,
  speed: number,
) {
  const pos = c.geometry.attributes.position;
  const spread = Math.abs(legs.thighL - legs.thighR);
  for (let i = 0; i < pos.count; i++) {
    const x0 = c.base[i * 3];
    const y0 = c.base[i * 3 + 1];
    const z0 = c.base[i * 3 + 2];
    const h = c.h[i];
    const phi = c.phi[i];

    // Cloth over the left leg (+x) follows it, over the right (-x) follows that.
    const wl = smoothstep((x0 + 0.05) / 0.1);
    const depth = Math.max(0, h * CLOTH_HEIGHT - WAIST_TO_HIP);
    const reach =
      wl * legReach(depth, legs.thighL, legs.kneeL) +
      (1 - wl) * legReach(depth, legs.thighR, legs.kneeR);

    // Front cloth is pushed out by a forward leg, back cloth by a backward leg;
    // the opposite movement only drags it a little.
    const push =
      z0 >= 0
        ? Math.max(reach, 0) + Math.min(reach, 0) * 0.3
        : Math.min(reach, 0) + Math.max(reach, 0) * 0.3;
    // The cloth is drawn in towards the middle when the legs are apart.
    const squeeze = 1 - 0.07 * spread * h;
    // A gentle ripple travelling down the hem.
    const ripple =
      Math.sin(time * 3.4 + h * 5 + phi * 2.4) * 0.006 * h * (0.35 + speed);
    const r = Math.hypot(x0, z0) || 1;
    pos.setXYZ(
      i,
      x0 * squeeze + (x0 / r) * ripple,
      y0,
      z0 + push * 0.9 + (z0 / r) * ripple,
    );
  }
  pos.needsUpdate = true;
  c.geometry.computeVertexNormals();
}

/**
 * Poses the boy for this frame. Kept outside the component so it can mutate
 * the Three.js objects freely. Every joint target is eased towards, so the
 * movement stays fluid when the boy changes what he is doing.
 */
function applyPose(
  p: Parts,
  pose: BoyPose,
  clock: number,
  dt: number,
  j: Joints,
  cloth: Cloth,
) {
  const { root, body, torso, head } = p;
  if (!root || !body || !torso || !head) return;
  root.visible = pose.visible;
  root.position.set(pose.x, 0, pose.z);
  root.rotation.y = pose.yaw;

  // Walking is driven by distance covered (feet never skate) and scales with
  // speed, so he takes small steps while speeding up or slowing down.
  const c = pose.stride;
  const amp = pose.moving ? Math.min(1, 0.2 + pose.speed * 0.85) : 0;
  const s = Math.sin(c);
  const co = Math.cos(c);

  let thighL = 0;
  let thighR = 0;
  let kneeL = 0;
  let kneeR = 0;
  let armL = 0;
  let armR = 0;
  let elbowL = -0.12;
  let elbowR = -0.12;
  let lean = 0;
  let twist = 0;
  let sway = 0;
  let bob = 0;

  if (pose.moving) {
    thighL = -s * 0.5 * amp;
    thighR = s * 0.5 * amp;
    // Knee folds through the swing phase, with a little spring in stance.
    kneeL = (Math.max(0, co) ** 1.2 * 0.95 + 0.05) * amp;
    kneeR = (Math.max(0, -co) ** 1.2 * 0.95 + 0.05) * amp;
    armL = s * 0.5 * amp;
    armR = -s * 0.5 * amp;
    elbowL = -(0.2 + Math.max(0, -s) * 0.4) * amp - 0.1;
    elbowR = -(0.2 + Math.max(0, s) * 0.4) * amp - 0.1;
    lean = 0.05 * amp;
    twist = s * 0.1 * amp;
    sway = -s * 0.012 * amp;
    bob = Math.abs(s) * 0.02 * amp;
  } else if (pose.arms === "push") {
    // Braced stance, shoving the trunk.
    thighL = -0.32;
    kneeL = 0.3;
    thighR = 0.28;
    kneeR = 0.08;
    armL = -1.42 + pose.rock * 0.16;
    armR = -1.42 - pose.rock * 0.16;
    elbowL = elbowR = -0.1;
    lean = 0.2 + pose.rock * 0.09;
  } else {
    // Standing: breathing, shifting weight, relaxed arms.
    const breathe = Math.sin(clock * 2) * 0.015;
    armL = pose.lookUp > 0.5 ? -0.3 : breathe;
    armR = pose.lookUp > 0.5 ? -0.3 : -breathe;
    lean = -pose.lookUp * 0.06;
    thighL = Math.sin(clock * 0.8) * 0.03;
    thighR = -Math.sin(clock * 0.8) * 0.03;
    sway = Math.sin(clock * 0.8) * 0.01;
  }

  // Fast to follow a steady gait, slower to blend between different actions.
  const k = pose.moving ? 26 : 9;
  const tL = damp(j, "thighL", thighL, dt, k);
  const tR = damp(j, "thighR", thighR, dt, k);
  const kL = damp(j, "kneeL", kneeL, dt, k);
  const kR = damp(j, "kneeR", kneeR, dt, k);
  const aL = damp(j, "armL", armL, dt, k);
  const aR = damp(j, "armR", armR, dt, k);
  const eL = damp(j, "elbowL", elbowL, dt, k);
  const eR = damp(j, "elbowR", elbowR, dt, k);
  const leanV = damp(j, "lean", lean, dt, 10);
  const twistV = damp(j, "twist", twist, dt, 18);
  const swayV = damp(j, "sway", sway, dt, 14);
  const bobV = damp(j, "bob", bob, dt, 24);
  const pushZ = damp(
    j,
    "pushZ",
    pose.arms === "push" ? pose.rock * 0.035 : 0,
    dt,
    18,
  );

  body.position.set(swayV, bobV, pushZ);
  body.rotation.z = -swayV * 1.6;
  torso.rotation.x = leanV;
  torso.rotation.y = twistV;
  torso.scale.y = 1 + Math.sin(clock * 2) * 0.006;

  // The head stays steady against the body's sway; idle, he glances around.
  const glance =
    !pose.moving && pose.arms === "down" && pose.lookUp < 0.2
      ? Math.sin(clock * 0.7) * 0.28
      : 0;
  const headX = damp(j, "headX", -0.04 - pose.lookUp * 0.5, dt, 8);
  const headY = damp(j, "headY", -twistV * 0.6 + glance, dt, 6);
  head.rotation.x = headX - (pose.moving ? Math.sin(c * 2) * 0.01 * amp : 0);
  head.rotation.y = headY;

  if (p.thighL) p.thighL.rotation.x = tL;
  if (p.thighR) p.thighR.rotation.x = tR;
  if (p.kneeL) p.kneeL.rotation.x = kL;
  if (p.kneeR) p.kneeR.rotation.x = kR;
  // Feet stay flat through the stride; toes lift just before each footfall.
  if (p.footL)
    p.footL.rotation.x = -(tL + kL) * 0.72 + Math.max(0, co) * 0.12 * amp;
  if (p.footR)
    p.footR.rotation.x = -(tR + kR) * 0.72 + Math.max(0, -co) * 0.12 * amp;
  if (p.armL) p.armL.rotation.x = aL;
  if (p.armR) p.armR.rotation.x = aR;
  if (p.elbowL) p.elbowL.rotation.x = eL;
  if (p.elbowR) p.elbowR.rotation.x = eR;
  // The pelvis turns against the shoulders.
  if (p.hem) p.hem.rotation.y = -twistV * 0.7;

  updateCloth(
    cloth,
    { thighL: tL, thighR: tR, kneeL: kL, kneeR: kR },
    clock,
    pose.speed,
  );

  const lid = 1 - blink(clock) * 0.9;
  if (p.eyeL) p.eyeL.scale.y = lid;
  if (p.eyeR) p.eyeR.scale.y = lid;
}

/**
 * The longyi: a wrapped tube of cloth, gathered at the waist, with soft
 * pleats, an overlapping fold across the front and a shaded crease. Returned
 * with the data `updateCloth` needs to animate it.
 */
/** Angle (from the front, toward the left) where the lapped edge of the wrap sits. */
const EDGE = -0.05;

function makeLongyi(): Cloth {
  const g = new CylinderGeometry(0.146, 0.178, 0.62, 80, 18, true);
  const pos = g.attributes.position;
  const h = new Float32Array(pos.count);
  const phi = new Float32Array(pos.count);
  const colors = new Float32Array(pos.count * 3);
  const base = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const hh = (0.31 - y) / 0.62;
    const a = Math.atan2(x, z);
    const gather = hh < 0.12 ? 1 - hh / 0.12 : 0;
    const fold =
      1 +
      0.032 * Math.sin(a * 9 + hh * 2.5) * (0.25 + hh) +
      0.018 * Math.sin(a * 5 + 1.1) +
      0.009 * Math.sin(a * 23) * gather;
    // A second layer of cloth laps across the front-left, with a sharp edge.
    // The front edge of the wrap: a layer laps over from just off-centre, with a
    // clean vertical crease, and its lower end lifts away from the hem.
    const onLap = a > EDGE && a < 1.35;
    const lap = onLap ? 0.014 * (0.35 + hh) * smoothstep((1.35 - a) / 0.3) : 0;
    const open = hh > 0.7 ? (hh - 0.7) * 0.11 : 0;
    const liftOut = onLap && a - EDGE < 0.2 ? open * (1 - (a - EDGE) / 0.2) : 0;
    const tuckIn =
      !onLap && EDGE - a < 0.2 ? -open * 0.35 * (1 - (EDGE - a) / 0.2) : 0;
    const r = Math.hypot(x, z) * fold + lap + liftOut + tuckIn;
    const nx = Math.sin(a) * r;
    const nz = Math.cos(a) * r;
    pos.setXYZ(i, nx, y, nz);

    // Baked shading: ridges light, valleys, the gathers and the crease darker.
    const pleat = 0.5 + 0.5 * Math.sin(a * 9 + hh * 2.5);
    let shade = 0.8 + 0.2 * pleat;
    shade *= 1 - 0.18 * gather;
    // Shadow in the fold under the lapped edge, deeper toward the open hem.
    if (a < EDGE && EDGE - a < 0.22)
      shade *= 0.58 - 0.18 * Math.max(0, (hh - 0.7) / 0.3);
    if (a >= EDGE && a - EDGE < 0.03) shade *= 0.7;
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = shade;

    h[i] = hh;
    phi[i] = a;
    base[i * 3] = nx;
    base[i * 3 + 1] = y;
    base[i * 3 + 2] = nz;
  }
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return { geometry: g, base, h, phi };
}

/**
 * The shirt-clad torso as one smooth form: narrow at the waist, broad across
 * the chest, sloping up into the shoulders and the base of the neck.
 */
function makeTorso() {
  const profile = [
    [0.1, 0.0],
    [0.104, 0.06],
    [0.112, 0.15],
    [0.12, 0.25],
    [0.122, 0.31],
    [0.108, 0.36],
    [0.078, 0.395],
    [0.048, 0.415],
    [0.0, 0.42],
  ].map(([r, y]) => new Vector2(r, y));
  const g = new LatheGeometry(profile, 36);
  g.scale(1, 1, 0.78);
  g.computeVertexNormals();
  return g;
}

const FINGERS = [-0.021, -0.0075, 0.0065, 0.0195] as const;

/** A hand with four fingers and a thumb, loosely curled. */
function Hand({ side, skin }: { side: 1 | -1; skin: React.ReactNode }) {
  return (
    <group position={[0, -0.215, 0.004]}>
      <mesh scale={[1, 1.05, 0.6]} castShadow>
        <sphereGeometry args={[0.031, 16, 12]} />
        {skin}
      </mesh>
      {FINGERS.map((x, i) => {
        const len = 0.034 - Math.abs(i - 1.5) * 0.0035;
        return (
          <group key={x} position={[x, -0.026, 0.002]} rotation={[-0.45, 0, 0]}>
            <mesh position={[0, -len / 2, 0]} castShadow>
              <capsuleGeometry args={[0.0078, len, 4, 8]} />
              {skin}
            </mesh>
            <group position={[0, -len, 0]} rotation={[-0.5, 0, 0]}>
              <mesh position={[0, -0.011, 0]} castShadow>
                <capsuleGeometry args={[0.0068, 0.014, 4, 8]} />
                {skin}
              </mesh>
            </group>
          </group>
        );
      })}
      <group
        position={[side * 0.027, -0.004, 0.006]}
        rotation={[-0.2, 0, side * 0.7]}
      >
        <mesh position={[0, -0.012, 0]} castShadow>
          <capsuleGeometry args={[0.0085, 0.02, 4, 8]} />
          {skin}
        </mesh>
      </group>
    </group>
  );
}

/** A flat, soft slipper covering the whole foot. */
function Foot() {
  return (
    <group>
      <mesh
        position={[0, -0.03, 0.045]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, 1, 0.82]}
        castShadow
      >
        <capsuleGeometry args={[0.04, 0.1, 8, 14]} />
        <meshStandardMaterial color="#aab097" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.056, 0.05]} castShadow>
        <boxGeometry args={[0.078, 0.01, 0.19]} />
        <meshStandardMaterial color="#8a8f7a" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Hair as overlapping clumps over the crown, sides, nape and forehead. */
const HAIR_CLUMPS = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2;
  const ring = i % 2;
  return {
    x: Math.sin(a) * (0.088 - ring * 0.02),
    y: 0.185 + ring * 0.018,
    z: Math.cos(a) * (0.088 - ring * 0.02) - 0.012,
    size: 0.03 + (i % 3) * 0.004,
    rot: a,
  };
});

/** A jointed young boy in a white shirt and a checked longyi. */
export default function Boy({ story }: { story: React.RefObject<Story> }) {
  const clock = useRef(0);
  const longyi = useMemo(() => longyiTexture(), []);
  const shirt = useMemo(() => shirtTexture(), []);
  const skinMap = useMemo(() => skinTexture(), []);
  const longyiCloth = useMemo(() => makeLongyi(), []);
  const joints = useRef<Joints>({});
  const torsoGeo = useMemo(() => makeTorso(), []);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyeL = useRef<Group>(null);
  const eyeR = useRef<Group>(null);
  const hem = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const elbowL = useRef<Group>(null);
  const elbowR = useRef<Group>(null);
  const thighL = useRef<Group>(null);
  const thighR = useRef<Group>(null);
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);
  const footL = useRef<Group>(null);
  const footR = useRef<Group>(null);

  useFrame((_, delta) => {
    const st = story.current;
    if (!st) return;
    clock.current += Math.min(delta, 0.1);
    const parts: Parts = {
      root: root.current,
      body: body.current,
      torso: torso.current,
      head: head.current,
      eyeL: eyeL.current,
      eyeR: eyeR.current,
      hem: hem.current,
      armL: armL.current,
      armR: armR.current,
      elbowL: elbowL.current,
      elbowR: elbowR.current,
      thighL: thighL.current,
      thighR: thighR.current,
      kneeL: kneeL.current,
      kneeR: kneeR.current,
      footL: footL.current,
      footR: footR.current,
    };
    applyPose(
      parts,
      boyPose(st.phase, st.t),
      clock.current,
      Math.min(delta, 0.1),
      joints.current,
      longyiCloth,
    );
  });

  const skin = (
    <meshStandardMaterial
      color={SKIN}
      map={skinMap}
      roughness={0.58}
      emissive="#4a2410"
      emissiveIntensity={0.14}
    />
  );
  const cloth = (
    <meshStandardMaterial
      color={SHIRT}
      map={shirt}
      bumpMap={shirt}
      bumpScale={0.25}
      roughness={0.9}
      emissive="#4a4326"
      emissiveIntensity={0.28}
    />
  );
  const indigo = <meshStandardMaterial color={INDIGO} roughness={0.92} />;

  const leg = (side: 1 | -1) => (
    <group
      ref={side === 1 ? thighL : thighR}
      position={[side * 0.062, 0.77, 0]}
    >
      <mesh position={[0, -0.19, 0]} castShadow>
        <capsuleGeometry args={[0.054, 0.26, 8, 16]} />
        {skin}
      </mesh>
      <group ref={side === 1 ? kneeL : kneeR} position={[0, -0.38, 0]}>
        <mesh position={[0, 0, 0.008]} castShadow>
          <sphereGeometry args={[0.04, 12, 10]} />
          {skin}
        </mesh>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.039, 0.23, 8, 16]} />
          {skin}
        </mesh>
        <group ref={side === 1 ? footL : footR} position={[0, -0.34, 0]}>
          <Foot />
        </group>
      </group>
    </group>
  );

  const arm = (side: 1 | -1) => (
    <group ref={side === 1 ? armL : armR} position={[side * 0.114, 0.35, 0]}>
      <mesh scale={[1, 0.9, 0.95]} castShadow>
        <sphereGeometry args={[0.033, 16, 14]} />
        {cloth}
      </mesh>
      <mesh position={[0, -0.1, 0]} castShadow>
        <capsuleGeometry args={[0.036, 0.13, 8, 14]} />
        {cloth}
      </mesh>
      <group ref={side === 1 ? elbowL : elbowR} position={[0, -0.2, 0]}>
        <mesh position={[0, -0.095, 0]} castShadow>
          <capsuleGeometry args={[0.03, 0.12, 8, 14]} />
          {cloth}
        </mesh>
        <mesh position={[0, -0.178, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.028, 18]} />
          {cloth}
        </mesh>
        <Hand side={side} skin={skin} />
      </group>
    </group>
  );

  return (
    <group ref={root} visible={false} scale={0.97}>
      <group ref={body}>
        {/* longyi: wrapped skirt with pleats and a waist knot */}
        <group ref={hem} position={[0, 0.81, 0]}>
          <mesh
            position={[0, -0.31, 0]}
            geometry={longyiCloth.geometry}
            castShadow
          >
            <meshStandardMaterial
              map={longyi}
              roughness={0.92}
              vertexColors
              side={DoubleSide}
            />
          </mesh>
          {/* rolled waistband */}
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.158, 0.154, 0.06, 40]} />
            {indigo}
          </mesh>
          {/* the big folded knot at the front, with its tab hanging below */}
          <mesh
            position={[0.015, -0.012, 0.152]}
            rotation={[0, 0, Math.PI / 2]}
            scale={[1, 1, 0.8]}
            castShadow
          >
            <capsuleGeometry args={[0.04, 0.1, 8, 16]} />
            {indigo}
          </mesh>
          <mesh
            position={[0.03, -0.1, 0.158]}
            rotation={[0.08, 0, 0.05]}
            castShadow
          >
            <boxGeometry args={[0.07, 0.115, 0.022]} />
            <meshStandardMaterial color="#2a3570" roughness={0.92} />
          </mesh>
          <mesh position={[0.005, -0.02, 0.17]} scale={[1.2, 0.5, 0.6]}>
            <sphereGeometry args={[0.03, 12, 8]} />
            <meshStandardMaterial color="#2a3570" roughness={0.92} />
          </mesh>
          {/* a thin darker edge along the hem */}
          <mesh position={[0, -0.612, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.016, 40, 1, true]} />
            <meshStandardMaterial
              color="#2a3570"
              roughness={0.9}
              side={DoubleSide}
            />
          </mesh>
        </group>

        {leg(1)}
        {leg(-1)}

        <group ref={torso} position={[0, 0.81, 0]}>
          <mesh geometry={torsoGeo} castShadow>
            {cloth}
          </mesh>
          {[0.1, 0.2, 0.3].map((y) => (
            <mesh key={y} position={[0, y, 0.093]}>
              <sphereGeometry args={[0.009, 8, 8]} />
              <meshStandardMaterial color="#efe6cf" roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0.0945]}>
            <boxGeometry args={[0.004, 0.31, 0.002]} />
            <meshStandardMaterial color="#cfc7b0" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.425, 0.002]}>
            <cylinderGeometry args={[0.046, 0.058, 0.04, 28, 1, true]} />
            <meshStandardMaterial
              color={SHIRT}
              map={shirt}
              roughness={0.95}
              side={DoubleSide}
            />
          </mesh>
          {arm(1)}
          {arm(-1)}

          <mesh position={[0, 0.445, 0]} castShadow>
            <cylinderGeometry args={[0.033, 0.042, 0.09, 20]} />
            {skin}
          </mesh>

          <group ref={head} position={[0, 0.487, 0]} scale={0.93}>
            <mesh position={[0, 0.115, 0]} scale={[0.95, 1.1, 1]} castShadow>
              <sphereGeometry args={[0.105, 40, 30]} />
              {skin}
            </mesh>
            <mesh position={[0, 0.062, 0.03]} scale={[1, 0.8, 0.9]} castShadow>
              <sphereGeometry args={[0.07, 24, 16]} />
              {skin}
            </mesh>
            {/* cheeks, a touch of warmth */}
            {([1, -1] as const).map((side) => (
              <mesh
                key={side}
                position={[side * 0.056, 0.085, 0.07]}
                scale={[1, 0.8, 0.5]}
              >
                <sphereGeometry args={[0.024, 12, 10]} />
                <meshStandardMaterial
                  color="#d9806a"
                  roughness={0.7}
                  transparent
                  opacity={0.35}
                />
              </mesh>
            ))}
            {/* ears with inner detail */}
            {([1, -1] as const).map((side) => (
              <group key={side} position={[side * 0.1, 0.108, -0.004]}>
                <mesh scale={[0.45, 1, 0.8]}>
                  <sphereGeometry args={[0.028, 14, 12]} />
                  {skin}
                </mesh>
                <mesh
                  position={[side * 0.004, 0, 0.002]}
                  scale={[0.3, 0.6, 0.5]}
                >
                  <sphereGeometry args={[0.02, 10, 8]} />
                  <meshStandardMaterial color="#a8654a" roughness={0.8} />
                </mesh>
              </group>
            ))}
            {/* eyes with lids */}
            {([1, -1] as const).map((side) => (
              <group key={side}>
                <group
                  ref={side === 1 ? eyeL : eyeR}
                  position={[side * 0.037, 0.122, 0.09]}
                >
                  <mesh scale={[1, 0.85, 0.55]}>
                    <sphereGeometry args={[0.0175, 16, 14]} />
                    <meshStandardMaterial color="#f4f0e8" roughness={0.25} />
                  </mesh>
                  <mesh position={[0, 0, 0.0078]}>
                    <sphereGeometry args={[0.0108, 14, 12]} />
                    <meshStandardMaterial color="#3a2414" roughness={0.2} />
                  </mesh>
                  <mesh position={[0, 0, 0.0128]}>
                    <sphereGeometry args={[0.0058, 10, 8]} />
                    <meshStandardMaterial color="#0a0604" roughness={0.1} />
                  </mesh>
                  <mesh position={[0.003, 0.0035, 0.0172]}>
                    <sphereGeometry args={[0.0028, 6, 6]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                </group>
                <mesh
                  position={[side * 0.037, 0.134, 0.091]}
                  rotation={[0.1, 0, side * -0.08]}
                  scale={[1, 0.45, 0.6]}
                >
                  <sphereGeometry
                    args={[0.0185, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]}
                  />
                  {skin}
                </mesh>
                <mesh
                  position={[side * 0.039, 0.155, 0.091]}
                  rotation={[0, 0, side * -0.18]}
                >
                  <boxGeometry args={[0.03, 0.0055, 0.008]} />
                  <meshStandardMaterial color={HAIR} roughness={1} />
                </mesh>
              </group>
            ))}
            {/* nose: bridge, tip and nostrils */}
            <mesh
              position={[0, 0.112, 0.098]}
              rotation={[0.25, 0, 0]}
              scale={[1, 1.6, 0.9]}
            >
              <capsuleGeometry args={[0.0075, 0.012, 4, 8]} />
              {skin}
            </mesh>
            <mesh position={[0, 0.094, 0.106]} scale={[1.05, 0.9, 1.1]}>
              <sphereGeometry args={[0.0165, 14, 12]} />
              {skin}
            </mesh>
            {([1, -1] as const).map((side) => (
              <mesh key={side} position={[side * 0.0075, 0.087, 0.112]}>
                <sphereGeometry args={[0.0036, 6, 6]} />
                <meshStandardMaterial color="#2a1208" />
              </mesh>
            ))}
            {/* a friendly smile with a hint of teeth */}
            <mesh position={[0, 0.0705, 0.0955]} scale={[1, 0.7, 1]}>
              <boxGeometry args={[0.028, 0.0075, 0.004]} />
              <meshStandardMaterial color="#f3efe6" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.081, 0.0965]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.0215, 0.0032, 6, 20, Math.PI]} />
              <meshStandardMaterial color={LIPS} roughness={0.5} />
            </mesh>
            {/* hair: crown, nape, and layered clumps with a fringe */}
            <mesh
              position={[0, 0.13, -0.008]}
              rotation={[-0.22, 0, 0]}
              scale={[0.98, 1.1, 1.02]}
              castShadow
            >
              <sphereGeometry
                args={[0.113, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.56]}
              />
              <meshStandardMaterial color={HAIR} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.1, -0.045]} scale={[1, 0.95, 0.9]}>
              <sphereGeometry args={[0.1, 22, 16]} />
              <meshStandardMaterial color={HAIR} roughness={0.9} />
            </mesh>
            {HAIR_CLUMPS.map((c) => (
              <mesh
                key={c.rot}
                position={[c.x, c.y, c.z]}
                rotation={[0.6, c.rot, 0]}
                scale={[0.8, 1.5, 0.8]}
              >
                <sphereGeometry args={[c.size, 8, 8]} />
                <meshStandardMaterial color={HAIR} roughness={0.8} />
              </mesh>
            ))}
            {[-0.06, -0.035, -0.01, 0.015, 0.04, 0.062].map((x, i) => (
              <mesh
                key={x}
                position={[
                  x,
                  0.176 - Math.abs(x) * 0.25,
                  0.082 - Math.abs(x) * 0.25,
                ]}
                scale={[1.2, 0.7, 0.8]}
                rotation={[0.3, 0, x * 3]}
              >
                <sphereGeometry args={[0.02 + (i % 2) * 0.003, 10, 8]} />
                <meshStandardMaterial color={HAIR} roughness={0.9} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
