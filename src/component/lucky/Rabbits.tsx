"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { furTexture } from "@/component/lucky/clothTextures";
import {
  createRabbits,
  type Rabbit,
  type RabbitPose,
  rabbitPose,
  stepRabbits,
} from "@/lib/rabbit";
import { mulberry32 } from "@/lib/tree";

type Parts = {
  root: Group | null;
  pitch: Group | null;
  head: Group | null;
  earL: Group | null;
  earR: Group | null;
  nose: Group | null;
  front: Group | null;
  hind: Group | null;
};

/** Fur colours: a brown, a grey and a cream rabbit. */
const COATS = [
  { fur: "#a9835a", belly: "#e8dcc2" },
  { fur: "#8d8d90", belly: "#d9d9d6" },
  { fur: "#ece6da", belly: "#ffffff" },
];

const SCALE = 1.4;
const PIVOT: [number, number, number] = [0, 0.1, -0.12];

/** Poses a rabbit rig; kept outside the component so it can mutate freely. */
function applyRabbit(p: Parts, pose: RabbitPose, time: number) {
  if (!p.root || !p.pitch) return;
  p.root.position.set(pose.x, pose.y, pose.z);
  p.root.rotation.y = pose.yaw + pose.twist;
  p.root.rotation.z = Math.sin(pose.twist) * 0.35;
  p.pitch.rotation.x = -pose.pitch;
  const still = pose.stretch === 0 && pose.pitch === 0;
  p.pitch.scale.y = still ? 1 + Math.sin(time * 5.5) * 0.012 : 1;

  if (p.head) p.head.rotation.x = pose.headDown - pose.pitch * 0.25;
  if (p.earL) {
    p.earL.rotation.z = 0.32 + pose.ears;
    p.earL.rotation.x = -0.3 - pose.ears * 0.8;
  }
  if (p.earR) {
    p.earR.rotation.z = -(0.32 + pose.ears);
    p.earR.rotation.x = -0.3 - pose.ears * 0.8;
  }
  if (p.nose) p.nose.scale.setScalar(1 + Math.sin(time * 17) * 0.12);
  // Front paws reach in a hop and tuck in when standing up.
  if (p.front)
    p.front.rotation.x = pose.pitch > 0.4 ? -0.7 : -pose.stretch * 0.95;
  // Hind legs push off, and plant flat when the body rears up.
  if (p.hind) p.hind.rotation.x = pose.stretch * 0.85 + pose.pitch * 0.95;
}

function RabbitModel({
  index,
  sim,
}: {
  index: number;
  sim: React.RefObject<Rabbit[]>;
}) {
  const fur = useMemo(() => furTexture(), []);
  const coat = COATS[index % COATS.length];
  const root = useRef<Group>(null);
  const pitch = useRef<Group>(null);
  const head = useRef<Group>(null);
  const earL = useRef<Group>(null);
  const earR = useRef<Group>(null);
  const nose = useRef<Group>(null);
  const front = useRef<Group>(null);
  const hind = useRef<Group>(null);

  useFrame(({ clock }) => {
    const r = sim.current?.[index];
    if (!r) return;
    const parts: Parts = {
      root: root.current,
      pitch: pitch.current,
      head: head.current,
      earL: earL.current,
      earR: earR.current,
      nose: nose.current,
      front: front.current,
      hind: hind.current,
    };
    applyRabbit(parts, rabbitPose(r, clock.elapsedTime), clock.elapsedTime);
  });

  const fm = (color: string) => (
    <meshStandardMaterial
      color={color}
      map={fur}
      bumpMap={fur}
      bumpScale={0.6}
      roughness={1}
    />
  );
  const ellipsoid = (
    pos: [number, number, number],
    semi: [number, number, number],
    color: string,
  ) => (
    <mesh position={pos} scale={semi} castShadow receiveShadow>
      <sphereGeometry args={[1, 24, 18]} />
      {fm(color)}
    </mesh>
  );

  const ear = (side: 1 | -1) => (
    <group
      ref={side === 1 ? earL : earR}
      position={[side * 0.032, 0.085, -0.01]}
    >
      <mesh position={[0, 0.075, 0]} scale={[0.5, 1, 0.3]} castShadow>
        <capsuleGeometry args={[0.03, 0.1, 6, 12]} />
        {fm(coat.fur)}
      </mesh>
      <mesh position={[0, 0.07, 0.006]} scale={[0.34, 0.9, 0.2]}>
        <capsuleGeometry args={[0.026, 0.08, 6, 10]} />
        <meshStandardMaterial color="#e8a3a0" roughness={0.8} />
      </mesh>
    </group>
  );

  const whiskers = ([1, -1] as const).flatMap((side) =>
    [-0.25, 0, 0.25].map((a) => (
      <mesh
        key={`${side}${a}`}
        position={[side * 0.055, 0.0, 0.125]}
        rotation={[0, side * (0.9 + a * 0.3), a * 0.4]}
      >
        <boxGeometry args={[0.085, 0.0016, 0.0016]} />
        <meshStandardMaterial color="#f4f0e8" roughness={0.6} />
      </mesh>
    )),
  );

  return (
    <group ref={root} scale={SCALE}>
      <group position={PIVOT}>
        <group ref={pitch}>
          <group position={[-PIVOT[0], -PIVOT[1], -PIVOT[2]]}>
            {ellipsoid([0, 0.155, 0.0], [0.105, 0.095, 0.2], coat.fur)}
            {ellipsoid([0, 0.14, 0.0], [0.09, 0.07, 0.18], coat.belly)}
            {ellipsoid([0, 0.165, -0.1], [0.125, 0.125, 0.135], coat.fur)}
            {ellipsoid([0, 0.15, 0.1], [0.09, 0.09, 0.11], coat.fur)}

            {/* tail */}
            <mesh position={[0, 0.2, -0.235]} castShadow>
              <sphereGeometry args={[0.042, 14, 12]} />
              {fm("#fbf8f1")}
            </mesh>

            {/* head */}
            <group ref={head} position={[0, 0.21, 0.17]}>
              {ellipsoid([0, 0.03, 0.04], [0.07, 0.066, 0.092], coat.fur)}
              {ellipsoid([0, 0.0, 0.105], [0.037, 0.034, 0.05], coat.belly)}
              {ellipsoid([-0.036, -0.004, 0.07], [0.045, 0.04, 0.05], coat.fur)}
              {ellipsoid([0.036, -0.004, 0.07], [0.045, 0.04, 0.05], coat.fur)}
              <group ref={nose} position={[0, 0.012, 0.152]}>
                <mesh>
                  <sphereGeometry args={[0.0125, 10, 8]} />
                  <meshStandardMaterial color="#d98a8a" roughness={0.5} />
                </mesh>
              </group>
              {([1, -1] as const).map((side) => (
                <group key={side} position={[side * 0.057, 0.052, 0.07]}>
                  <mesh>
                    <sphereGeometry args={[0.0145, 12, 10]} />
                    <meshStandardMaterial
                      color="#120c08"
                      roughness={0.15}
                      metalness={0.2}
                    />
                  </mesh>
                  <mesh position={[side * 0.004, 0.005, 0.011]}>
                    <sphereGeometry args={[0.0035, 6, 6]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                </group>
              ))}
              {ear(1)}
              {ear(-1)}
              {whiskers}
            </group>

            {/* front paws */}
            <group ref={front} position={[0, 0.12, 0.1]}>
              {([1, -1] as const).map((side) => (
                <group key={side} position={[side * 0.04, 0, 0]}>
                  <mesh position={[0, -0.065, 0]} castShadow>
                    <capsuleGeometry args={[0.018, 0.08, 6, 10]} />
                    {fm(coat.fur)}
                  </mesh>
                  <mesh
                    position={[0, -0.12, 0.012]}
                    scale={[1, 0.7, 1.4]}
                    castShadow
                  >
                    <sphereGeometry args={[0.02, 10, 8]} />
                    {fm(coat.belly)}
                  </mesh>
                </group>
              ))}
            </group>

            {/* hind feet */}
            <group ref={hind} position={[0, 0.09, -0.14]}>
              {([1, -1] as const).map((side) => (
                <mesh
                  key={side}
                  position={[side * 0.075, -0.06, 0.055]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                >
                  <capsuleGeometry args={[0.022, 0.12, 6, 10]} />
                  {fm(coat.belly)}
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Three rabbits: two playing chase and leaping, one nibbling and looking around. */
export default function Rabbits() {
  const sim = useRef<Rabbit[]>([]);
  const rnd = useRef<(() => number) | null>(null);

  useFrame((_, delta) => {
    if (!rnd.current) {
      rnd.current = mulberry32(31);
      sim.current = createRabbits(rnd.current);
    }
    stepRabbits(sim.current, Math.min(delta, 0.1), rnd.current);
  }, -2);

  return (
    <>
      {COATS.map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed set of three
        <RabbitModel key={i} index={i} sim={sim} />
      ))}
    </>
  );
}
