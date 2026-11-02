"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  type MeshBasicMaterial,
  NormalBlending,
  type PointsMaterial,
  type ShaderMaterial,
  SRGBColorSpace,
} from "three";
import { stateColor } from "@/component/chat/robotColor";
import type { Pose } from "@/lib/robot";
import { mulberry32 } from "@/lib/tree";

type Props = {
  pose: React.RefObject<Pose>;
  night: boolean;
  reduced: boolean;
};

const BALL_COLORS = ["#e5484d", "#f5a524", "#3b82f6", "#22c55e", "#a855f7", "#ec4899"];
const BALL_NUMBERS = ["7", "3", "1", "9", "5", "2", "8", "4", "6", "0", "7", "1"];

function orbTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(canvas);
}

/** A lottery ball: colour with a white disc and a digit on opposite sides. */
function ballTexture(num: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 128);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const x of [64, 192]) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(x, 64, 30, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1b1b2f";
      ctx.font = "bold 52px sans-serif";
      ctx.fillText(num, x, 68);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

type BallSpec = {
  position: [number, number, number];
  radius: number;
  speed: number;
  phase: number;
  num: string;
  color: string;
};

function Ball({ spec, reduced }: { spec: BallSpec; reduced: boolean }) {
  const group = useRef<Group>(null);
  const texture = useMemo(
    () => ballTexture(spec.num, spec.color),
    [spec.num, spec.color],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    if (!group.current || reduced) return;
    const t = state.clock.elapsedTime;
    group.current.position.y =
      spec.position[1] + Math.sin(t * spec.speed + spec.phase) * 0.3;
    group.current.rotation.y = t * 0.3 * spec.speed + spec.phase;
  });

  return (
    <group ref={group} position={spec.position}>
      <mesh>
        <sphereGeometry args={[spec.radius, 32, 24]} />
        <meshStandardMaterial map={texture} roughness={0.25} metalness={0.1} />
      </mesh>
    </group>
  );
}

const GRID_VERTEX = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }
`;
const GRID_FRAGMENT = /* glsl */ `
  varying vec3 vPos;
  uniform vec3 uColor;
  uniform float uStrength;
  uniform float uTime;
  void main() {
    vec2 p = vec2(vPos.x, vPos.z + uTime * 0.4);
    vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float fade = smoothstep(18.0, 2.5, length(vPos.xz));
    gl_FragColor = vec4(uColor, line * fade * uStrength);
  }
`;

/** Layers behind the robot: glow orbs, stars, HUD rings, lottery balls and a grid floor. */
export default function ChatBackground({ pose, night, reduced }: Props) {
  const orbs = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const ringA = useRef<Group>(null);
  const ringB = useRef<Group>(null);
  const ringMatA = useRef<MeshBasicMaterial>(null);
  const ringMatB = useRef<MeshBasicMaterial>(null);
  const grid = useRef<ShaderMaterial>(null);
  const stars = useRef<PointsMaterial>(null);
  const color = useMemo(() => new Color(), []);
  const orb = useMemo(() => orbTexture(), []);
  useEffect(() => () => orb.dispose(), [orb]);

  const gridUniforms = useMemo(
    () => ({
      uColor: { value: new Color() },
      uStrength: { value: 0.6 },
      uTime: { value: 0 },
    }),
    [],
  );

  const balls = useMemo<BallSpec[]>(() => {
    const rand = mulberry32(21);
    return BALL_NUMBERS.map((num, i) => {
      const side = i % 2 ? 1 : -1;
      return {
        position: [
          side * (2.4 + rand() * 2.2),
          -0.9 + rand() * 3.8,
          -2 - rand() * 4.5,
        ],
        radius: 0.2 + rand() * 0.18,
        speed: 0.5 + rand() * 0.6,
        phase: rand() * Math.PI * 2,
        num,
        color: BALL_COLORS[i % BALL_COLORS.length],
      };
    });
  }, []);

  const starGeometry = useMemo(() => {
    const rand = mulberry32(5);
    const positions = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      positions[i * 3] = (rand() - 0.5) * 44;
      positions[i * 3 + 1] = -3 + rand() * 20;
      positions[i * 3 + 2] = -13;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return g;
  }, []);
  useEffect(() => () => starGeometry.dispose(), [starGeometry]);

  useFrame((state) => {
    const p = pose.current;
    const t = reduced ? 0 : state.clock.elapsedTime;

    stateColor(color, p, night);
    if (!night) color.multiplyScalar(0.75);

    if (orbs.current) {
      orbs.current.children.forEach((child, i) => {
        child.position.x = [-5.5, 5.5, 0][i] + Math.sin(t * 0.15 + i * 2) * 1.2;
        child.position.y = [3, -0.5, 5.5][i] + Math.cos(t * 0.12 + i) * 0.8;
      });
    }
    if (ringA.current) ringA.current.rotation.z = t * 0.25;
    if (ringB.current) ringB.current.rotation.z = -t * 0.17 + 1.2;
    for (const mat of [ringMatA.current, ringMatB.current]) {
      if (!mat) continue;
      mat.color.copy(color).multiplyScalar(night ? 1.5 : 1);
      mat.opacity = (night ? 0.28 : 0.3) + 0.35 * p.ring;
    }
    if (rings.current) rings.current.scale.setScalar(1 + 0.03 * p.ring);

    if (grid.current) {
      grid.current.uniforms.uColor.value.copy(color);
      grid.current.uniforms.uStrength.value = (night ? 0.5 : 0.55) + 0.35 * p.ring;
      grid.current.uniforms.uTime.value = t;
    }
    if (stars.current) stars.current.opacity = 0.55 + 0.35 * Math.sin(t * 1.3);
  });

  const blending = night ? AdditiveBlending : NormalBlending;
  const orbOpacity = night ? 0.5 : 0.45;

  return (
    <>
      <group ref={orbs}>
        {(
          [
            ["#7c5cff", 11],
            ["#22d3ee", 10],
            ["#ff6ec7", 12],
          ] as const
        ).map(([tint, size], i) => (
          <sprite key={tint} position={[0, 0, -11 - i]} scale={[size, size, 1]}>
            <spriteMaterial
              map={orb}
              color={tint}
              transparent
              opacity={orbOpacity}
              depthWrite={false}
              blending={blending}
              toneMapped={false}
            />
          </sprite>
        ))}
      </group>

      {night && (
        <points geometry={starGeometry} frustumCulled={false}>
          <pointsMaterial
            ref={stars}
            color="#cdd8ff"
            size={0.09}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      )}

      {/* HUD-style arcs turning slowly behind the robot */}
      <group ref={rings} position={[0, 0.35, -3.2]}>
        <group ref={ringA}>
          <mesh>
            <ringGeometry args={[3.5, 3.55, 96, 1, 0, 4.4]} />
            <meshBasicMaterial
              ref={ringMatA}
              transparent
              side={DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
        <group ref={ringB}>
          <mesh>
            <ringGeometry args={[4.3, 4.34, 96, 1, 0, 2.6]} />
            <meshBasicMaterial
              ref={ringMatB}
              transparent
              side={DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      {balls.map((spec) => (
        <Ball key={`${spec.num}-${spec.position[0]}`} spec={spec} reduced={reduced} />
      ))}

      {/* glowing grid floor, flowing toward the viewer */}
      <mesh position={[0, -1.84, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        <shaderMaterial
          ref={grid}
          uniforms={gridUniforms}
          vertexShader={GRID_VERTEX}
          fragmentShader={GRID_FRAGMENT}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
