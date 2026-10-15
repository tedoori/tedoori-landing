"use client";

import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MatCat } from "./materials";

// 조각마다: 모델 파일, 맞출 크기(가장 긴 변), 놓을 자리(x, z), 회전, 크기를 재는 축
type Piece = { url: string; size: number; x: number; z: number; rot: number; axis?: "y"; flat?: number };
export const PIECES: Record<MatCat | "base", Piece> = {
  base: { url: "/kit/base.glb", size: 2, x: 0, z: 0, rot: 0 },
  잔디: { url: "/kit/lawn.glb", size: 1.92, x: 0, z: 0, rot: 0, flat: 0.35 },
  자갈: { url: "/kit/gravel.glb", size: 1.15, x: -0.76, z: 0.3, rot: Math.PI / 2 },
  디딤석: { url: "/kit/stone.glb", size: 1.05, x: 0.2, z: 0.35, rot: -0.75 },
  화단: { url: "/kit/bed.glb", size: 0.85, x: 0.42, z: -0.58, rot: 0 },
  식재: { url: "/kit/tree.glb", size: 1.45, x: -0.55, z: -0.55, rot: 0.6, axis: "y" },
};

/** 모델을 정해진 크기로 맞추고 바닥(아래면)을 y=0 에 둔 복제본 */
function useFitted(url: string, size: number, axis?: "y") {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(root);
    const dim = box.getSize(new THREE.Vector3());
    const s = size / (axis === "y" ? dim.y : Math.max(dim.x, dim.z));
    root.scale.setScalar(s);
    const c = box.getCenter(new THREE.Vector3());
    root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    const g = new THREE.Group();
    g.add(root);
    return { group: g, height: dim.y * s };
  }, [scene, size, axis]);
}

const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeOutBounce = (t: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

/** 켜지면 위에서 떨어져 내려앉고, 꺼지면 작아지며 사라짐 */
function DropPiece({ piece, on, baseY }: { piece: Piece; on: boolean; baseY: number }) {
  const { group } = useFitted(piece.url, piece.size, piece.axis);
  const ref = useRef<THREE.Group>(null);
  const t = useRef(on ? 1 : 0);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    t.current = THREE.MathUtils.clamp(t.current + (on ? dt / 0.7 : -dt / 0.35), 0, 1);
    const k = t.current;
    g.visible = k > 0.001;
    // 켜질 때: 위에서 통통 튀며 내려앉음 / 꺼질 때: 제자리에서 작아짐
    g.position.y = baseY + (on ? (1 - easeOutBounce(k)) * 1.3 : 0);
    g.scale.setScalar(Math.max(0.001, on ? Math.min(1, 0.85 + k * 0.15) : easeOutBack(k)));
  });
  return (
    <group ref={ref} position={[piece.x, baseY, piece.z]} rotation={[0, piece.rot, 0]}>
      <group scale={[1, piece.flat ?? 1, 1]}>
        <primitive object={group} />
      </group>
    </group>
  );
}

// 흙 블록은 납작하게(원래 높이의 45%) 눌러서 위에 얹힌 것들이 주인공이 되게
const BASE_FLAT = 0.45;
function Base() {
  const { group, height } = useFitted(PIECES.base.url, PIECES.base.size);
  // 흙 블록 윗면이 y=0 이 되도록 내림
  return (
    <group position={[0, -height * BASE_FLAT, 0]} scale={[1, BASE_FLAT, 1]}>
      <primitive object={group} />
    </group>
  );
}

function Kit({ on }: { on: MatCat[] }) {
  const lawn = useFitted(PIECES.잔디.url, PIECES.잔디.size);
  const top = on.includes("잔디") ? lawn.height * (PIECES.잔디.flat ?? 1) * 0.9 : 0.01;
  return (
    <group>
      <Base />
      <DropPiece piece={PIECES.잔디} on={on.includes("잔디")} baseY={0.005} />
      {(["자갈", "디딤석", "화단", "식재"] as const).map((c) => (
        <DropPiece key={c} piece={PIECES[c]} on={on.includes(c)} baseY={top} />
      ))}
    </group>
  );
}

export default function YardKit3D({ on, interactive }: { on: MatCat[]; interactive: boolean }) {
  const reduce = useRef(false);
  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [3.6, 3.1, 3.6], fov: 34 }} gl={{ antialias: true }}>
      <hemisphereLight args={["#ffffff", "#d9cdb4", 1.1]} />
      <directionalLight position={[3, 5, 2]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        <group position={[0, -0.05, 0]}>
          <Kit on={on} />
        </group>
        <ContactShadows position={[0, -0.6, 0]} opacity={0.35} blur={2.8} scale={6} far={2} />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={interactive}
        autoRotate={!reduce.current}
        autoRotateSpeed={0.6}
        minPolarAngle={0.6}
        maxPolarAngle={1.25}
        target={[0, 0.15, 0]}
      />
    </Canvas>
  );
}

Object.values(PIECES).forEach((p) => useGLTF.preload(p.url));
