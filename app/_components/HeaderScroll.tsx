"use client";

import { useEffect } from "react";

/** 홈이 아닌 페이지: 조금 내리면 헤더가 진해지고, 아래로 스크롤하면 숨었다가 위로 올리면 다시 보임 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header--float");
    if (!header) return;
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const past = y > 40;
      header.classList.toggle("is-past-hero", past);
      if (Math.abs(y - lastY) > 6) {
        header.classList.toggle("is-hidden", past && y > lastY);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
