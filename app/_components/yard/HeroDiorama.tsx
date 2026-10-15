"use client";

import { useEffect, useRef } from "react";
import type { YardStep } from "./steps";

// 20초 영상(4초씩: 잔디 → 디딤석 → 자갈 → 화단 → 식재)에서 단계마다 멈출 시각
const STOP: Partial<Record<YardStep["id"], number>> = {
  intro: -1,
  잔디: 3.2,
  디딤석: 6.3,
  자갈: 10.4,
  화단: 14.4,
  식재: -1,
  outro: -1,
};
const RATE = 2.2;
// 단계마다 디오라마를 보는 각도가 조금씩 돌아감 (도)
const TURN: Partial<Record<YardStep["id"], number>> = { intro: -4, 잔디: -10, 디딤석: -6, 자갈: -2, 화단: 2, 식재: 6, outro: 4 };


/**
 * 히어로 디오라마: 검은 배경 영상을 투명하게 그려 하늘 배경 위에 띄움
 * - 스크롤 단계마다 그 부분 영상이 재생되고(위로 굴리면 되감김), 보는 각도가 살짝씩 돌아감
 * - 마우스를 따라 3D로 기울고, 가만히 있어도 천천히 떠 있음
 */
export function HeroDiorama({ step }: { step: YardStep["id"] }) {
  const video = useRef<HTMLVideoElement>(null);
  const run = useRef(0);
  const turn = useRef(TURN.intro!);

  // 화면 크기에 맞는 영상 (배경이 있는 원본 그대로)
  useEffect(() => {
    const v = video.current!;
    v.src = window.matchMedia("(max-width: 899px)").matches ? "/hero/garden-m.mp4" : "/hero/garden.mp4";
  }, []);

  // 단계가 바뀌면 그 구간만 재생 / 되감기
  useEffect(() => {
    turn.current = TURN[step] ?? 0;
    const v = video.current;
    const stop = STOP[step];
    if (!v || stop === undefined) return;
    const id = ++run.current;
    const go = () => {
      if (id !== run.current) return;
      const end = (v.duration || 20) - 0.05;
      let target = stop < 0 ? end : stop;
      // 첫 화면 → 잔디: 맨흙(0초)부터 시작
      if (step === "잔디" && v.currentTime > target + 0.1) v.currentTime = 0;
      if (step === "intro") target = end;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches || step === "intro") {
        v.pause();
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
  }, [step]);

  return (
    <div className="hd" aria-hidden="true">
      <video ref={video} muted playsInline preload="auto" poster="/hero/final.webp" className="hd-video" />
    </div>
  );
}
