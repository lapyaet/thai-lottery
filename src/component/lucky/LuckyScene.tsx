"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  CanvasTexture,
  type InstancedMesh,
  type ShaderMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from "three";
import { buildEnvelopes, pickFallingIndex } from "@/lib/envelope";
import { mulberry32 } from "@/lib/tree";
import {
  cloudTexture,
  milkyWayTexture,
  moonTexture,
  sunTexture,
} from "@/component/lucky/skyTextures";
import { fbm } from "@/lib/noise";
import Boy from "@/component/lucky/Boy";
import Envelope from "@/component/lucky/Envelope";
import HangingEnvelopes from "@/component/lucky/HangingEnvelopes";
import Meadow from "@/component/lucky/Meadow";
import Rabbits from "@/component/lucky/Rabbits";
import House from "@/component/lucky/House";
import { createStory, type Story } from "@/component/lucky/storyState";
import { Foliage } from "@/component/lucky/TreeModel";
import {
  type Meteor,
  meteorState,
  nextMeteorDelay,
  spawnMeteor,
} from "@/lib/meteor";
import { celestialDirection } from "@/lib/sky";
import {
  LAND_PAUSE,
  OPEN_TIME,
  RETURN_TIME,
  SHAKE_TIME,
  shakeAmount,
  type StoryPhase,
  WALK_TIME,
} from "@/lib/story";

export type Phase = StoryPhase;

type SceneProps = {
  phase: Phase;
  /** Dark mode: moonlit night instead of daylight. */
  night: boolean;
  /** Bump to replay the story (boy back inside, new envelope in the tree). */
  resetKey: number;
  /** Called once when a story phase has finished playing. */
  onPhaseEnd: (phase: Phase) => void;
  interactive: boolean;
};

const STAR_COUNT = 2600;
const POLLEN_COUNT = 70;
const DAY_BG = "#c9e3f6";
const NIGHT_BG = "#0a1226";
const SKY_DISTANCE = 110;

function makeGroundGeometry() {
  const size = 140;
  const geometry = new PlaneGeometry(size, size, 140, 140);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const colors: number[] = [];
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    // Flat meadow near the tree, rolling hills further out.
    const hill = Math.max(0, (r - 18) / 40);
    const h =
      hill *
        hill *
        3.2 *
        (0.6 + 0.4 * Math.sin(x * 0.13 + 1.3) * Math.cos(z * 0.11)) +
      Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.04;
    pos.setY(i, h);
    const patch = 0.5 + 0.5 * Math.sin(x * 0.35) * Math.cos(z * 0.3);
    c.set("#4f9a3f").lerp(new Color("#7ab653"), patch * 0.7);
    if (r > 30) c.lerp(new Color("#3e7c3b"), Math.min(1, (r - 30) / 25));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Drifting pollen by day, fireflies by night. */
function Pollen({
  wind,
  night,
}: {
  wind: React.RefObject<number>;
  night: boolean;
}) {
  const dummy = useMemo(() => new Object3D(), []);
  const mesh = useRef<InstancedMesh>(null);
  const pollen = useMemo(() => {
    const rnd = mulberry32(9);
    return Array.from({ length: POLLEN_COUNT }, () => ({
      x: -8 + rnd() * 16,
      y: 0.5 + rnd() * 6,
      z: -5 + rnd() * 10,
      phase: rnd() * 6.28,
      speed: 0.3 + rnd() * 0.5,
    }));
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const w = wind.current ?? 0;
    const t = clock.elapsedTime;
    pollen.forEach((p, i) => {
      p.x += (0.25 + w * 5) * p.speed * dt;
      if (p.x > 9) p.x = -9;
      dummy.position.set(
        p.x,
        p.y + Math.sin(t * 1.3 + p.phase) * 0.25,
        p.z + Math.cos(t * 0.9 + p.phase) * 0.2,
      );
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, POLLEN_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[night ? 0.04 : 0.025, 8, 8]} />
      <meshBasicMaterial
        color={night ? "#ffe066" : "#fff6c8"}
        transparent
        opacity={night ? 1 : 0.75}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/** Camera distance and look-at height so the whole tree fits any screen. */
function framing(width: number, height: number) {
  const aspect = width / height;
  const portrait = Math.max(0, 1.15 - aspect);
  return {
    distance: 13.5 + portrait * 12,
    // Look lower on tall screens so the tree sits above the result card.
    targetY: 3.2 - portrait * 3.2,
  };
}

function Rig({ interactive }: { interactive: boolean }) {
  const { camera, size } = useThree();
  const { distance, targetY } = framing(size.width, size.height);
  useEffect(() => {
    camera.position.set(0, 3.4, distance);
  }, [camera, distance]);

  return (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      enableRotate={interactive}
      target={[0, targetY, 0]}
      minPolarAngle={Math.PI / 3.2}
      maxPolarAngle={Math.PI / 2.02}
    />
  );
}

/** Shaded cumulus clouds that drift and speed up with the wind. */
function Clouds({
  wind,
  night,
}: {
  wind: React.RefObject<number>;
  night: boolean;
}) {
  const textures = useMemo(
    () => [cloudTexture(1), cloudTexture(2), cloudTexture(3)],
    [],
  );
  const refs = useRef<(Group | null)[]>([]);
  const clouds = useMemo(() => {
    const rnd = mulberry32(11);
    return Array.from({ length: 8 }, (_, i) => {
      const width = 30 + rnd() * 34;
      return {
        x: -110 + rnd() * 220,
        y: 15 + rnd() * 22,
        z: -60 - rnd() * 70,
        width,
        height: width * (0.38 + rnd() * 0.12),
        texture: i % 3,
        flip: rnd() > 0.5 ? 1 : -1,
        speed: 0.5 + rnd() * 0.7,
      };
    });
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const w = wind.current ?? 0;
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.position.x += (clouds[i].speed + w * 4) * dt;
      if (g.position.x > 120) g.position.x = -120;
    });
  });

  return (
    <>
      {clouds.map((c, i) => (
        <group
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[c.x, c.y, c.z]}
        >
          <sprite scale={[c.width * c.flip, c.height, 1]}>
            <spriteMaterial
              map={textures[c.texture]}
              color={night ? "#5a6a98" : "#ffffff"}
              opacity={night ? 0.55 : 0.96}
              depthWrite={false}
              fog={false}
            />
          </sprite>
        </group>
      ))}
    </>
  );
}

const STAR_COLORS: [number, number, number][] = [
  [0.78, 0.86, 1],
  [0.92, 0.95, 1],
  [1, 1, 1],
  [1, 0.95, 0.8],
  [1, 0.82, 0.62],
];

/** Twinkling stars of varied brightness and color temperature. */
function StarField() {
  const material = useRef<ShaderMaterial>(null);
  const pixelRatio = useThree((s) => s.gl.getPixelRatio());
  const geometry = useMemo(() => {
    const rnd = mulberry32(77);
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const phases: number[] = [];
    while (positions.length < STAR_COUNT * 3) {
      // Uniform on the upper hemisphere only.
      const y = rnd();
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      positions.push(Math.cos(a) * r * 220, y * 220, Math.sin(a) * r * 220);
      const c = STAR_COLORS[Math.floor(rnd() * STAR_COLORS.length)];
      colors.push(...c);
      const bright = rnd() ** 6; // a few bright stars, many faint ones
      sizes.push(1.7 + bright * 4.5);
      phases.push(rnd() * 6.28);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new Float32BufferAttribute(colors, 3));
    g.setAttribute("size", new Float32BufferAttribute(sizes, 1));
    g.setAttribute("phase", new Float32BufferAttribute(phases, 1));
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({ time: { value: 0 }, ratio: { value: pixelRatio } }),
    [pixelRatio],
  );

  useFrame(({ clock }) => {
    if (material.current)
      material.current.uniforms.time.value = clock.elapsedTime;
  });

  return (
    <points geometry={geometry} renderOrder={-2} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={`
          attribute float size; attribute float phase; attribute vec3 color;
          uniform float time; uniform float ratio;
          varying vec3 vColor; varying float vTwinkle;
          void main(){
            vColor = color;
            vTwinkle = 0.75 + 0.25 * sin(time * (1.5 + phase * 0.3) + phase * 9.0);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * ratio * (0.85 + 0.15 * vTwinkle);
            gl_Position = projectionMatrix * mv;
          }`}
        fragmentShader={`
          varying vec3 vColor; varying float vTwinkle;
          void main(){
            float d = length(gl_PointCoord - 0.5) * 2.0;
            float a = smoothstep(1.0, 0.0, d);
            a = pow(a, 1.6) * vTwinkle;
            gl_FragColor = vec4(vColor * (1.4 + 0.8 * a), min(1.0, a * 1.5));
          }`}
      />
    </points>
  );
}

/** A faint Milky Way band across the night sky. */
function MilkyWay() {
  const texture = useMemo(() => milkyWayTexture(), []);
  return (
    <mesh rotation={[0.25, 0.6, 0.35]} renderOrder={-3}>
      <sphereGeometry args={[240, 48, 24]} />
      <meshBasicMaterial
        map={texture}
        side={BackSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </mesh>
  );
}

/**
 * Layered ridge silhouettes ringing the meadow. Farther layers are taller,
 * bluer and hazier (the scene fog does the aerial perspective).
 */
type RidgeSpec = {
  radius: number;
  amp: number;
  freq: number;
  seed: number;
  low: string;
  high: string;
};

const RIDGES: RidgeSpec[] = [
  { radius: 64, amp: 6, freq: 1.7, seed: 3, low: "#2f6a31", high: "#5f9a48" },
  { radius: 92, amp: 13, freq: 1.25, seed: 8, low: "#33664a", high: "#5f946a" },
  {
    radius: 130,
    amp: 25,
    freq: 0.95,
    seed: 13,
    low: "#4a6a82",
    high: "#7f9bb0",
  },
  {
    radius: 175,
    amp: 40,
    freq: 0.7,
    seed: 21,
    low: "#6f8aa6",
    high: "#a9bdd0",
  },
];

function makeRidgeGeometry({ radius, amp, freq, seed, low, high }: RidgeSpec) {
  const segments = 360;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const cLow = new Color(low);
  const cHigh = new Color(high);
  const c = new Color();

  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const cx = Math.cos(a);
    const sz = Math.sin(a);
    // Noise sampled on a circle so the ring closes without a seam.
    const big = fbm(cx * freq * 2 + seed, sz * freq * 2 + seed, 4, seed);
    const fine = fbm(cx * freq * 9 + seed, sz * freq * 9, 4, seed + 5);
    const height = amp * (0.32 + big * 0.9 + fine * 0.28);
    positions.push(
      cx * radius,
      height,
      sz * radius,
      cx * radius,
      -10,
      sz * radius,
    );
    c.copy(cLow).lerp(cHigh, Math.min(1, height / (amp * 1.3)));
    colors.push(c.r, c.g, c.b, cLow.r * 0.7, cLow.g * 0.7, cLow.b * 0.7);
    if (i < segments) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function Ridges() {
  const geometries = useMemo(() => RIDGES.map(makeRidgeGeometry), []);
  return (
    <>
      {geometries.map((geometry, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static list
        <mesh key={i} geometry={geometry}>
          <meshStandardMaterial vertexColors side={DoubleSide} roughness={1} />
        </mesh>
      ))}
    </>
  );
}

type MeteorSlot = { meteor: Meteor; t: number } | null;

type MeteorSky = {
  rnd: () => number;
  next: number;
  slots: MeteorSlot[];
};

/**
 * Advance the shooting stars and place their streaks. Kept outside the
 * component so it can mutate the pooled meshes freely. Coordinates are in
 * camera space (the group follows the camera), so a streak always crosses the
 * visible sky.
 */
function updateMeteors(
  sky: MeteorSky,
  meshes: (Mesh | null)[],
  dt: number,
  xScale: number,
) {
  sky.next -= dt;
  if (sky.next <= 0) {
    const free = sky.slots.indexOf(null);
    if (free >= 0) sky.slots[free] = { meteor: spawnMeteor(sky.rnd), t: 0 };
    sky.next = nextMeteorDelay(sky.rnd);
  }
  sky.slots.forEach((slot, i) => {
    const mesh = meshes[i];
    if (!mesh) return;
    if (!slot) {
      mesh.visible = false;
      return;
    }
    slot.t += dt;
    const { meteor: m } = slot;
    if (slot.t >= m.life) {
      sky.slots[i] = null;
      mesh.visible = false;
      return;
    }
    const st = meteorState(m, slot.t);
    const dx = Math.cos(m.angle);
    const dy = Math.sin(m.angle);
    mesh.visible = true;
    // The head leads; the streak trails behind it.
    mesh.position.set(
      (st.x - (dx * m.length) / 2) * xScale,
      st.y - (dy * m.length) / 2,
      -120,
    );
    mesh.rotation.z = m.angle;
    mesh.scale.set(m.length, 0.45, 1);
    (mesh.material as MeshBasicMaterial).opacity = st.alpha;
  });
}

/** An occasional shooting star across the night sky. */
function ShootingStars() {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const group = useRef<Group>(null);
  const meshes = useRef<(Mesh | null)[]>([]);
  const sky = useRef<MeteorSky>({
    rnd: mulberry32(404),
    next: 2.5,
    slots: [null, null, null],
  });
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 256, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.75, "rgba(210,225,255,0.45)");
      g.addColorStop(1, "rgba(255,255,255,1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 16);
      // Soften the top and bottom edges of the streak.
      const fade = ctx.createLinearGradient(0, 0, 0, 16);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(0.5, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, 256, 16);
    }
    return new CanvasTexture(canvas);
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
    }
    // Narrow screens see less of the sky sideways.
    updateMeteors(
      sky.current,
      meshes.current,
      Math.min(delta, 0.1),
      Math.min(1, aspect / 1.6),
    );
  });

  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          visible={false}
          renderOrder={-1}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            color={new Color(3, 3, 3.6)}
            transparent
            opacity={0}
            depthWrite={false}
            blending={AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Daytime sky dome: pale horizon fading to deep blue, warmed around the sun. */
function GradientSky({ sunDir }: { sunDir: [number, number, number] }) {
  const uniforms = useMemo(
    () => ({
      top: { value: new Color("#2a72d0") },
      bottom: { value: new Color("#cfe6f7") },
      sun: { value: new Vector3(...sunDir).normalize() },
    }),
    [sunDir],
  );
  return (
    <mesh renderOrder={-4}>
      <sphereGeometry args={[300, 48, 24]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={`varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`
          uniform vec3 top; uniform vec3 bottom; uniform vec3 sun; varying vec3 vDir;
          void main(){
            float t = smoothstep(0.0, 0.45, vDir.y);
            vec3 col = mix(bottom, top, t);
            float s = max(dot(normalize(vDir), sun), 0.0);
            col += vec3(1.0, 0.82, 0.55) * pow(s, 9.0) * 0.38 + vec3(1.0, 0.95, 0.85) * pow(s, 60.0) * 0.5;
            gl_FragColor = vec4(col, 1.0);
          }`}
      />
    </mesh>
  );
}

/** The sky: sun + clouds by day, moon + stars + dim clouds by night, with matching light. */
function Atmosphere({
  night,
  wind,
}: {
  night: boolean;
  wind: React.RefObject<number>;
}) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dir = useMemo(
    () => celestialDirection(width, height, night),
    [width, height, night],
  );
  const texture = useMemo(
    () => (night ? moonTexture() : sunTexture()),
    [night],
  );
  // Light comes from the visible body, lifted a little so the tree front stays lit.
  const light = useMemo(
    () =>
      new Vector3(dir[0], dir[1] + 0.55, dir[2]).normalize().multiplyScalar(40),
    [dir],
  );
  const bg = night ? NIGHT_BG : DAY_BG;
  const size = night ? 34 : 80;

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 40, 230]} />

      {night ? (
        <>
          <MilkyWay />
          <StarField />
          <ShootingStars />
        </>
      ) : (
        <GradientSky sunDir={dir} />
      )}
      <sprite
        position={[
          dir[0] * SKY_DISTANCE,
          dir[1] * SKY_DISTANCE,
          dir[2] * SKY_DISTANCE,
        ]}
        scale={[size, size, 1]}
      >
        <spriteMaterial
          map={texture}
          // HDR color so the sun/moon core blooms.
          color={night ? new Color(1.35, 1.35, 1.4) : new Color(2.4, 2.1, 1.6)}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <Clouds wind={wind} night={night} />

      <ambientLight intensity={night ? 0.3 : 0.45} />
      <hemisphereLight
        args={
          night ? ["#3a4f8a", "#10201a", 0.65] : ["#bfe0ff", "#5d8f45", 0.75]
        }
      />
      <directionalLight
        position={light}
        intensity={night ? 1.5 : 2.4}
        color={night ? "#9db7ff" : "#fff3dc"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={10}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
      />
      {/* gentle front fill so the side facing the camera is never black */}
      <directionalLight
        position={[-6, 8, 20]}
        intensity={night ? 0.35 : 0.8}
        color={night ? "#7f95d6" : "#ffffff"}
      />
    </>
  );
}

/** Does the current story phase have nothing left to play? */
function phaseFinished(s: Story): boolean {
  switch (s.phase) {
    case "walking":
      return s.t >= WALK_TIME + 0.15;
    case "shaking":
      return s.t >= SHAKE_TIME;
    case "dropping":
      return s.envLanded && s.t - s.landedAt >= LAND_PAUSE;
    case "opening":
      return s.t >= OPEN_TIME;
    case "returning":
      return s.t >= RETURN_TIME;
    default:
      return false;
  }
}

/**
 * Shared story clock: tracks the time in the current phase, derives the shake
 * amount, and reports when a phase has played out. Runs before other frame
 * callbacks so everything renders from the same state.
 */
function useStory(
  phase: Phase,
  resetKey: number,
  onPhaseEnd: (phase: Phase) => void,
) {
  const story = useRef<Story>(createStory());
  const want = useRef({ phase, resetKey });
  const callback = useRef(onPhaseEnd);
  const applied = useRef<{ phase: Phase; resetKey: number }>({
    phase: "idle",
    resetKey,
  });

  useEffect(() => {
    want.current = { phase, resetKey };
    callback.current = onPhaseEnd;
  }, [phase, resetKey, onPhaseEnd]);

  useFrame((_, delta) => {
    const s = story.current;
    const w = want.current;
    if (
      applied.current.phase !== w.phase ||
      applied.current.resetKey !== w.resetKey
    ) {
      applied.current = { ...w };
      s.phase = w.phase;
      s.t = 0;
      s.ended = false;
      s.envLanded = false;
      s.landedAt = 0;
    }
    s.t += Math.min(delta, 0.1);
    s.shake = shakeAmount(s.phase, s.t);
    if (!s.ended && phaseFinished(s)) {
      s.ended = true;
      callback.current(s.phase);
    }
  }, -1);

  return story;
}

function World({
  phase,
  night,
  resetKey,
  onPhaseEnd,
}: Omit<SceneProps, "interactive">) {
  const story = useStory(phase, resetKey, onPhaseEnd);
  // Ambient breeze for grass, clouds and pollen (the boy, not the wind, shakes the tree).
  const wind = useRef(0.18);
  useFrame(({ clock }) => {
    wind.current = 0.18 + 0.05 * Math.sin(clock.elapsedTime * 0.5);
  });

  const ground = useMemo(() => makeGroundGeometry(), []);
  const envelopes = useMemo(() => buildEnvelopes(), []);
  // Every replay a (possibly different) envelope on the front of the tree comes loose.
  const chosen = useMemo(
    () => pickFallingIndex(envelopes, resetKey),
    [envelopes, resetKey],
  );

  return (
    <>
      <Atmosphere night={night} wind={wind} />
      <Ridges />
      <Foliage story={story} wind={wind} />
      <House story={story} night={night} />
      <Boy story={story} />
      <HangingEnvelopes story={story} envelopes={envelopes} chosen={chosen} />
      <Envelope key={resetKey} story={story} source={envelopes[chosen]} />
      <Meadow wind={wind} />
      <Rabbits />
      <Pollen wind={wind} night={night} />

      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      {/* soft contact shadow under the crown */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[2.2, 40]} />
        <meshBasicMaterial color="#17301a" transparent opacity={0.22} />
      </mesh>
    </>
  );
}

export default function LuckyScene({
  phase,
  night,
  resetKey,
  onPhaseEnd,
  interactive,
}: SceneProps) {
  return (
    <Canvas
      flat
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [0, 3.4, 13.5], fov: 40, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
    >
      <World
        phase={phase}
        night={night}
        resetKey={resetKey}
        onPhaseEnd={onPhaseEnd}
      />

      <Rig interactive={interactive} />

      <EffectComposer multisampling={interactive ? 4 : 0}>
        <Bloom
          intensity={night ? 0.9 : 0.5}
          luminanceThreshold={0.88}
          luminanceSmoothing={0.25}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
