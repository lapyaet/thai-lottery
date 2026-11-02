"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  type Mesh,
  type MeshBasicMaterial,
  type Points,
  type PointsMaterial,
  SRGBColorSpace,
} from "three";
import ChatBackground from "@/component/chat/ChatBackground";
import Robot from "@/component/chat/Robot";
import { stateColor } from "@/component/chat/robotColor";
import { createPose, type Pose, type RobotMode } from "@/lib/robot";
import { mulberry32 } from "@/lib/tree";

const PARTICLES = 70;

type SceneProps = {
  mode: React.RefObject<RobotMode>;
  night: boolean;
  reduced: boolean;
};

function gradientTexture(top: string, bottom: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function blobTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(canvas);
}

function Backdrop({ night }: { night: boolean }) {
  const texture = useMemo(
    () =>
      night
        ? gradientTexture("#070b1d", "#242a63")
        : gradientTexture("#cfe3ff", "#f1e8ff"),
    [night],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 2, -14]}>
      <planeGeometry args={[80, 50]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/** Glossy platform, a pulsing light ring and a soft shadow under the hovering robot. */
function Platform({
  pose,
  night,
}: {
  pose: React.RefObject<Pose>;
  night: boolean;
}) {
  const ring = useRef<Mesh>(null);
  const ringMat = useRef<MeshBasicMaterial>(null);
  const color = useMemo(() => new Color(), []);
  const blob = useMemo(() => blobTexture(), []);
  useEffect(() => () => blob.dispose(), [blob]);

  useFrame(() => {
    const p = pose.current;
    stateColor(color, p, night);
    if (!night) color.multiplyScalar(0.7);
    ringMat.current?.color.copy(color).multiplyScalar(night ? 1.6 : 1);
    if (ringMat.current) ringMat.current.opacity = 0.35 + 0.65 * p.ring;
    ring.current?.scale.setScalar(1 + 0.04 * p.ring);
  });

  return (
    <group position={[0, -1.75, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.9, 2.0, 0.16, 64]} />
        <meshStandardMaterial
          color={night ? "#1b2142" : "#dfe6f5"}
          roughness={0.25}
          metalness={0.5}
        />
      </mesh>
      <mesh ref={ring} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.62, 0.025, 8, 80]} />
        <meshBasicMaterial ref={ringMat} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 2.8]} />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Small dots orbiting the robot; they swirl faster and brighter while it thinks. */
function Particles({
  pose,
  night,
}: {
  pose: React.RefObject<Pose>;
  night: boolean;
}) {
  const points = useRef<Points>(null);
  const material = useRef<PointsMaterial>(null);
  const color = useMemo(() => new Color(), []);
  const seeds = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: PARTICLES }, () => ({
      radius: 1.9 + rand() * 1.4,
      angle: rand() * Math.PI * 2,
      y: -1.2 + rand() * 3.6,
      speed: 0.15 + rand() * 0.35,
    }));
  }, []);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new Float32BufferAttribute(new Float32Array(PARTICLES * 3), 3),
    );
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const p = pose.current;
    const position = geometry.getAttribute("position");
    const t = state.clock.elapsedTime;
    const spin = 0.6 + 2.2 * p.particles;
    seeds.forEach((s, i) => {
      const a = s.angle + t * s.speed * spin;
      position.setXYZ(
        i,
        Math.cos(a) * s.radius,
        s.y + Math.sin(t * 0.8 + i) * 0.15,
        Math.sin(a) * s.radius * 0.5 - 0.6,
      );
    });
    position.needsUpdate = true;
    if (material.current) {
      stateColor(color, p, night);
      if (!night) color.multiplyScalar(0.6);
      material.current.color.copy(color);
      material.current.opacity = 0.15 + 0.75 * p.particles;
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={material}
        size={0.07}
        sizeAttenuation
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

/** Frames the robot on any screen and leans the view a little toward the pointer. */
function Rig({ reduced }: { reduced: boolean }) {
  useFrame(({ camera, size, pointer }, delta) => {
    const aspect = size.width / size.height;
    // fov 35: the robot, platform and title chip need ~6 tall and ~3.8 wide in view.
    const distance = Math.max(9.4, 6.0 / aspect);
    const k = 1 - Math.exp(-3 * Math.min(delta, 0.05));
    const targetX = reduced ? 0 : pointer.x * 0.6;
    const targetY = 0.8 + (reduced ? 0 : pointer.y * 0.25);
    camera.position.x += (targetX - camera.position.x) * k;
    camera.position.y += (targetY - camera.position.y) * k;
    camera.position.z += (distance - camera.position.z) * k;
    camera.lookAt(0, 0.55, 0);
  });
  return null;
}

export default function ChatScene({ mode, night, reduced }: SceneProps) {
  const pose = useRef<Pose>(createPose());

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.8, 9.4], fov: 35 }}
      gl={{ antialias: false }}
    >
      <Backdrop night={night} />
      <ChatBackground pose={pose} night={night} reduced={reduced} />
      <ambientLight intensity={night ? 0.55 : 0.9} />
      <directionalLight
        position={[3, 5, 5]}
        intensity={night ? 1.4 : 2.4}
        color={night ? "#a9bfff" : "#ffffff"}
      />
      <pointLight
        position={[-4, 2, -2]}
        intensity={night ? 30 : 12}
        color={night ? "#6f7dff" : "#ffd6a8"}
        distance={14}
      />

      <Robot mode={mode} pose={pose} night={night} reduced={reduced} />
      <Platform pose={pose} night={night} />
      {!reduced && <Particles pose={pose} night={night} />}
      <Rig reduced={reduced} />

      <EffectComposer multisampling={4}>
        <Bloom
          intensity={night ? 0.9 : 0.5}
          luminanceThreshold={0.95}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
