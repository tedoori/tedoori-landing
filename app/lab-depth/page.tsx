"use client";

// 시험판: 단계 사진 + 깊이 지도로, 평평한 사진이 마우스를 따라 3D처럼 움직임. 휠 한 칸마다 다음 단계
import { useEffect, useRef, useState } from "react";

const N = 6;
const NAMES = ["맨흙", "잔디", "디딤석", "자갈", "화단", "식재"];

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p*0.5+0.5; uv.y = 1.0-uv.y; gl_Position = vec4(p,0.,1.); }`;
const FRAG = `precision mediump float;
varying vec2 uv;
uniform sampler2D img0, dep0, img1, dep1;
uniform vec2 mouse; uniform float mix1, t, aspect, imgAspect;
vec2 cover(vec2 u){ vec2 s = aspect > imgAspect ? vec2(1., imgAspect/aspect) : vec2(aspect/imgAspect, 1.); return (u-0.5)*s+0.5; }
vec4 look(sampler2D im, sampler2D dp, vec2 u){
  vec2 c = cover(u);
  float d = texture2D(dp, c).r;
  // 숨 쉬듯 살짝 + 마우스 따라 기울어짐 (가까울수록 많이)
  // 나뭇잎이 울렁이지 않도록 움직임을 작게, 깊이는 부드럽게 쓴 값으로
  vec2 off = (mouse + vec2(sin(t*0.5), cos(t*0.4))*0.1) * (d-0.45) * 0.016;
  return texture2D(im, c + off);
}
void main(){
  vec4 a = look(img0, dep0, uv);
  vec4 b = look(img1, dep1, uv);
  vec4 g = mix(a, b, mix1);
  gl_FragColor = g;
}`;

export default function LabDepth() {
  const cv = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(5);
  const stepRef = useRef(5);

  useEffect(() => {
    const c = cv.current!;
    const gl = c.getContext("webgl")!;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(pr, n);

    const tex = (src: string) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([240, 240, 236, 255]));
      const im = new Image();
      im.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      im.src = src;
      return t;
    };
    const imgs = Array.from({ length: N }, (_, i) => tex(`/dio/s${i}.webp`));
    const deps = Array.from({ length: N }, (_, i) => tex(`/dio/d${i}.png`));


    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener("pointermove", onMove);

    // 휠 한 칸 = 한 단계
    let from = 5, to = 5, k = 1, lock = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (performance.now() < lock || Math.abs(e.deltaY) < 4) return;
      const next = Math.max(0, Math.min(N - 1, stepRef.current + (e.deltaY > 0 ? 1 : -1)));
      if (next === stepRef.current) return;
      from = stepRef.current; to = next; k = 0; stepRef.current = next; setStep(next);
      lock = performance.now() + 700;
    };
    addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const w = c.clientWidth * devicePixelRatio, h = c.clientHeight * devicePixelRatio;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      gl.viewport(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      k = Math.min(1, k + 0.025);
      const e = k * k * (3 - 2 * k);
      [[imgs[from], 0], [deps[from], 1], [imgs[to], 2], [deps[to], 3]].forEach(([t, i]) => { gl.activeTexture(gl.TEXTURE0 + (i as number)); gl.bindTexture(gl.TEXTURE_2D, t as WebGLTexture); });
      gl.uniform1i(U("img0"), 0); gl.uniform1i(U("dep0"), 1); gl.uniform1i(U("img1"), 2); gl.uniform1i(U("dep1"), 3);
      gl.uniform2f(U("mouse"), mouse.x, mouse.y);
      gl.uniform1f(U("mix1"), e);
      gl.uniform1f(U("t"), (performance.now() - t0) / 1000);
      gl.uniform1f(U("aspect"), w / h);
      gl.uniform1f(U("imgAspect"), 2000 / 1116);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", onMove); removeEventListener("wheel", onWheel); };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f0f0ec" }}>
      <canvas ref={cv} style={{ width: "100%", height: "100%", display: "block" }} />
      <p style={{ position: "absolute", left: 32, bottom: 32, font: "700 26px/1.3 Pretendard, sans-serif", color: "#1d2a22" }}>
        {step + 1} / {N} · {NAMES[step]}
        <br />
        <span style={{ fontSize: 15, fontWeight: 500 }}>마우스를 움직여 보세요 · 휠로 단계 이동</span>
      </p>
    </div>
  );
}
