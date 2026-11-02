"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type Group, type Mesh, MeshBasicMaterial } from "three";
import { stateColor } from "@/component/chat/robotColor";
import {
  approachPose,
  blinkOpen,
  type Pose,
  type RobotMode,
  robotPose,
} from "@/lib/robot";

const PEARL = { color: "#f2f4fa", roughness: 0.32, metalness: 0.15 } as const;
const GOLD = { color: "#f2b13c", roughness: 0.3, metalness: 0.7 } as const;
const JOINT = { color: "#8d96ad", roughness: 0.4, metalness: 0.6 } as const;

type Props = {
  /** Current behaviour; read every frame so changes never re-render React. */
  mode: React.RefObject<RobotMode>;
  /** Live pose, shared so the ring and particles can follow the robot. */
  pose: React.RefObject<Pose>;
  night: boolean;
  /** Reduced motion: hold each state's pose still, only blink. */
  reduced: boolean;
};

function Arm({
  side,
  shoulder,
  elbow,
}: {
  side: -1 | 1;
  shoulder: React.RefObject<Group | null>;
  elbow: React.RefObject<Group | null>;
}) {
  return (
    <group ref={shoulder} position={[side * 0.68, 0.45, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 20, 20]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0, -0.27, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.28, 8, 16]} />
        <meshStandardMaterial {...PEARL} />
      </mesh>
      <group ref={elbow} position={[0, -0.52, 0]}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial {...JOINT} />
        </mesh>
        <mesh position={[0, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.26, 8, 16]} />
          <meshStandardMaterial {...PEARL} />
        </mesh>
        <mesh position={[0, -0.52, 0]} castShadow>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      </group>
    </group>
  );
}

/** A friendly hovering robot built from primitives; `robotPose` decides how it moves. */
export default function Robot({ mode, pose, night, reduced }: Props) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null);
  const rightEye = useRef<Mesh>(null);
  const mouth = useRef<Mesh>(null);
  const bulb = useRef<Mesh>(null);
  const jet = useRef<Mesh>(null);
  const lShoulder = useRef<Group>(null);
  const lElbow = useRef<Group>(null);
  const rShoulder = useRef<Group>(null);
  const rElbow = useRef<Group>(null);
  const bulbMat = useRef<MeshBasicMaterial>(null);
  const jetMat = useRef<MeshBasicMaterial>(null);
  const color = useMemo(() => new Color(), []);
  // One glowing material shared by the eyes, mouth and chest core.
  const light = useMemo(
    () => new MeshBasicMaterial({ color: "#5ff5ff", toneMapped: false }),
    [],
  );
  useEffect(() => () => light.dispose(), [light]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = reduced ? 0 : state.clock.elapsedTime;
    const p = approachPose(pose.current, robotPose(mode.current, t), dt);
    const blink = blinkOpen(state.clock.elapsedTime);

    if (root.current) {
      root.current.position.y = p.bob;
      root.current.rotation.z = p.bodyTilt;
    }
    head.current?.rotation.set(p.headPitch, p.headYaw, p.headRoll);
    // Positive "forward" lifts an arm toward the viewer; "out" lifts it sideways.
    lShoulder.current?.rotation.set(-p.lShoulderFwd, 0, -p.lShoulderOut);
    rShoulder.current?.rotation.set(-p.rShoulderFwd, 0, p.rShoulderOut);
    lElbow.current?.rotation.set(-p.lElbow, 0, 0);
    rElbow.current?.rotation.set(-p.rElbow, 0, 0);

    // Eyes: bars that blink, squint when happy, shrink to scanning dots when thinking.
    const open = Math.max(0.06, p.eyeOpen * blink);
    const scanX = Math.sin(state.clock.elapsedTime * 3.2) * 0.12 * p.eyeScan;
    for (const [eye, side] of [
      [leftEye.current, -1],
      [rightEye.current, 1],
    ] as const) {
      if (!eye) continue;
      eye.scale.set(
        1 - 0.55 * p.eyeScan,
        open * (1 - 0.5 * p.eyeSmile) * (1 - 0.2 * p.eyeScan),
        1,
      );
      eye.position.set(side * 0.22 + scanX, 0.57 + 0.025 * p.eyeSmile, 0.52);
      eye.rotation.z = -side * 0.35 * p.eyeSmile;
    }
    if (mouth.current) {
      mouth.current.scale.set(0.5 + 0.5 * p.talk, 0.35 + 4 * p.talk, 1);
    }

    stateColor(color, p, night);
    const glow = 0.6 + p.antennaGlow;
    light.color.copy(color).multiplyScalar(1.5);
    bulbMat.current?.color.copy(color).multiplyScalar(0.6 + glow);
    bulb.current?.scale.setScalar(1 + 0.25 * p.antennaGlow);
    jetMat.current?.color.copy(color);
    if (jet.current) {
      jet.current.scale.set(1, 0.85 + 0.25 * Math.sin(state.clock.elapsedTime * 18), 1);
    }
  });

  return (
    <group ref={root}>
      {/* torso */}
      <mesh scale={[1, 1, 0.86]} castShadow>
        <capsuleGeometry args={[0.52, 0.62, 10, 28]} />
        <meshStandardMaterial {...PEARL} />
      </mesh>
      <RoundedBox
        args={[0.6, 0.46, 0.08]}
        radius={0.06}
        position={[0, 0.12, 0.46]}
      >
        <meshStandardMaterial {...GOLD} />
      </RoundedBox>
      <mesh position={[0, 0.12, 0.52]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <primitive object={light} attach="material" />
      </mesh>
      <mesh position={[0, -0.32, 0]} scale={[1, 1, 0.86]}>
        <torusGeometry args={[0.51, 0.025, 8, 40]} />
        <meshStandardMaterial {...JOINT} />
      </mesh>

      {/* neck + head (pivots at the neck) */}
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.2, 16]} />
        <meshStandardMaterial {...JOINT} />
      </mesh>
      <group ref={head} position={[0, 0.98, 0]}>
        <RoundedBox args={[1.15, 0.85, 0.95]} radius={0.3} smoothness={5} position={[0, 0.5, 0]} castShadow>
          <meshStandardMaterial {...PEARL} />
        </RoundedBox>
        <RoundedBox args={[0.96, 0.56, 0.1]} radius={0.15} smoothness={4} position={[0, 0.5, 0.45]}>
          <meshStandardMaterial color="#0b1020" roughness={0.12} metalness={0.7} />
        </RoundedBox>
        <mesh ref={leftEye} position={[-0.22, 0.57, 0.52]}>
          <planeGeometry args={[0.2, 0.14]} />
          <primitive object={light} attach="material" />
        </mesh>
        <mesh ref={rightEye} position={[0.22, 0.57, 0.52]}>
          <planeGeometry args={[0.2, 0.14]} />
          <primitive object={light} attach="material" />
        </mesh>
        <mesh ref={mouth} position={[0, 0.37, 0.52]}>
          <planeGeometry args={[0.2, 0.04]} />
          <primitive object={light} attach="material" />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.62, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
            <meshStandardMaterial {...GOLD} />
          </mesh>
        ))}
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
          <meshStandardMaterial {...JOINT} />
        </mesh>
        <mesh ref={bulb} position={[0, 1.27, 0]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshBasicMaterial ref={bulbMat} toneMapped={false} />
        </mesh>
      </group>

      <Arm side={-1} shoulder={lShoulder} elbow={lElbow} />
      <Arm side={1} shoulder={rShoulder} elbow={rElbow} />

      {/* hover jet */}
      <mesh ref={jet} position={[0, -1.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 0.5, 24, 1, true]} />
        <meshBasicMaterial ref={jetMat} transparent opacity={0.45} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
