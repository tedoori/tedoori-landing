"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { YARD_STEPS } from "../yard/steps";

type RGB = [number, number, number];

const hexToRgb = (h: string): RGB => {
  const n = parseInt(h.trim().replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * 홈 전체 스크롤 연출
 * - 부드러운 스크롤(Lenis) + 떠 있는 헤더(히어로 지나면 견적 버튼 켜짐, 내리면 숨고 올리면 나타남)
 * - 섹션마다 하늘색이 이어서 바뀌는 배경, 왼쪽 진행 막대, 모바일 아래 견적 버튼
 * - 히어로가 끝나면 위로 빠지며 사라짐 (01·02 연출은 RequestIntro·YardWalk 안에서)
 */
export function HomeMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (process.env.NODE_ENV !== "production") (window as unknown as { __st: typeof ScrollTrigger }).__st = ScrollTrigger;
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) root.classList.add("home-motion");

    // ---------- 부드러운 스크롤 ----------
    let lenis: Lenis | null = null;
    // 히어로 단계 이동 직후 잠깐 휠 입력을 무시 (스크롤바는 그대로 둠)
    let block = false;
    let snapping = false;
    let lastWheel = 0;
    let lastDelta = 0;
    let fresh = true;
    // 모든 휠을 먼저 살펴 새로 굴린 것인지(관성 꼬리가 아닌지) 표시: 잠깐 멈췄다 다시 굴렸거나 갑자기 세게 굴렸을 때
    const watchWheel = (e: WheelEvent) => {
      const now = performance.now();
      const mag = Math.abs(e.deltaY);
      fresh = now - lastWheel > 160 || mag > lastDelta * 1.8 + 6;
      lastWheel = now;
      lastDelta = mag;
      if (block && fresh) block = false;
      // 무시하는 휠은 브라우저 기본 스크롤도 막음
      if (block || snapping) e.preventDefault();
    };
    window.addEventListener("wheel", watchWheel, { capture: true, passive: false });
    const allowWheel = () => !block;
    const tick = (time: number) => lenis?.raf(time * 1000);
    if (!reduce) {
      lenis = new Lenis({ lerp: 0.11, virtualScroll: allowWheel });
      if (process.env.NODE_ENV !== "production") (window as unknown as { __lenis: Lenis }).__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // ---------- 헤더 · 하늘 · 진행 막대 · 아래 버튼 ----------
    const header = document.querySelector<HTMLElement>(".site-header--float");
    const hero = document.querySelector<HTMLElement>(".ys");
    const sky = document.querySelector<HTMLElement>(".home-sky");
    const rail = document.querySelector<HTMLElement>(".home-rail");
    const railFill = rail?.querySelector<HTMLElement>(".home-rail__fill");
    const dock = document.querySelector<HTMLElement>(".home-dock");
    const closing = document.querySelector<HTMLElement>(".cl");
    // 화면을 가득 쓰는 연출 구간에서는 아래 버튼·진행 막대를 숨김
    const immersive = [...document.querySelectorAll<HTMLElement>(".ri-track")];
    const allSecs = [...document.querySelectorAll<HTMLElement>(".home-flow [data-sky]")];
    const skySecs = allSecs.filter((s) => !s.classList.contains("section--forest"));
    const skyCols = skySecs.map((s) => s.dataset.sky!.split(",").map(hexToRgb) as [RGB, RGB]);

    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const mid = vh * 0.5;
      const past = hero ? hero.getBoundingClientRect().bottom < vh * 0.55 : true;
      const closingTop = closing?.getBoundingClientRect().top ?? Infinity;
      const inClosing = closingTop < vh * 0.8;
      const inImmersive = immersive.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top < vh * 0.5 && r.bottom > vh * 0.5;
      });

      if (header) {
        header.classList.toggle("is-past-hero", past);
        header.classList.toggle("is-dark", closingTop < 40);
        if (Math.abs(y - lastY) > 6) {
          header.classList.toggle("is-hidden", past && y > lastY);
          lastY = y;
        }
      }

      // 하늘: 지금 보고 있는 섹션 색 → 다음 섹션 색으로 섹션 끝 40% 동안 섞임
      if (sky && skySecs.length) {
        let i = 0;
        let t = 0;
        skySecs.forEach((s, k) => {
          const r = s.getBoundingClientRect();
          if (r.top <= mid) {
            i = k;
            t = clamp01(((mid - r.top) / r.height - 0.6) / 0.4);
          }
        });
        const j = Math.min(i + 1, skyCols.length - 1);
        sky.style.setProperty("--sky-a", mix(skyCols[i][0], skyCols[j][0], t));
        sky.style.setProperty("--sky-b", mix(skyCols[i][1], skyCols[j][1], t));
      }

      // 왼쪽 진행 막대: 섹션 수만큼 칸, 지금 섹션 안 진행만큼 채움
      if (rail && railFill && allSecs.length) {
        let p = 0;
        allSecs.forEach((s, k) => {
          const r = s.getBoundingClientRect();
          if (r.top <= mid) p = k + clamp01((mid - r.top) / r.height);
        });
        railFill.style.transform = `scaleY(${p / allSecs.length})`;
        rail.classList.toggle("is-on", past && !inClosing && !inImmersive);
      }

      dock?.classList.toggle("is-on", past && !inClosing && !inImmersive);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // ---------- 히어로가 위로 빠지며 사라짐 (Tara) ----------
    const mm = gsap.matchMedia();
    if (!reduce) {
      // 휴대폰은 영상 위 흐림·축소가 무거워 끊김 → 넓은 화면에서만
      mm.add("(min-width: 900px)", () => {
        gsap.to(".ys-sticky", {
          yPercent: -10,
          scale: 0.92,
          opacity: 0,
          filter: "blur(6px)",
          ease: "none",
          scrollTrigger: { trigger: ".ys", start: "bottom bottom", end: "bottom 45%", scrub: true },
        });
      });
      // 휴대폰: 같은 빠짐 효과를 가볍게 (흐림 없이 위치·크기·투명도만 → 화면 그리기 부담 적음)
      mm.add("(max-width: 899px)", () => {
        gsap.to(".ys-sticky", {
          yPercent: 12,
          scale: 0.9,
          opacity: 0,
          ease: "none",
          force3D: true,
          scrollTrigger: { trigger: ".ys", start: "top top", end: "bottom 25%", scrub: true },
        });
      });
    }

    // ---------- 히어로 단계 넘김 (Apple) ----------
    // 히어로 안에서 조금만 굴려도 다음 작업 장면까지 스르륵 이동하고 잠깐 멈춤
    let rest: number | null = null;
    let resume = 0;
    const anchors = () => {
      if (!hero) return [];
      const top = hero.getBoundingClientRect().top + window.scrollY;
      const total = hero.offsetHeight - window.innerHeight;
      return YARD_STEPS.map((s, i) => top + total * (i === 0 ? 0 : s.start + (s.end - s.start) * 0.75));
    };
    const onLenis = () => {
      if (!lenis || snapping) return;
      const y = lenis.scroll;
      const a = anchors();
      if (!a.length) return;
      const last = a[a.length - 1];
      // 히어로 아래(01부터)는 자유 스크롤
      if (y > last + 2) {
        rest = last;
        return;
      }
      if (rest === null) rest = a.reduce((b, v) => (Math.abs(v - y) < Math.abs(b - y) ? v : b), a[0]);
      if (Math.abs(y - rest) < 6) return;
      const target = y > rest ? a.find((v) => v > rest! + 2) : [...a].reverse().find((v) => v < rest! - 2);
      if (target === undefined) return;
      snapping = true;
      lenis.scrollTo(target, {
        duration: 0.68,
        lock: true,
        force: true,
        // 굴린 힘을 이어받듯 빠르게 출발해 부드럽게 멈춤
        easing: (t) => 1 - Math.pow(1 - t, 3),
        onComplete: () => {
          rest = target;
          // 관성으로 한 번 더 넘어가지 않도록 아주 잠깐 휠 입력만 무시
          // 관성으로 이어지는 휠은 무시하고, 새로 굴리면 바로 다음 단계로
          block = true;
          resume = window.setTimeout(() => {
            snapping = false;
          }, 60);
        },
      });
    };
    // 손가락 스와이프는 관성과 부딪혀 덜컹거려서 마우스·트랙패드에서만
    if (window.matchMedia("(pointer: fine)").matches) lenis?.on("scroll", onLenis);

    // ---------- 홈에서 로고를 누르면 맨 위(히어로 첫 화면)로 ----------
    const brand = document.querySelector<HTMLAnchorElement>(".site-header--float .brand");
    const toTop = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (!lenis) return window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      // 올라가는 동안 히어로 단계 넘김이 끼어들지 않게
      snapping = true;
      lenis.scrollTo(0, {
        duration: Math.min(2, 0.8 + window.scrollY / 6000),
        force: true,
        lock: true,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        onComplete: () => {
          rest = 0;
          snapping = false;
        },
      });
    };
    brand?.addEventListener("click", toTop);

    // 이미지·3D 가 자리 잡은 뒤 위치 다시 계산
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const late = window.setTimeout(refresh, 1200);

    return () => {
      mm.revert();
      window.clearTimeout(late);
      window.clearTimeout(resume);
      window.removeEventListener("wheel", watchWheel, { capture: true });
      brand?.removeEventListener("click", toTop);
      window.removeEventListener("load", refresh);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      root.classList.remove("home-motion");
    };
  }, []);

  return null;
}
