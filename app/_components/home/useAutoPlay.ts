"use client";

import { useEffect, useRef } from "react";

/**
 * 요소가 화면에 들어오면 0 → 1 진행을 시간에 맞춰 한 번 재생 (스크롤로 조작하지 않음).
 * 움직임 줄이기 설정이면 바로 끝 상태로.
 */
export function useAutoPlay<T extends HTMLElement>(duration: number, onP: (p: number) => void, threshold = 0.35) {
  const ref = useRef<T>(null);
  const cb = useRef(onP);
  cb.current = onP;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cb.current(reduce ? 1 : 0);
    if (reduce) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      cb.current(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !start) {
          raf = requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [duration, threshold]);

  return ref;
}
