"use client";

import { useEffect, useRef } from "react";
import type { MatCat } from "./materials";

// 디오라마 영상(17초)에서 각 작업이 다 생긴 시각. 영상 순서: 잔디 → 디딤석 → 자갈 → 화단 → 식재
const ORDER: MatCat[] = ["잔디", "디딤석", "자갈", "화단", "식재"];
const AT = [3.0, 6.5, 10.2, 13.2, -1];
const RATE = 2.4;

/** 고른 작업 중 가장 뒤 단계까지 영상이 재생되며 쌓임 (빼면 되감김) */
export function DioramaBuild({ on }: { on: MatCat[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const run = useRef(0);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.src = window.matchMedia("(max-width: 899px)").matches ? "/dio/build-m.mp4" : "/dio/build.mp4";
  }, []);

  const last = Math.max(-1, ...on.map((c) => ORDER.indexOf(c)));

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const id = ++run.current;
    const go = () => {
      if (id !== run.current) return;
      const end = (v.duration || 17.3) - 0.05;
      const target = last < 0 ? 0 : AT[last] < 0 ? end : AT[last];
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        v.currentTime = target;
        return;
      }
      if (target > v.currentTime + 0.05) {
        v.playbackRate = RATE;
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
        v.pause();
        let t = performance.now();
        const back = () => {
          if (id !== run.current) return;
          const now = performance.now();
          const next = Math.max(target, v.currentTime - ((now - t) / 1000) * RATE * 1.4);
          t = now;
          v.currentTime = next;
          if (next <= target) return;
          v.addEventListener("seeked", () => requestAnimationFrame(back), { once: true });
        };
        back();
      }
    };
    if (v.readyState >= 1) go();
    else v.addEventListener("loadedmetadata", go, { once: true });
  }, [last]);

  return <video ref={video} className="ms-video" muted playsInline preload="auto" poster="/dio/s0.webp" aria-hidden="true" />;
}
