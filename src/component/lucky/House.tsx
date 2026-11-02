"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CanvasTexture,
  type Group,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
} from "three";
import type { Story } from "@/component/lucky/storyState";
import { doorOpen, HOUSE, HOUSE_YAW, SPOT, START } from "@/lib/story";

const W = 4.2; // along the house's x axis
const D = 3.1; // depth (door side is +z)
const WALL_H = 2.15;
const BASE_H = 0.25;
const WALL_TOP = BASE_H + WALL_H;
const PITCH = 0.55;
const EAVE = 0.45;

function plankTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#c79a64";
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "rgba(90,55,25,0.10)" : "rgba(255,230,190,0.08)";
      ctx.fillRect(i * 16, 0, 16, 128);
      ctx.fillStyle = "rgba(60,35,15,0.55)";
      ctx.fillRect(i * 16, 0, 1.5, 128);
    }
    for (let k = 0; k < 160; k++) {
      ctx.fillStyle = `rgba(70,40,20,${0.03 + Math.random() * 0.05})`;
      ctx.fillRect(
        Math.random() * 128,
        Math.random() * 128,
        1,
        6 + Math.random() * 18,
      );
    }
  }
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(4, 2);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A small wooden village house with a door that swings open, plus the path to the tree. */
export default function House({
  story,
  night,
}: {
  story: React.RefObject<Story>;
  night: boolean;
}) {
  const planks = useMemo(() => plankTexture(), []);
  const door = useRef<Group>(null);
  const gable = useMemo(() => {
    const s = new Shape();
    const half = D / 2 + EAVE * 0.2;
    s.moveTo(-half, 0);
    s.lineTo(half, 0);
    s.lineTo(0, half * Math.tan(PITCH));
    s.closePath();
    return s;
  }, []);

  useFrame(() => {
    const st = story.current;
    if (door.current && st) {
      door.current.rotation.y = -doorOpen(st.phase, st.t) * 1.65;
    }
  });

  const slab = (D / 2 + EAVE) / Math.cos(PITCH);
  const rise = ((D / 2 + EAVE) / 2) * Math.tan(PITCH);
  const lit = night ? "#ffcf70" : "#3d5a73";

  // Path from the door to the spot at the tree, in world space.
  const dx = SPOT[0] - START[0];
  const dz = SPOT[2] - START[2];
  const pathLen = Math.hypot(dx, dz);

  return (
    <>
      <group
        position={[(START[0] + SPOT[0]) / 2, 0.012, (START[2] + SPOT[2]) / 2]}
        rotation={[0, Math.atan2(dx, dz), 0]}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.05, pathLen + 0.6]} />
          <meshStandardMaterial color="#b49a6c" roughness={1} />
        </mesh>
      </group>

      <group position={HOUSE} rotation={[0, HOUSE_YAW, 0]}>
        {/* foundation */}
        <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W + 0.3, BASE_H, D + 0.3]} />
          <meshStandardMaterial color="#8a857b" roughness={1} />
        </mesh>
        {/* walls */}
        <mesh position={[0, BASE_H + WALL_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, WALL_H, D]} />
          <meshStandardMaterial map={planks} roughness={0.9} />
        </mesh>

        {/* gable ends */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[(side * W) / 2, WALL_TOP, 0]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
          >
            <extrudeGeometry
              args={[gable, { depth: 0.08, bevelEnabled: false }]}
            />
            <meshStandardMaterial color="#b98a55" roughness={0.9} />
          </mesh>
        ))}

        {/* roof: two slanted slabs with overhang */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[0, WALL_TOP + rise + 0.04, (side * (D / 2 + EAVE)) / 2]}
            rotation={[side * PITCH, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[W + 0.9, 0.08, slab]} />
            <meshStandardMaterial color="#8a4632" roughness={0.75} />
          </mesh>
        ))}
        <mesh
          position={[0, WALL_TOP + (D / 2) * Math.tan(PITCH) + 0.1, 0]}
          castShadow
        >
          <boxGeometry args={[W + 0.95, 0.1, 0.22]} />
          <meshStandardMaterial color="#5f2e22" roughness={0.8} />
        </mesh>

        {/* doorway, dark inside */}
        <mesh position={[0, BASE_H + 0.78, D / 2 - 0.03]}>
          <boxGeometry args={[0.8, 1.56, 0.08]} />
          <meshStandardMaterial
            color="#1b120c"
            roughness={1}
            emissive={night ? "#5a3210" : "#000000"}
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* door: hinged on its left edge */}
        <group ref={door} position={[-0.4, BASE_H, D / 2 + 0.03]}>
          <mesh position={[0.4, 0.78, 0]} castShadow>
            <boxGeometry args={[0.8, 1.56, 0.06]} />
            <meshStandardMaterial color="#5a3420" roughness={0.9} />
          </mesh>
          <mesh position={[0.72, 0.78, 0.05]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial
              color="#d6b04a"
              metalness={0.8}
              roughness={0.35}
            />
          </mesh>
        </group>
        {/* step */}
        <mesh position={[0, BASE_H / 2, D / 2 + 0.3]} receiveShadow castShadow>
          <boxGeometry args={[1.1, BASE_H, 0.5]} />
          <meshStandardMaterial color="#9a9488" roughness={1} />
        </mesh>

        {/* windows */}
        {[-1.4, 1.65].map((x) => (
          <group key={x} position={[x, BASE_H + 1.15, D / 2 + 0.02]}>
            <mesh>
              <boxGeometry args={[0.78, 0.78, 0.06]} />
              <meshStandardMaterial color="#5a3420" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.035]}>
              <boxGeometry args={[0.6, 0.6, 0.03]} />
              <meshStandardMaterial
                color={lit}
                emissive={night ? "#ffb347" : "#000000"}
                emissiveIntensity={night ? 1.6 : 0}
                roughness={0.2}
                metalness={night ? 0 : 0.3}
              />
            </mesh>
            <mesh position={[0, 0, 0.055]}>
              <boxGeometry args={[0.04, 0.6, 0.02]} />
              <meshStandardMaterial color="#5a3420" />
            </mesh>
            <mesh position={[0, 0, 0.055]}>
              <boxGeometry args={[0.6, 0.04, 0.02]} />
              <meshStandardMaterial color="#5a3420" />
            </mesh>
          </group>
        ))}

        {/* porch lantern: glows at night */}
        <mesh position={[0.85, BASE_H + 1.85, D / 2 + 0.2]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#ffd27a"
            emissive="#ffb347"
            emissiveIntensity={night ? 3 : 0.2}
          />
        </mesh>
        {night && (
          <pointLight
            position={[0.85, BASE_H + 1.8, D / 2 + 0.5]}
            color="#ffb45c"
            intensity={9}
            distance={9}
            decay={2}
          />
        )}
      </group>
    </>
  );
}
