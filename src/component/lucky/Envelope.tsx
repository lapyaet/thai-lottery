"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  type Group,
  type InstancedMesh,
  Object3D,
  type Sprite,
} from "three";
import { ENV_H, ENV_T, ENV_W, flapShape } from "@/component/lucky/envelopeGeometry";
import { HANG_SCALE } from "@/component/lucky/HangingEnvelopes";
import { sunTexture } from "@/component/lucky/skyTextures";
import { markEnvelopeLanded, type Story } from "@/component/lucky/storyState";
import {
  createEnvelope,
  type Envelope as EnvelopeState,
  type EnvelopePose,
  type HangingEnvelope,
  hangPose,
  OPEN_POS,
  REST_Y,
  stepEnvelope,
} from "@/lib/envelope";

const SPARKLES = 20;
/** Size when it is lying on the grass, and when it hovers open in front of the viewer. */
const LAND_SCALE = 1.6;
const OPEN_SCALE = 3.6;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * The one envelope that comes loose: it leaves its branch when the boy has
 * shaken the tree, floats down beside him, lifts to the middle of the view and
 * opens in a burst of light, then fades as the ticket card appears.
 */
export default function Envelope({
  story,
  source,
}: {
  story: React.RefObject<Story>;
  /** The hanging envelope that will fall. */
  source: HangingEnvelope;
}) {
  const group = useRef<Group>(null);
  const flap = useRef<Group>(null);
  const glow = useRef<Sprite>(null);
  const sparkles = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const glowMap = useMemo(() => sunTexture(), []);
  const flapGeo = useMemo(() => flapShape(), []);

  const sim = useRef<{ time: number; fall: EnvelopeState | null; startScale: number; startY: number }>({
    time: 0,
    fall: null,
    startScale: HANG_SCALE,
    startY: source.home[1],
  });

  useEffect(() => {
    if (group.current) group.current.rotation.order = "YXZ";
  }, []);

  useFrame((_, delta) => {
    const st = story.current;
    const g = group.current;
    if (!st || !g) return;
    const s = sim.current;
    s.time += Math.min(delta, 0.1);
    const dt = Math.min(delta, 0.1);

    let pose: EnvelopePose | null = null;
    let scale = 0;
    let flapOpen = 0;
    let glowOpacity = 0;
    let burst = 0;

    if (st.phase === "dropping") {
      if (!s.fall) {
        const start = hangPose(source, s.time, 1);
        s.startScale = HANG_SCALE * source.scale;
        s.startY = start.y;
        s.fall = createEnvelope(start);
      }
      stepEnvelope(s.fall, dt, s.time);
      if (s.fall.landed) markEnvelopeLanded(st);
      pose = s.fall;
      // Grows a little as it nears the ground, so it reads from afar.
      const progress = clamp01(1 - (s.fall.y - REST_Y) / (s.startY - REST_Y));
      scale = lerp(s.startScale, LAND_SCALE, ease(progress));
      glowOpacity = 0.45;
    } else if (st.phase === "opening" || st.phase === "done") {
      const landed = s.fall ?? createEnvelope(hangPose(source, s.time, 0));
      const t = st.phase === "done" ? 99 : st.t;
      const lift = ease(clamp01(t / 1.0));
      pose = {
        x: lerp(landed.x, OPEN_POS[0], lift),
        y: lerp(Math.max(landed.y, REST_Y), OPEN_POS[1], lift),
        z: lerp(landed.z, OPEN_POS[2], lift),
        rx: lerp(landed.rx, 0, lift),
        ry: lerp(wrapPi(landed.ry), 0, lift),
        rz: lerp(landed.rz, 0, lift),
      };
      scale = lerp(LAND_SCALE, OPEN_SCALE, lift);
      flapOpen = ease(clamp01((t - 1.0) / 0.7));
      burst = ease(clamp01((t - 1.5) / 0.7));
      glowOpacity = 0.45 + burst * 0.55;
      // When the ticket card appears the envelope melts away.
      if (st.phase === "done") scale *= 1 - ease(clamp01(st.t / 0.45));
    } else {
      s.fall = null;
    }

    if (!pose) {
      g.visible = false;
      return;
    }
    g.visible = scale > 0.001;
    g.position.set(pose.x, pose.y, pose.z);
    g.rotation.set(pose.rx, pose.ry, pose.rz);
    g.scale.setScalar(scale);
    if (flap.current) flap.current.rotation.x = -flapOpen * Math.PI * 0.92;
    if (glow.current) {
      glow.current.material.opacity = glowOpacity;
      glow.current.scale.setScalar(2.3 + burst * 2.4);
    }

    if (sparkles.current) {
      const spin = 1 + burst * 3;
      for (let i = 0; i < SPARKLES; i++) {
        const a = s.time * (0.6 + (i % 4) * 0.12) * spin + i * 0.7;
        const r = (0.34 + (i % 5) * 0.05) * (1 + burst * 1.6);
        dummy.position.set(Math.cos(a) * r, Math.sin(a * 1.3) * r * 0.6, Math.sin(a) * 0.14);
        dummy.scale.setScalar((0.6 + 0.4 * Math.sin(s.time * 4 + i)) * (1 + burst));
        dummy.updateMatrix();
        sparkles.current.setMatrixAt(i, dummy.matrix);
      }
      sparkles.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[ENV_W, ENV_H, ENV_T]} />
        <meshStandardMaterial color="#f3c64f" metalness={0.35} roughness={0.4} emissive="#b87a00" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0, 0, ENV_T / 2 + 0.002]}>
        <planeGeometry args={[ENV_W * 0.9, ENV_H * 0.84]} />
        <meshStandardMaterial color="#ffd978" metalness={0.3} roughness={0.35} emissive="#c98a10" emissiveIntensity={0.9} />
      </mesh>
      {/* flap, hinged on the top edge */}
      <group ref={flap} position={[0, ENV_H / 2, ENV_T / 2 + 0.006]}>
        <mesh>
          <shapeGeometry args={[flapGeo]} />
          <meshStandardMaterial color="#eab43a" metalness={0.35} roughness={0.4} emissive="#b87a00" emissiveIntensity={0.85} side={2} />
        </mesh>
        <mesh position={[0, -ENV_H * 0.58, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.014, 20]} />
          <meshStandardMaterial color="#b3202a" roughness={0.35} />
        </mesh>
      </group>
      <sprite ref={glow} position={[0, 0, -0.05]}>
        <spriteMaterial
          map={glowMap}
          color={new Color(1.7, 1.1, 0.3)}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
          transparent
        />
      </sprite>
      <instancedMesh ref={sparkles} args={[undefined, undefined, SPARKLES]} frustumCulled={false}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color={new Color(4, 3, 1)} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
