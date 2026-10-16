"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type Prog = React.MutableRefObject<number>;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// 스크롤 0~1 에서 각 무리가 내려앉는 정도
const stage = (p: number, i: number) => smooth(clamp01(p * 5 - i));

// 간단한 값 노이즈 (지형용)
function noise2(x: number, z: number) {
  const s = Math.sin(x * 0.7 + z * 0.3) * 0.5 + Math.sin(x * 0.23 - z * 0.51) * 0.8 + Math.sin(x * 1.7 + z * 1.3) * 0.15;
  return s;
}

/** 땅과 먼 언덕 */
function Land() {
  const grass = useTexture("/materials/zoysia.webp");
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(14, 14);
  grass.colorSpace = THREE.SRGBColorSpace;
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(60, 60, 160, 160);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const d = Math.hypot(x, z);
      // 가운데 마당은 평평, 멀어질수록 언덕
      const lift = smooth(clamp01((d - 4) / 10));
      p.setY(i, noise2(x * 0.35, z * 0.35) * 1.4 * lift + lift * lift * 2.5);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const hills = useMemo(() => {
    const g = new THREE.PlaneGeometry(120, 30, 200, 40);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const h = (Math.sin(x * 0.08) * 4 + Math.sin(x * 0.21 + 1) * 2 + 6) * clamp01((y + 15) / 30);
      p.setY(i, y * 0.2 + h);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial map={grass} color="#b9cfa4" roughness={1} />
      </mesh>
      <mesh geometry={hills} position={[0, -2, -32]}>
        <meshStandardMaterial color="#7f9a86" roughness={1} />
      </mesh>
    </group>
  );
}

/** 떠 있다가 내려앉는 공통 동작 + 마우스 근처면 살짝 들림 */
function useFloat(home: THREE.Vector3, i: number, group: number, prog: Prog, mouse: React.MutableRefObject<THREE.Vector3>) {
  const ref = useRef<THREE.Object3D>(null);
  const seed = useMemo(() => ({ a: Math.random() * 6.28, h: 0.9 + Math.random() * 1.4, r: (Math.random() - 0.5) * 1.6, s: 0.6 + Math.random() * 0.8 }), []);
  useFrame((st) => {
    const o = ref.current;
    if (!o) return;
    const t = st.clock.elapsedTime;
    const k = stage(prog.current, group);
    const float = 1 - k;
    const near = Math.max(0, 1 - mouse.current.distanceTo(home) / 1.2);
    o.position.set(
      home.x + Math.cos(seed.a) * 0.5 * float,
      home.y + (seed.h + Math.sin(t * seed.s + seed.a) * 0.15) * float + near * 0.12,
      home.z + Math.sin(seed.a) * 0.5 * float,
    );
    o.rotation.set(seed.r * float + Math.sin(t * 0.6 + i) * 0.08 * float, seed.a * float, near * 0.08);
  });
  return ref;
}

/** 디딤석 하나 */
function Stone({ home, i, prog, mouse, tex }: { home: THREE.Vector3; i: number; prog: Prog; mouse: React.MutableRefObject<THREE.Vector3>; tex: THREE.Texture }) {
  const ref = useFloat(home, i, 0, prog, mouse);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.32, 0.34, 0.08, 18, 1);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const z = p.getZ(k);
      const a = Math.atan2(z, x);
      const r = 1 + Math.sin(a * 3 + i) * 0.08 + Math.sin(a * 5 + i * 2) * 0.05;
      p.setX(k, x * r * 1.25);
      p.setZ(k, z * r * 0.85);
    }
    g.computeVertexNormals();
    return g;
  }, [i]);
  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>} geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial map={tex} color="#e6e1d8" roughness={0.9} />
    </mesh>
  );
}

/** 자갈: 작은 돌 수백 개 (한 번에 그림) */
function Gravel({ prog, mouse }: { prog: Prog; mouse: React.MutableRefObject<THREE.Vector3> }) {
  const N = 900;
  const ref = useRef<THREE.InstancedMesh>(null);
  const homes = useMemo(
    () =>
      Array.from({ length: N }, () => {
        // 구불구불한 띠 모양
        const u = Math.random();
        const x = -2.4 + u * 4.8;
        const z = 1.7 + Math.sin(u * 5) * 0.35 + (Math.random() - 0.5) * 0.55;
        return { p: new THREE.Vector3(x, 0.03, z), a: Math.random() * 6.28, h: 0.6 + Math.random() * 1.8, s: 0.05 + Math.random() * 0.05 };
      }),
    [],
  );
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const im = ref.current;
    if (!im) return;
    const t = st.clock.elapsedTime;
    const k = stage(prog.current, 1);
    homes.forEach((h, i) => {
      // 조금씩 다른 시각에 쏟아지듯 내려앉음
      const kk = smooth(clamp01(k * 1.5 - (i / N) * 0.5));
      const f = 1 - kk;
      const near = Math.max(0, 1 - mouse.current.distanceTo(h.p) / 0.8);
      m.position.set(h.p.x + Math.cos(h.a) * 0.6 * f, h.p.y + (h.h + Math.sin(t + h.a) * 0.1) * f + near * 0.08, h.p.z + Math.sin(h.a) * 0.6 * f);
      m.rotation.set(h.a * f, h.a, 0);
      m.scale.set(h.s * 1.2, h.s * 0.7, h.s);
      m.updateMatrix();
      im.setMatrixAt(i, m.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#efeae2" roughness={0.7} />
    </instancedMesh>
  );
}

/** 화단: 나무 틀 + 바람에 흔들리는 라벤더·흰 꽃 */
function Bed({ prog, mouse }: { prog: Prog; mouse: React.MutableRefObject<THREE.Vector3> }) {
  const wood = useTexture("/service/work-bed.webp");
  const frameRef = useFloat(new THREE.Vector3(1.6, 0, -1.2), 3, 2, prog, mouse);
  const flowers = useRef<THREE.InstancedMesh>(null);
  const N = 420;
  const spots = useMemo(
    () => Array.from({ length: N }, (_, i) => ({ x: (Math.random() - 0.5) * 2.0, z: (Math.random() - 0.5) * 0.9, h: 0.25 + Math.random() * 0.25, white: i % 5 === 0, a: Math.random() * 6.28 })),
    [],
  );
  const m = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => {
    const c = new Float32Array(N * 3);
    const lav = new THREE.Color("#8a6cc9");
    const wh = new THREE.Color("#f4f1ea");
    spots.forEach((s, i) => (s.white ? wh : lav).toArray(c, i * 3));
    return c;
  }, [spots]);
  useFrame((st) => {
    const im = flowers.current;
    const fr = frameRef.current;
    if (!im || !fr) return;
    const t = st.clock.elapsedTime;
    const grow = smooth(clamp01(stage(prog.current, 2) * 1.4 - 0.4));
    spots.forEach((s, i) => {
      // 바람에 살랑
      const sway = Math.sin(t * 1.6 + s.x * 2 + s.a) * 0.18;
      m.position.set(s.x, 0.2 + (s.h * grow) / 2, s.z);
      m.rotation.set(sway * 0.6, 0, sway);
      m.scale.set(s.white ? 0.07 : 0.03, Math.max(0.001, s.h * grow), s.white ? 0.07 : 0.03);
      m.updateMatrix();
      im.setMatrixAt(i, m.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <group ref={frameRef as React.RefObject<THREE.Group>}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.22, 1.1]} />
        <meshStandardMaterial map={wood} color="#b59a78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.215, 0]}>
        <boxGeometry args={[2.05, 0.02, 0.95]} />
        <meshStandardMaterial color="#3d2c22" roughness={1} />
      </mesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, N]}>
        <cylinderGeometry args={[0.5, 0.8, 1, 5]} />
        <meshStandardMaterial vertexColors roughness={0.8} />
        <instancedBufferAttribute attach="geometry-attributes-color" args={[colors, 3]} />
      </instancedMesh>
    </group>
  );
}

/** 나무: 떨어져 있다가 심어지고, 바람에 흔들림 */
function Tree({ home, scale, prog, mouse, i }: { home: THREE.Vector3; scale: number; prog: Prog; mouse: React.MutableRefObject<THREE.Vector3>; i: number }) {
  const { scene } = useGLTF("/kit/tree.glb");
  const obj = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const dim = box.getSize(new THREE.Vector3());
    const s = scale / dim.y;
    root.scale.setScalar(s);
    const c = box.getCenter(new THREE.Vector3());
    root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    root.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o.castShadow = true), (o.receiveShadow = true)) : null));
    const g = new THREE.Group();
    g.add(root);
    return g;
  }, [scene, scale]);
  const ref = useFloat(home, i, 3, prog, mouse);
  const sway = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (sway.current) sway.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.9 + i) * 0.03;
  });
  return (
    <group ref={ref as React.RefObject<THREE.Group>}>
      <group ref={sway}>
        <primitive object={obj} />
      </group>
    </group>
  );
}

function Scene({ prog }: { prog: Prog }) {
  const stoneTex = useTexture("/materials/natural-stone.webp");
  stoneTex.colorSpace = THREE.SRGBColorSpace;
  const { camera, pointer } = useThree();
  const mouse = useRef(new THREE.Vector3(99, 0, 99));
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const stones = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const u = i / 8;
        return new THREE.Vector3(-2.6 + u * 4.4, 0.04, 0.6 - Math.sin(u * 3.2) * 1.0);
      }),
    [],
  );
  useFrame((st, dt) => {
    ray.setFromCamera(pointer, camera);
    if (ray.ray.intersectPlane(plane, hit)) mouse.current.lerp(hit, 0.15);
    // 마우스 따라 카메라가 살짝 움직이고, 스크롤하면 천천히 다가감
    const p = prog.current;
    const tx = 6.5 + pointer.x * 0.8;
    const ty = 4.2 - p * 0.8 + pointer.y * 0.4;
    const tz = 8.2 - p * 1.6;
    camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y += (ty - camera.position.y) * Math.min(1, dt * 2);
    camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 2);
    camera.lookAt(0, 0.6, 0);
  });
  return (
    <>
      <Land />
      {stones.map((h, i) => (
        <Stone key={i} home={h} i={i} prog={prog} mouse={mouse} tex={stoneTex} />
      ))}
      <Gravel prog={prog} mouse={mouse} />
      <Bed prog={prog} mouse={mouse} />
      <Tree home={new THREE.Vector3(-1.8, 0, -1.6)} scale={2.6} prog={prog} mouse={mouse} i={0} />
      <Tree home={new THREE.Vector3(2.9, 0, 0.4)} scale={1.8} prog={prog} mouse={mouse} i={1} />
      {/* 낮은 콘크리트 담장 */}
      <mesh position={[0, 0.35, -3.4]} castShadow receiveShadow>
        <boxGeometry args={[9, 0.7, 0.18]} />
        <meshStandardMaterial color="#d9d6cf" roughness={0.9} />
      </mesh>
      {/* 연한 상자 모양 집 (뒤쪽 가장자리, 안개에 묻힘) */}
      <mesh position={[-4.6, 1.1, -5.4]} castShadow>
        <boxGeometry args={[4.2, 2.2, 2.8]} />
        <meshStandardMaterial color="#e4e0d8" roughness={0.95} />
      </mesh>
    </>
  );
}

export default function GardenWorld({ progress }: { progress: Prog }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [6.5, 4.2, 8.2], fov: 38 }}>
      <color attach="background" args={["#dfe5df"]} />
      <fogExp2 attach="fog" args={["#dfe5df", 0.055]} />
      <hemisphereLight args={["#f4f7f2", "#7f8f72", 0.9]} />
      <directionalLight position={[6, 9, 4]} intensity={2.1} color="#fff3df" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <Suspense fallback={null}>
        <Scene prog={progress} />
      </Suspense>
    </Canvas>
  );
}
