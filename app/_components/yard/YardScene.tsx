"use client";

import { Line } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { Line2 } from "three-stdlib";
import { appearOf, clamp01, WORK_STEP_IDS } from "./steps";

type WorkId = (typeof WORK_STEP_IDS)[number];
type ProgressRef = MutableRefObject<number>;
export type TagRefs = MutableRefObject<Partial<Record<WorkId, HTMLElement | null>>>;

const GREEN = "#1DA049";

// ---------- 공통 도구 ----------

const ProgressCtx = createContext<ProgressRef | null>(null);
const useP = () => useContext(ProgressCtx)!;
type AppearFn = (w: WorkId) => number;
const AppearCtx = createContext<AppearFn>(() => 0);
const useA = () => useContext(AppearCtx);

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.3;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 흙·잔디 같은 바닥 질감을 캔버스로 그려 만듦 */
function speckleTexture(base: string, dots: string[], count: number, repeat: number, seed: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    g.fillStyle = dots[Math.floor(r() * dots.length)];
    g.globalAlpha = 0.35 + r() * 0.5;
    const s = 1 + r() * 2.5;
    g.fillRect(r() * 256, r() * 256, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** 꼭짓점을 살짝 흔들어 돌·나뭇잎 덩어리를 자연스럽게 */
function lumpy(geo: THREE.BufferGeometry, amount: number, seed: number) {
  const pos = geo.getAttribute("position");
  const r = rng(seed);
  const map = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!map.has(k)) map.set(k, 1 + (r() - 0.5) * amount);
    const f = map.get(k)!;
    pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f);
  }
  geo.computeVertexNormals();
  return geo;
}

function useGrow(fn: (a: AppearFn) => number) {
  const ref = useRef<THREE.Group>(null);
  const A = useA();
  useFrame(() => {
    if (!ref.current) return;
    const g = fn(A);
    ref.current.scale.setScalar(Math.max(0.0001, g));
    ref.current.visible = g > 0.001;
  });
  return ref;
}

// ---------- 고정 배경: 받침·흙·울타리·집·조명 ----------

function Base() {
  const soil = useMemo(() => speckleTexture("#8E6E50", ["#6F533B", "#A7896A", "#7C5F44", "#B59B7D"], 2600, 3, 3), []);
  return (
    <group>
      <mesh position={[0, -0.2, 0.15]} receiveShadow>
        <boxGeometry args={[5.5, 0.4, 4.6]} />
        <meshStandardMaterial color="#E7DFCF" roughness={1} />
      </mesh>
      <mesh position={[0, 0.005, 0.15]} receiveShadow>
        <boxGeometry args={[5.2, 0.03, 4.3]} />
        <meshStandardMaterial map={soil} roughness={1} />
      </mesh>
    </group>
  );
}

function Fence() {
  const posts = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = -2.5; x <= 2.51; x += 0.36) if (x < -0.95 || x > -0.15) pts.push([x, 2.18]);
    for (let z = -0.6; z < 2.18; z += 0.36) {
      pts.push([-2.5, z]);
      pts.push([2.5, z]);
    }
    return pts;
  }, []);
  const rails: { p: [number, number, number]; s: [number, number, number] }[] = [
    { p: [-1.725, 0.15, 2.18], s: [1.55, 0.025, 0.025] },
    { p: [1.175, 0.15, 2.18], s: [2.65, 0.025, 0.025] },
    { p: [-2.5, 0.15, 0.79], s: [0.025, 0.025, 2.78] },
    { p: [2.5, 0.15, 0.79], s: [0.025, 0.025, 2.78] },
  ];
  const wood = "#8C6A4B";
  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.11, z]} castShadow>
          <boxGeometry args={[0.04, 0.22, 0.04]} />
          <meshStandardMaterial color={wood} roughness={0.9} />
        </mesh>
      ))}
      {rails.map((r, i) => (
        <group key={i}>
          <mesh position={r.p} scale={r.s} castShadow>
            <boxGeometry />
            <meshStandardMaterial color={wood} roughness={0.9} />
          </mesh>
          <mesh position={[r.p[0], 0.07, r.p[2]]} scale={r.s} castShadow>
            <boxGeometry />
            <meshStandardMaterial color={wood} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-0.98, -0.12].map((x) => (
        <mesh key={x} position={[x, 0.16, 2.18]} castShadow>
          <boxGeometry args={[0.08, 0.32, 0.08]} />
          <meshStandardMaterial color="#5E6461" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export type HouseStyle = "white" | "terracotta" | "sage" | "wood";

const HOUSE_PALETTES: Record<
  HouseStyle,
  { wall: string; roof: string; clad: string; frame: string; base: string; door: string; flat?: boolean }
> = {
  white: { wall: "#F6F4EF", roof: "#9A9E9A", clad: "#C79D70", frame: "#6E7470", base: "#B3B5B1", door: "#7A5A3F" },
  terracotta: { wall: "#F5EFE6", roof: "#B8694C", clad: "#B07F55", frame: "#5B4F48", base: "#A9A49C", door: "#6B4A33" },
  sage: { wall: "#F4F2EC", roof: "#8AA591", clad: "#BE9367", frame: "#56645B", base: "#ABAFA9", door: "#6F5139" },
  wood: { wall: "#F3F2EF", roof: "#B4B7B4", clad: "#D6CEC3", frame: "#A3A7A4", base: "#C2C4C0", door: "#B5A99B", flat: true },
};

function House({ style }: { style: HouseStyle }) {
  const c = HOUSE_PALETTES[style];
  const W = 3.0;
  const D = 1.5;
  const H = c.flat ? 0.95 : 0.82;
  const roofGeo = useMemo(() => {
    const s = new THREE.Shape();
    const half = D / 2 + 0.14;
    s.moveTo(-half, 0);
    s.lineTo(0, 0.58);
    s.lineTo(half, 0);
    s.lineTo(half, -0.05);
    s.lineTo(0, 0.52);
    s.lineTo(-half, -0.05);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: W + 0.22, bevelEnabled: false });
    g.translate(0, 0, -(W + 0.22) / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, []);
  const gableGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-D / 2, 0);
    s.lineTo(0, 0.5);
    s.lineTo(D / 2, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false });
    g.translate(0, 0, -W / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, []);

  const front = D / 2 + 0.002;
  const cladW = c.flat ? 1.5 : 0.85;
  const cladX = c.flat ? -0.75 : -0.65;

  return (
    <group position={[0.1, 0.02, -1.15]}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[W + 0.08, 0.06, D + 0.08]} />
        <meshStandardMaterial color={c.base} roughness={1} />
      </mesh>
      <mesh position={[0, 0.06 + H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={c.wall} roughness={0.85} />
      </mesh>
      {c.flat ? (
        <>
          {/* 평지붕과 처마 */}
          <mesh position={[0, 0.06 + H + 0.035, 0]} castShadow receiveShadow>
            <boxGeometry args={[W + 0.24, 0.07, D + 0.24]} />
            <meshStandardMaterial color={c.roof} roughness={0.8} />
          </mesh>
          {/* 지붕 위 낮은 난간 */}
          <mesh position={[0, 0.06 + H + 0.1, -D / 2 - 0.1]} castShadow>
            <boxGeometry args={[W + 0.24, 0.06, 0.04]} />
            <meshStandardMaterial color={c.roof} roughness={0.8} />
          </mesh>
        </>
      ) : (
        <>
          <mesh geometry={gableGeo} position={[0, 0.06 + H, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={c.wall} roughness={0.85} />
          </mesh>
          <mesh geometry={roofGeo} position={[0, 0.06 + H, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={c.roof} roughness={0.75} />
          </mesh>
        </>
      )}
      {/* 나무 외장과 현관 */}
      <mesh position={[cladX, 0.06 + H / 2, front]} castShadow>
        <boxGeometry args={[cladW, H, 0.02]} />
        <meshStandardMaterial color={c.clad} roughness={0.8} />
      </mesh>
      <mesh position={[-0.65, 0.06 + 0.29, front + 0.012]}>
        <boxGeometry args={[0.28, 0.56, 0.01]} />
        <meshStandardMaterial color={c.door} roughness={0.6} />
      </mesh>
      <mesh position={[-0.65, 0.06 + 0.66, front + 0.16]} castShadow>
        <boxGeometry args={[0.62, 0.035, 0.34]} />
        <meshStandardMaterial color={c.frame} roughness={0.6} />
      </mesh>
      {/* 큰 창 */}
      <mesh position={[0.62, 0.06 + 0.42, front]}>
        <boxGeometry args={[1.0, 0.5, 0.02]} />
        <meshStandardMaterial color={c.frame} />
      </mesh>
      <mesh position={[0.62, 0.06 + 0.42, front + 0.006]}>
        <boxGeometry args={[0.94, 0.44, 0.02]} />
        <meshStandardMaterial color="#AEBBC0" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0.62, 0.06 + 0.42, front + 0.018]}>
        <boxGeometry args={[0.02, 0.44, 0.005]} />
        <meshStandardMaterial color={c.frame} />
      </mesh>
      {/* 작은 창 */}
      <mesh position={[-1.25, 0.06 + 0.5, front + (c.flat ? 0.012 : 0)]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color={c.frame} />
      </mesh>
      <mesh position={[-1.25, 0.06 + 0.5, front + (c.flat ? 0.018 : 0.006)]}>
        <boxGeometry args={[0.25, 0.25, 0.02]} />
        <meshStandardMaterial color="#AEBBC0" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[W / 2 + 0.006, 0.06 + 0.45, -0.1]}>
        <boxGeometry args={[0.02, 0.36, 0.5]} />
        <meshStandardMaterial color="#AEBBC0" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* 현관 디딤판 */}
      <mesh position={[-0.65, 0.04, front + 0.2]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#A9AAA5" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group position={[-0.1, 0, 1.55]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 0.36, 8]} />
        <meshStandardMaterial color="#2E3431" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.05, 0.06, 0.05]} />
        <meshStandardMaterial color="#FFE7B0" emissive="#FFD27A" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// ---------- 작업: 디딤석 ----------

function SteppingStones() {
  const p = useP();
  const A = useA();
  const stones = useMemo(() => {
    const r = rng(11);
    return [1.95, 1.58, 1.22, 0.87, 0.53, 0.2].map((z, i) => {
      const shape = new THREE.Shape();
      const n = 7;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const rad = 0.15 * (0.8 + r() * 0.35);
        const x = Math.cos(a) * rad * 1.25;
        const y = Math.sin(a) * rad;
        if (k === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.01,
        bevelSegments: 2,
      });
      geo.rotateX(-Math.PI / 2);
      return { geo, x: -0.55 + (i % 2 ? 0.06 : -0.05), z, rot: r() * Math.PI, shade: ["#ABA79C", "#B8B3A6", "#9E9A90"][i % 3] };
    });
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const a = A("디딤석");
    stones.forEach((_, i) => {
      const m = refs.current[i];
      if (!m) return;
      const t = clamp01(a * 1.7 - i * 0.12);
      m.visible = t > 0.001;
      m.position.y = 0.02 + (1 - easeOut(t)) * 1.1;
      m.rotation.z = (1 - easeOut(t)) * 0.4;
    });
  });
  return (
    <group>
      {stones.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={s.geo}
          position={[s.x, 0.02, s.z]}
          rotation={[0, s.rot, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={s.shade} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- 작업: 잔디 ----------

const LAWN = { x0: 0.05, x1: 2.38, z0: 0.12, z1: 1.98 };

function Lawn({ blades }: { blades: number }) {
  const p = useP();
  const A = useA();
  const tex = useMemo(() => speckleTexture("#5E9B45", ["#4E8A3A", "#6FAE52", "#7DBA5C", "#467F35"], 3200, 2, 5), []);
  const plate = useRef<THREE.Mesh>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const cx = (LAWN.x0 + LAWN.x1) / 2;
  const cz = (LAWN.z0 + LAWN.z1) / 2;
  const data = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: blades }, () => {
      const x = LAWN.x0 + 0.03 + r() * (LAWN.x1 - LAWN.x0 - 0.06);
      const z = LAWN.z0 + 0.03 + r() * (LAWN.z1 - LAWN.z0 - 0.06);
      return { x, z, h: 0.035 + r() * 0.04, lean: (r() - 0.5) * 0.5, rot: r() * Math.PI, d: Math.hypot(x - cx, z - cz) / 1.5 };
    });
  }, [blades, cx, cz]);
  useLayoutEffect(() => {
    const pal = ["#5C9A44", "#6FAE52", "#4C8738", "#82BE60"].map((c) => new THREE.Color(c));
    data.forEach((_, i) => inst.current?.setColorAt(i, pal[i % pal.length]));
    if (inst.current?.instanceColor) inst.current.instanceColor.needsUpdate = true;
  }, [data]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(-1);
  useFrame(() => {
    const a = A("잔디");
    const spread = easeOut(clamp01(a * 1.3));
    if (plate.current) {
      plate.current.scale.set(Math.max(0.0001, spread), 1, Math.max(0.0001, spread));
      plate.current.visible = spread > 0.001;
    }
    if (!inst.current || Math.abs(a - last.current) < 0.002) return;
    last.current = a;
    data.forEach((d, i) => {
      const t = easeOut(clamp01((a * 1.5 - d.d * 0.6) * 1.6));
      v.set(d.x, 0.03, d.z);
      e.set(d.lean, d.rot, d.lean * 0.5);
      q.setFromEuler(e);
      s.set(1, Math.max(0.0001, t) * d.h, 1);
      m4.compose(v, q, s);
      inst.current!.setMatrixAt(i, m4);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh ref={plate} position={[cx, 0.026, cz]} receiveShadow>
        <boxGeometry args={[LAWN.x1 - LAWN.x0, 0.012, LAWN.z1 - LAWN.z0]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, blades]} castShadow>
        <coneGeometry args={[0.007, 1, 3]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </group>
  );
}

// ---------- 작업: 자갈 ----------

const GRAVEL = { x0: -2.38, x1: -1.05, z0: 0.12, z1: 1.98 };

function Gravel({ count }: { count: number }) {
  const p = useP();
  const A = useA();
  const plate = useRef<THREE.Mesh>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const tex = useMemo(() => speckleTexture("#CFC7B8", ["#B5AC9C", "#E3DDD1", "#A39B8C", "#D8D1C4"], 4200, 2, 8), []);
  const data = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: count }, () => ({
      x: GRAVEL.x0 + 0.03 + r() * (GRAVEL.x1 - GRAVEL.x0 - 0.06),
      z: GRAVEL.z0 + 0.03 + r() * (GRAVEL.z1 - GRAVEL.z0 - 0.06),
      sz: 0.012 + r() * 0.016,
      r: r() * Math.PI,
      d: r(),
    }));
  }, [count]);
  useLayoutEffect(() => {
    const pal = ["#C9C1B2", "#B3AA9A", "#DAD4C8", "#9F9789", "#E6E1D7"].map((c) => new THREE.Color(c));
    data.forEach((_, i) => inst.current?.setColorAt(i, pal[i % pal.length]));
    if (inst.current?.instanceColor) inst.current.instanceColor.needsUpdate = true;
  }, [data]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(-1);
  useFrame(() => {
    const a = A("자갈");
    const pt = easeOut(clamp01(a * 1.4));
    if (plate.current) {
      plate.current.scale.set(Math.max(0.0001, pt), 1, Math.max(0.0001, pt));
      plate.current.visible = pt > 0.001;
    }
    if (!inst.current || Math.abs(a - last.current) < 0.002) return;
    last.current = a;
    data.forEach((d, i) => {
      const t = easeOutBack(clamp01((a * 1.5 - 0.15 - d.d * 0.4) * 2));
      v.set(d.x, 0.035 + (1 - clamp01(t)) * 0.25, d.z);
      e.set(0, d.r, 0);
      q.setFromEuler(e);
      s.set(d.sz * 1.3 * t, d.sz * 0.6 * t, d.sz * t);
      m4.compose(v, q, s);
      inst.current!.setMatrixAt(i, m4);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh ref={plate} position={[(GRAVEL.x0 + GRAVEL.x1) / 2, 0.026, (GRAVEL.z0 + GRAVEL.z1) / 2]} receiveShadow>
        <boxGeometry args={[GRAVEL.x1 - GRAVEL.x0, 0.014, GRAVEL.z1 - GRAVEL.z0]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, count]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
}

// ---------- 작업: 화단 ----------

function FlowerBed() {
  const p = useP();
  const A = useA();
  const frame = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);
  const soil = useMemo(() => speckleTexture("#5A4331", ["#4A3627", "#6C5340", "#3F2E21"], 1200, 1, 13), []);
  const COUNT = 46;
  const data = useMemo(() => {
    const r = rng(41);
    return Array.from({ length: COUNT }, (_, i) => ({
      x: 0.36 + r() * 1.08,
      z: -0.3 + r() * 0.22,
      h: 0.05 + r() * 0.06,
      kind: i % 6,
      d: r(),
    }));
  }, []);
  useLayoutEffect(() => {
    const pal = ["#3F7D3A", "#4F8E42", "#F2F0EA", "#E9A1B3", "#F2C94C", "#9B7BC9"].map((c) => new THREE.Color(c));
    data.forEach((d, i) => inst.current?.setColorAt(i, pal[d.kind]));
    if (inst.current?.instanceColor) inst.current.instanceColor.needsUpdate = true;
  }, [data]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const a = A("화단");
    const ft = easeOut(clamp01(a * 1.6));
    if (frame.current) {
      frame.current.scale.set(1, Math.max(0.0001, ft), 1);
      frame.current.visible = ft > 0.001;
    }
    if (!inst.current) return;
    data.forEach((d, i) => {
      const t = easeOutBack(clamp01((a * 1.6 - 0.45 - d.d * 0.35) * 2.2));
      const leaf = d.kind < 2;
      v.set(d.x, 0.13 + (leaf ? 0 : d.h * t), d.z);
      q.identity();
      const sz = leaf ? 0.04 : 0.018;
      s.set(sz * t, (leaf ? 0.03 : sz) * t, sz * t);
      m4.compose(v, q, s);
      inst.current!.setMatrixAt(i, m4);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  });
  const wood = "#93704F";
  const boards: { p: [number, number, number]; s: [number, number, number] }[] = [
    { p: [0.9, 0.065, -0.07], s: [1.26, 0.13, 0.04] },
    { p: [0.9, 0.065, -0.37], s: [1.26, 0.13, 0.04] },
    { p: [0.29, 0.065, -0.22], s: [0.04, 0.13, 0.34] },
    { p: [1.51, 0.065, -0.22], s: [0.04, 0.13, 0.34] },
  ];
  return (
    <group>
      <group ref={frame}>
        {boards.map((b, i) => (
          <mesh key={i} position={b.p} scale={b.s} castShadow receiveShadow>
            <boxGeometry />
            <meshStandardMaterial color={wood} roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[0.9, 0.11, -0.22]} receiveShadow>
          <boxGeometry args={[1.18, 0.02, 0.26]} />
          <meshStandardMaterial map={soil} roughness={1} />
        </mesh>
      </group>
      <instancedMesh ref={inst} args={[undefined, undefined, COUNT]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// ---------- 작업: 식재 ----------

type Blob = [number, number, number, number];

function Foliage({ blobs, color, seed }: { blobs: Blob[]; color: string; seed: number }) {
  const geos = useMemo(() => blobs.map((_, i) => lumpy(new THREE.IcosahedronGeometry(1, 1), 0.28, seed + i)), [blobs, seed]);
  const cols = useMemo(() => {
    const base = new THREE.Color(color);
    return blobs.map((_, i) => base.clone().offsetHSL(0, 0, (i % 3) * 0.035 - 0.03));
  }, [blobs, color]);
  return (
    <group>
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} geometry={geos[i]} position={[x, y, z]} scale={[r, r * 0.85, r]} castShadow receiveShadow>
          <meshStandardMaterial color={cols[i]} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

const PINE_BLOBS: Blob[] = [
  [0.12, 1.08, 0.02, 0.26],
  [-0.18, 0.86, 0.05, 0.22],
  [0.2, 0.68, -0.04, 0.2],
  [-0.12, 1.2, -0.06, 0.18],
];

function Pine({ position, start, scale = 1 }: { position: [number, number, number]; start: number; scale?: number }) {
  const ref = useGrow((p) => scale * easeOutBack(clamp01(p("식재") * 1.4 - start)));
  const trunk = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.06, 0.35, 0.02),
      new THREE.Vector3(-0.05, 0.7, -0.03),
      new THREE.Vector3(0.08, 1.05, 0.02),
    ]);
    return new THREE.TubeGeometry(curve, 16, 0.035, 6, false);
  }, []);
  return (
    <group ref={ref} position={position}>
      <mesh geometry={trunk} castShadow>
        <meshStandardMaterial color="#6E4B33" roughness={1} />
      </mesh>
      <Foliage seed={60} color="#2F5A36" blobs={PINE_BLOBS} />
    </group>
  );
}

function BroadTree({
  position,
  start,
  color,
  height,
  seed,
}: {
  position: [number, number, number];
  start: number;
  color: string;
  height: number;
  seed: number;
}) {
  const ref = useGrow((p) => easeOutBack(clamp01(p("식재") * 1.4 - start)));
  const k = height;
  const blobs = useMemo<Blob[]>(
    () => [
      [0, 0.82 * k, 0, 0.32 * k],
      [0.2 * k, 0.7 * k, 0.08 * k, 0.24 * k],
      [-0.2 * k, 0.72 * k, -0.06 * k, 0.24 * k],
      [0.05 * k, 0.98 * k, -0.12 * k, 0.22 * k],
      [-0.06 * k, 0.66 * k, 0.2 * k, 0.2 * k],
    ],
    [k],
  );
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.3 * k, 0]} castShadow>
        <cylinderGeometry args={[0.025 * k, 0.045 * k, 0.6 * k, 7]} />
        <meshStandardMaterial color="#6A4A33" roughness={1} />
      </mesh>
      <Foliage seed={seed} color={color} blobs={blobs} />
    </group>
  );
}

function Shrub({ position, start, r = 0.13 }: { position: [number, number, number]; start: number; r?: number }) {
  const ref = useGrow((p) => easeOutBack(clamp01(p("식재") * 1.4 - start)));
  const blobs = useMemo<Blob[]>(() => [[0, r * 0.75, 0, r]], [r]);
  return (
    <group ref={ref} position={position}>
      <Foliage seed={Math.round(position[0] * 100)} color="#355E2F" blobs={blobs} />
    </group>
  );
}

// ---------- 테두리 ----------

function Outline({ rect, work, radius = 0.12 }: { rect: [number, number, number, number]; work: WorkId; radius?: number }) {
  const [x0, z0, x1, z1] = rect;
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const y = 0.06;
    const corners: [number, number, number][] = [
      [x1 - radius, z0 + radius, -Math.PI / 2],
      [x1 - radius, z1 - radius, 0],
      [x0 + radius, z1 - radius, Math.PI / 2],
      [x0 + radius, z0 + radius, Math.PI],
    ];
    for (const [cx, cz, a0] of corners) {
      for (let i = 0; i <= 6; i++) {
        const a = a0 + (i / 6) * (Math.PI / 2);
        pts.push(new THREE.Vector3(cx + Math.cos(a) * radius, y, cz + Math.sin(a) * radius));
      }
    }
    pts.push(pts[0].clone());
    return pts;
  }, [x0, z0, x1, z1, radius]);
  const length = useMemo(() => {
    let l = 0;
    for (let i = 1; i < points.length; i++) l += points[i].distanceTo(points[i - 1]);
    return l;
  }, [points]);
  const ref = useRef<Line2>(null);
  const p = useP();
  const A = useA();
  useFrame(() => {
    const m = ref.current?.material;
    if (!m) return;
    const t = easeOut(clamp01(A(work) * 1.25));
    m.dashOffset = length * (1 - t);
    ref.current!.visible = t > 0.001;
  });
  return (
    <Line
      ref={ref}
      points={points}
      color={GREEN}
      lineWidth={3}
      dashed
      dashSize={length}
      gapSize={length}
      transparent
      depthWrite={false}
    />
  );
}

// ---------- 이름표 위치 ----------

const TAG_ANCHORS: Record<WorkId, [number, number, number]> = {
  디딤석: [-0.55, 0.35, 1.3],
  잔디: [1.25, 0.3, 1.0],
  자갈: [-1.72, 0.3, 1.05],
  화단: [0.9, 0.55, -0.2],
  식재: [-1.95, 2.1, -0.25],
};

function TagProjector({ rootRef, tagRefs }: { rootRef: MutableRefObject<THREE.Group | null>; tagRefs: TagRefs }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    for (const work of WORK_STEP_IDS) {
      const el = tagRefs.current[work];
      if (!el) continue;
      v.set(...TAG_ANCHORS[work]);
      root.localToWorld(v);
      v.project(camera);
      // 카메라 뒤에 있는 이름표는 숨김 (1인칭 시점)
      el.style.visibility = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2 ? "hidden" : "";
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  });
  return null;
}

// ---------- 카메라: 원근 시점으로 모형을 화면에 꽉 차게 ----------

function FitCamera({ compact, centered }: { compact: boolean; centered?: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    cam.fov = 24;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const radius = compact ? 3.25 : 3.3;
    const dist = radius / Math.sin(Math.min(vFov, hFov) / 2);
    const dir = new THREE.Vector3(compact ? 0.42 : 0.62, 0.78, 1).normalize();
    cam.position.copy(dir.multiplyScalar(dist));
    cam.near = 0.1;
    cam.far = dist * 4;
    cam.lookAt(compact ? 0.1 : 0, compact ? 0.2 : 0.25, 0.2);
    // PC에서는 장면을 오른쪽으로 옮겨 왼쪽 글 자리를 비움
    if (compact || centered) cam.clearViewOffset();
    else cam.setViewOffset(size.width, size.height, -size.width * 0.14, 0, size.width, size.height);
    cam.updateProjectionMatrix();
  }, [camera, size, compact, centered]);
  return null;
}

function Diorama({ tagRefs, compact, houseStyle }: { tagRefs: TagRefs; compact: boolean; houseStyle: HouseStyle }) {
  const p = useP();
  const A = useA();
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    if (root.current) root.current.rotation.y = -0.22 + p.current * 0.3;
  });
  return (
    <group ref={root}>
      <TagProjector rootRef={root} tagRefs={tagRefs} />
      <Base />
      <Fence />
      <group position={[-0.04, 0, -1.005]} scale={0.78}>
        <group position={[-0.1, -0.02, 1.15]}>
          <House style={houseStyle} />
        </group>
      </group>
      <Lamp />

      <SteppingStones />
      <Lawn blades={compact ? 1400 : 2600} />
      <Gravel count={compact ? 420 : 700} />
      <FlowerBed />

      <Pine position={[-1.95, 0.02, -0.25]} start={0} scale={1.45} />
      <BroadTree position={[0.72, 0.02, 1.62]} start={0.12} color="#B5482F" height={1.35} seed={70} />
      <BroadTree position={[2.1, 0.02, -1.55]} start={0.2} color="#4F8A3C" height={1.75} seed={80} />
      <Shrub position={[-1.4, 0.02, -0.18]} start={0.3} r={0.17} />
      <Shrub position={[-1.12, 0.02, -0.2]} start={0.34} r={0.13} />
      <Shrub position={[1.78, 0.02, -0.2]} start={0.38} r={0.17} />

      <Outline work="디딤석" rect={[-0.92, -0.3, -0.18, 2.12]} />
      <Outline work="잔디" rect={[0.0, 0.07, 2.43, 2.03]} />
      <Outline work="자갈" rect={[-2.43, 0.07, -1.0, 2.03]} />
      <Outline work="화단" rect={[0.2, -0.46, 1.6, 0.02]} radius={0.08} />
      <Outline work="식재" rect={[-2.35, -0.68, -1.55, 0.18]} radius={0.2} />
      <Outline work="식재" rect={[0.34, 1.26, 1.1, 1.98]} radius={0.2} />
    </group>
  );
}

function Rig({
  progress,
  reduced,
  selected,
  children,
}: {
  progress: ProgressRef;
  reduced: boolean;
  selected?: WorkId[];
  children: React.ReactNode;
}) {
  const sp = useRef(progress.current);
  const sel = useRef<Partial<Record<WorkId, number>>>({});
  useFrame((_, dt) => {
    sp.current = reduced ? progress.current : sp.current + (progress.current - sp.current) * Math.min(1, dt * 7);
    if (selected) {
      for (const w of WORK_STEP_IDS) {
        const target = selected.includes(w) ? 1 : 0;
        const cur = sel.current[w] ?? 0;
        sel.current[w] = reduced ? target : cur + (target - cur) * Math.min(1, dt * 3.2);
      }
    }
  });
  const key = selected?.join(",");
  const A = useMemo<AppearFn>(
    () => (w) => (selected ? (sel.current[w] ?? 0) : appearOf(w, sp.current)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return (
    <ProgressCtx.Provider value={sp}>
      <AppearCtx.Provider value={A}>{children}</AppearCtx.Provider>
    </ProgressCtx.Provider>
  );
}

export default function YardScene({
  progress,
  tagRefs,
  running,
  reduced,
  compact,
  houseStyle,
  selected,
  centered,
}: {
  progress: ProgressRef;
  tagRefs: TagRefs;
  running: boolean;
  reduced: boolean;
  compact: boolean;
  houseStyle: HouseStyle;
  selected?: WorkId[];
  centered?: boolean;
}) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, compact ? 1.5 : 1.75]}
      frameloop={running ? "always" : "never"}
      camera={{ position: [5, 6, 8], fov: 24 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden="true"
    >
      <FitCamera compact={compact} centered={centered} />
      <hemisphereLight args={["#FFFFFF", "#CDBF9F", 1.05]} />
      <directionalLight
        position={[4.5, 7.5, 3.5]}
        intensity={2.1}
        color="#FFF3DF"
        castShadow
        shadow-mapSize={compact ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-3.6}
        shadow-camera-right={3.6}
        shadow-camera-top={3.6}
        shadow-camera-bottom={-3.6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <Rig progress={progress} reduced={reduced} selected={selected}>
        <Diorama tagRefs={tagRefs} compact={compact} houseStyle={houseStyle} />
      </Rig>
    </Canvas>
  );
}
