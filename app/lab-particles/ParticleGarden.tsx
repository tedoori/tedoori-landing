"use client";

import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

// 조각: 모델, 크기, 자리, 회전, 높이 누름, 점 개수. 순서 = 모이는 순서 (0번 흙은 처음부터)
type P = { url: string; size: number; x: number; z: number; rot: number; flat?: number; axis?: "y"; count: number; onTop?: boolean };
const PIECES: P[] = [
  { url: "/kit/base.glb", size: 2, x: 0, z: 0, rot: 0, flat: 0.45, count: 26000 },
  { url: "/kit/lawn.glb", size: 1.92, x: 0, z: 0, rot: 0, flat: 0.35, count: 30000 },
  { url: "/kit/stone.glb", size: 1.05, x: 0.2, z: 0.35, rot: -0.75, count: 9000, onTop: true },
  { url: "/kit/gravel.glb", size: 1.15, x: -0.76, z: 0.3, rot: Math.PI / 2, count: 9000, onTop: true },
  { url: "/kit/bed.glb", size: 0.85, x: 0.42, z: -0.58, rot: 0, count: 14000, onTop: true },
  { url: "/kit/tree.glb", size: 1.45, x: -0.55, z: -0.55, rot: 0.6, axis: "y", count: 16000, onTop: true },
];
const LAWN_TOP = 0.05;

/** 모델 겉면에서 점을 뽑고, 텍스처 색을 그대로 가져옴 */
function samplePiece(scene: THREE.Object3D, p: P, baseH: number) {
  const root = scene.clone(true);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const dim = box.getSize(new THREE.Vector3());
  const s = p.size / (p.axis === "y" ? dim.y : Math.max(dim.x, dim.z));
  const c = box.getCenter(new THREE.Vector3());
  const flat = p.flat ?? 1;
  const yBase = p.url.includes("base") ? -dim.y * s * flat : p.onTop ? LAWN_TOP : 0;
  const place = new THREE.Matrix4()
    .makeTranslation(p.x, yBase, p.z)
    .multiply(new THREE.Matrix4().makeRotationY(p.rot))
    .multiply(new THREE.Matrix4().makeScale(s, s * flat, s))
    .multiply(new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z));

  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
  const pos: number[] = [];
  const col: number[] = [];
  const per = Math.ceil(p.count / meshes.length);
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const color = new THREE.Color();
  const uv = new THREE.Vector2();
  for (const m of meshes) {
    const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const sampled = new THREE.Mesh(geo, m.material);
    const sampler = new MeshSurfaceSampler(sampled).build();
    // 텍스처를 캔버스에 그려 색을 읽음
    const mat = m.material as THREE.MeshStandardMaterial;
    const img = mat.map?.image as (CanvasImageSource & { width: number; height: number }) | undefined;
    let data: Uint8ClampedArray | null = null;
    let w = 0;
    let h = 0;
    if (img && img.width) {
      w = Math.min(512, img.width);
      h = Math.min(512, img.height);
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      data = ctx.getImageData(0, 0, w, h).data;
    }
    for (let i = 0; i < per; i++) {
      sampler.sample(v, n, color, uv);
      v.applyMatrix4(place);
      pos.push(v.x, v.y, v.z);
      if (data) {
        const flipY = mat.map!.flipY;
        const px = Math.min(w - 1, Math.max(0, Math.floor(((uv.x % 1) + 1) % 1 * w)));
        const py = Math.min(h - 1, Math.max(0, Math.floor((flipY ? 1 - (((uv.y % 1) + 1) % 1) : ((uv.y % 1) + 1) % 1) * h)));
        const k = (py * w + px) * 4;
        col.push(data[k] / 255, data[k + 1] / 255, data[k + 2] / 255);
      } else {
        const c2 = mat.color ?? new THREE.Color("#9fbf8f");
        col.push(c2.r, c2.g, c2.b);
      }
    }
  }
  return { pos, col, height: dim.y * s * flat + baseH * 0 };
}

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uProg[6];
  uniform vec3 uMouse;
  uniform float uPix;
  attribute vec3 aScatter;
  attribute float aPiece;
  attribute float aRand;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    int pi = int(aPiece + 0.5);
    float p = 0.0;
    for (int i = 0; i < 6; i++) if (i == pi) p = uProg[i];
    // 조각마다 점이 조금씩 다른 시각에 모여 들도록
    float k = clamp((p * 1.6 - aRand * 0.6), 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    vec3 pos = mix(aScatter, position, k);
    // 숨 쉬듯 일렁임
    pos += 0.012 * vec3(sin(uTime * 1.3 + aRand * 40.0), cos(uTime * 1.1 + aRand * 31.0), sin(uTime * 0.9 + aRand * 17.0)) * (0.3 + (1.0 - k) * 4.0);
    // 마우스 근처는 물결처럼 밀려남
    vec3 d = pos - uMouse;
    float dist = length(d);
    float push = smoothstep(0.55, 0.0, dist) * 0.18;
    pos += normalize(d + 1e-4) * push;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(1.4, 2.2, aRand) * (1.0 + push * 6.0);
    gl_PointSize = size * uPix * (3.2 / -mv.z);
    // 밝은 돌·자갈이 하얗게 타지 않도록 겹침 밝기를 낮춤
    vec3 base = pow(color, vec3(1.25)) * 0.62;
    vColor = base * (1.0 + push * 3.0) + (1.0 - k) * vec3(0.25, 0.35, 0.3);
    vAlpha = mix(0.35, 1.0, k);
  }
`;
const frag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.15, r) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`;

function Garden({ progress }: { progress: React.MutableRefObject<number> }) {
  const gltfs = useGLTF(PIECES.map((p) => p.url));
  const { gl, camera, pointer } = useThree();
  const geo = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const scat: number[] = [];
    const piece: number[] = [];
    const rand: number[] = [];
    PIECES.forEach((p, i) => {
      const r = samplePiece(gltfs[i].scene, p, 0);
      for (let j = 0; j < r.pos.length / 3; j++) {
        pos.push(r.pos[j * 3], r.pos[j * 3 + 1], r.pos[j * 3 + 2]);
        col.push(r.col[j * 3], r.col[j * 3 + 1], r.col[j * 3 + 2]);
        // 흩어진 자리: 위쪽 넓은 구름
        const a = Math.random() * Math.PI * 2;
        const rr = 1.2 + Math.random() * 2.2;
        scat.push(Math.cos(a) * rr, 0.6 + Math.random() * 2.4, Math.sin(a) * rr);
        piece.push(i);
        rand.push(Math.random());
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute("aScatter", new THREE.Float32BufferAttribute(scat, 3));
    g.setAttribute("aPiece", new THREE.Float32BufferAttribute(piece, 1));
    g.setAttribute("aRand", new THREE.Float32BufferAttribute(rand, 1));
    return g;
  }, [gltfs]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uProg: { value: [1, 0, 0, 0, 0, 0] },
          uMouse: { value: new THREE.Vector3(9, 9, 9) },
          uPix: { value: gl.getPixelRatio() * 2 },
        },
      }),
    [gl],
  );

  const group = useRef<THREE.Group>(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const smooth = useRef([1, 0, 0, 0, 0, 0]);

  useFrame((state, dt) => {
    const u = mat.uniforms;
    u.uTime.value += dt;
    // 스크롤 진행 → 조각마다 모임 정도
    const p = progress.current * 5.2;
    const target = [1, ...[0, 1, 2, 3, 4].map((i) => THREE.MathUtils.clamp(p - i, 0, 1))];
    smooth.current = smooth.current.map((v, i) => THREE.MathUtils.lerp(v, target[i], 0.08));
    u.uProg.value = smooth.current;
    // 마우스가 닿는 땅 위 지점
    ray.setFromCamera(pointer, camera);
    if (ray.ray.intersectPlane(plane, hit)) {
      const local = group.current ? group.current.worldToLocal(hit.clone()) : hit;
      u.uMouse.value.lerp(local, 0.2);
    }
    // 가만히 있으면 천천히 돌고, 마우스 따라 살짝 기울어짐
    if (group.current) {
      group.current.rotation.y += dt * 0.08;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.y * 0.08, 0.05);
    }
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 3.4 + pointer.x * 0.4, 0.04);
    state.camera.lookAt(0, 0.2, 0);
  });

  return (
    <group ref={group}>
      <points geometry={geo} material={mat} />
    </group>
  );
}

export default function ParticleGarden({ progress }: { progress: React.MutableRefObject<number> }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [3.4, 2.8, 3.4], fov: 36 }} gl={{ antialias: false }}>
      <color attach="background" args={["#0d1410"]} />
      <fog attach="fog" args={["#0d1410", 5, 11]} />
      <Suspense fallback={null}>
        <Garden progress={progress} />
      </Suspense>
    </Canvas>
  );
}
