"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, type InstancedMesh, Object3D } from "three";
import {
  makeBody,
  makeClosedFlap,
  makeSeal,
  makeString,
} from "@/component/lucky/envelopeGeometry";
import type { Story } from "@/component/lucky/storyState";
import { type HangingEnvelope, hangPose } from "@/lib/envelope";

/** Overall size of a hanging envelope relative to the base geometry. */
export const HANG_SCALE = 1.25;
const STRING = 0.5;

/**
 * Many golden envelopes hanging on strings among the branches. They all swing
 * when the tree is shaken, but only the chosen one ever comes loose (it is
 * hidden here once the real, falling envelope takes over).
 */
export default function HangingEnvelopes({
  story,
  envelopes,
  chosen,
}: {
  story: React.RefObject<Story>;
  envelopes: HangingEnvelope[];
  chosen: number;
}) {
  const bodyGeo = useMemo(() => makeBody(), []);
  const flapGeo = useMemo(() => makeClosedFlap(), []);
  const sealGeo = useMemo(() => makeSeal(), []);
  const stringGeo = useMemo(() => makeString(STRING), []);
  const dummy = useMemo(() => {
    const o = new Object3D();
    o.rotation.order = "YXZ";
    return o;
  }, []);
  const body = useRef<InstancedMesh>(null);
  const flap = useRef<InstancedMesh>(null);
  const seal = useRef<InstancedMesh>(null);
  const strings = useRef<InstancedMesh>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1);
    const st = story.current;
    const shake = st?.shake ?? 0;
    const gone = st
      ? ["dropping", "opening", "done"].includes(st.phase)
      : false;
    const meshes = [body.current, flap.current, seal.current, strings.current];
    if (meshes.some((m) => !m)) return;

    envelopes.forEach((e, i) => {
      const p = hangPose(e, time.current, shake);
      const size = HANG_SCALE * e.scale;
      const swing = STRING * size;
      // Swing like a pendulum about the point the string is tied to.
      dummy.position.set(
        p.x + Math.sin(p.rz) * swing,
        p.y + (1 - Math.cos(p.rz)) * swing,
        p.z,
      );
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.setScalar(gone && i === chosen ? 0 : size);
      dummy.updateMatrix();
      for (const m of meshes) m?.setMatrixAt(i, dummy.matrix);
    });
    for (const m of meshes) {
      if (m) m.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={body}
        args={[bodyGeo, undefined, envelopes.length]}
        frustumCulled={false}
        castShadow
      >
        <meshStandardMaterial
          color="#f3c64f"
          metalness={0.35}
          roughness={0.4}
          emissive="#b87a00"
          emissiveIntensity={0.85}
        />
      </instancedMesh>
      <instancedMesh
        ref={flap}
        args={[flapGeo, undefined, envelopes.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#d49a1f"
          metalness={0.3}
          roughness={0.45}
          emissive="#8a5a00"
          emissiveIntensity={0.7}
          side={DoubleSide}
        />
      </instancedMesh>
      <instancedMesh
        ref={seal}
        args={[sealGeo, undefined, envelopes.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial color="#b3202a" roughness={0.35} />
      </instancedMesh>
      <instancedMesh
        ref={strings}
        args={[stringGeo, undefined, envelopes.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial color="#6b4a22" roughness={1} />
      </instancedMesh>
    </>
  );
}
