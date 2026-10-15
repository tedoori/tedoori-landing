"use client";

import { useEffect, useRef, useState } from "react";
import type { YardStep } from "./steps";
import "./hero-film.css";

// 실사 영상(잔디 → 디딤석 → 자갈 → 화단 → 식재가 차례로 생기는 한 장면)에서 단계마다 멈출 시각(초). -1 = 영상 끝
const STOP: Partial<Record<YardStep["id"], number>> = {
  잔디: 5.0,
  디딤석: 10.0,
  자갈: 15.5,
  화단: 20.3,
  식재: 25.5,
  outro: -1,
};
const RATE = 2.6;
// 모바일(세로 화면)에서 단계마다 영상의 어느 부분을 보여줄지 (가로%, 세로%)
const FOCUS: Partial<Record<YardStep["id"], [number, number]>> = {
  intro: [58, 50],
  잔디: [50, 50],
  디딤석: [18, 75],
  자갈: [36, 62],
  화단: [64, 62],
  식재: [58, 45],
  outro: [58, 50],
};

/**
 * 히어로 배경: 실사 정원 영상
 * - 첫 화면: 완성된 정원이 바람에 흔들리는 짧은 영상이 반복
 * - 잔디: 잔디만 있는 마당
 * - 그다음 단계마다 영상이 이어서 재생되며 조경이 하나씩 생김 (위로 굴리면 되감김)
 */
export function HeroFilm({ step }: { step: YardStep["id"] }) {
  const video = useRef<HTMLVideoElement>(null);
  const run = useRef(0);
  const [src, setSrc] = useState<string | null>(null);
  const [introSrc, setIntroSrc] = useState<string | null>(null);

  // 화면 크기에 맞는 영상을 첫 화면이 뜬 뒤에 불러옴
  useEffect(() => {
    const pick = () => setSrc(window.matchMedia("(max-width: 899px)").matches ? "/hero/garden-m.mp4" : "/hero/garden.mp4");
    if (document.readyState === "complete") pick();
    else window.addEventListener("load", pick, { once: true });
    return () => window.removeEventListener("load", pick);
  }, []);

  // 첫 화면은 포스터를 먼저 보여주고, 초기 렌더가 끝난 뒤 반복 영상을 불러옴
  useEffect(() => {
    const id = window.setTimeout(() => setIntroSrc("/hero/intro.mp4"), 1200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // 첫 화면(·마지막)에서는 본 영상을 맨흙(0초)에 대기시켜, 잔디로 넘어가면 처음부터 자라남
    if (step === "intro") {
      run.current++;
      v.pause();
      if (v.readyState >= 1) v.currentTime = 0;
      else v.addEventListener("loadedmetadata", () => (v.currentTime = 0), { once: true });
      return;
    }
    const stop = STOP[step];
    if (stop === undefined) return;
    const id = ++run.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const go = () => {
      if (id !== run.current) return;
      const end = (v.duration || 20.6) - 0.05;
      const target = stop < 0 ? end : stop;
      // 첫 화면 → 잔디: 맨흙(0초)부터 잔디가 자라남
      if (step === "잔디" && v.currentTime > target + 0.1) v.currentTime = 0;
      if (reduce) {
        v.pause();
        v.currentTime = target;
        return;
      }
      if (target > v.currentTime + 0.05) {
        // 앞으로: 빠르게 재생하다 목표에서 멈춤
        // 잔디가 깔리는 장면은 천천히 보여줌
        v.playbackRate = step === "잔디" ? 1.4 : RATE;
        v.play().catch(() => {});
        const watch = () => {
          if (id !== run.current) return;
          if (v.currentTime >= target - 0.02 || v.ended) {
            v.pause();
            v.currentTime = target;
            return;
          }
          requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
      } else if (target < v.currentTime - 0.05) {
        // 뒤로: 조금씩 되감기
        v.pause();
        let last = performance.now();
        const back = () => {
          if (id !== run.current) return;
          const now = performance.now();
          const next = Math.max(target, v.currentTime - ((now - last) / 1000) * RATE * 1.4);
          last = now;
          v.currentTime = next;
          if (next <= target) return;
          v.addEventListener("seeked", () => requestAnimationFrame(back), { once: true });
        };
        back();
      }
    };

    if (v.readyState >= 1) go();
    else v.addEventListener("loadedmetadata", go, { once: true });
  }, [step, src]);

  // 처음과 마지막(고른 만큼만, 항목별 견적으로)에는 바람에 흔들리는 정원 영상
  const showIntro = step === "intro" || step === "outro";
  const showLawn = false;

  return (
    <div
      className="hf"
      aria-hidden="true"
      style={{ "--fx": `${(FOCUS[step] ?? [58, 50])[0]}%`, "--fy": `${(FOCUS[step] ?? [58, 50])[1]}%` } as React.CSSProperties}
    >
      {/* 모바일: 영상을 자르지 않고, 남는 위아래는 흐린 정원으로 */}
      <img className="hf-blur" src="/hero/final.webp" alt="" />
      <video ref={video} className="hf-video" src={src ?? undefined} muted playsInline preload="metadata" />
      {showLawn && <img className="hf-still is-on" src="/hero/lawn.webp" alt="" />}
      {/* 첫 화면: 완성된 정원이 바람에 살짝 흔들리는 영상이 계속 반복 */}
      <video className={`hf-still${showIntro ? " is-on" : ""}`} src={introSrc ?? undefined} poster="/hero/intro-poster.webp" muted loop autoPlay playsInline preload="metadata" />
      <span className="hf-shade" />
    </div>
  );
}
