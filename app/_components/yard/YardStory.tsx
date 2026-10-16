"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { clamp01, stepIndexAt, WORK_STEP_IDS, YARD_STEPS } from "./steps";
import { HeroFilm } from "./HeroFilm";
import { YardBackground } from "./YardBackground";
import type { TagRefs } from "./YardScene";
import "./yard.css";

const YardScene = dynamic(() => import("./YardScene"), { ssr: false });

type WorkId = (typeof WORK_STEP_IDS)[number];

function Words({ text }: { text: string }) {
  const lines = useMemo(() => text.split("\n"), [text]);
  const n = useMemo(() => text.split(/\s+/).filter(Boolean).length, [text]);
  let i = 0;
  return (
    <>
      {lines.map((line, li) => (
        <span key={li} className={li === lines.length - 1 && lines.length > 1 ? "ys-line ys-line--em" : "ys-line"}>
          {line.split(" ").map((w, k) => (
            <span key={k}>
              {k > 0 && " "}
              <span className="ys-word" style={{ "--i": i++, "--n": n } as React.CSSProperties}>
                {w}
              </span>
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

const SNAP_POINTS = YARD_STEPS.map((s, i) => (i === 0 ? 0 : s.start + (s.end - s.start) * 0.75));

export function YardStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const tagRefs: TagRefs = useRef({});
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(true);
  const [reduced] = useState(false);
  const [compact, setCompact] = useState(false);

  // 모바일(손가락 스크롤): 세게 쓸어도 장면 하나씩 멈추도록 히어로 안에서만 스냅을 켬.
  // 히어로를 지난 뒤 화면을 만지면 스냅을 꺼서 아래 섹션은 평소처럼 자유 스크롤
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const onTouch = () => {
      const r = el.getBoundingClientRect();
      // 히어로 마지막 장면을 지나 반 화면 이상 내려왔으면 끔
      const inHero = r.bottom - window.innerHeight * 0.5 > 0;
      root.style.scrollSnapType = inHero ? "y mandatory" : "";
    };
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouch);
      root.style.scrollSnapType = "";
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    setCompact(mq.matches);
    const on = () => setCompact(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);

    let raf = 0;
    let hdr = 0;
    // 헤더 높이만큼 아래에서 고정되도록 (스크롤해도 글자 위치가 그대로)
    const measure = () => {
      hdr = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
      el.style.setProperty("--hdr", hdr + "px");
    };
    measure();
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // 헤더가 떠 있으므로(위 여백은 섹션 padding) 섹션 전체 스크롤 구간 기준
      const total = r.height - window.innerHeight;
      const p = clamp01(total > 0 ? -r.top / total : 0);
      progress.current = p;
      const idx = stepIndexAt(p);
      setStep(idx);
      const s = YARD_STEPS[idx];
      const local = clamp01((p - s.start) / ((s.end - s.start) * 0.6));
      textRef.current?.style.setProperty("--t", String(idx === 0 ? 1 : local));
      el.style.setProperty("--p", String(p));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const current = YARD_STEPS[step];
  const activeWorks = useMemo(() => {
    const s = new Set<WorkId>();
    YARD_STEPS.slice(0, step + 1).forEach((x) => {
      if ((WORK_STEP_IDS as readonly string[]).includes(x.id)) s.add(x.id as WorkId);
    });
    return s;
  }, [step]);
  const focus = (WORK_STEP_IDS as readonly string[]).includes(current.id) ? (current.id as WorkId) : null;
  const workCount = activeWorks.size;
  const isOutro = current.id === "outro";

  return (
    <section ref={sectionRef} className="ys ys--film" aria-labelledby="ys-title">
      <div className="ys-sticky">
        {/* 실사 정원 영상: 첫 화면은 흔들리는 정원, 단계마다 조경이 하나씩 생김 */}
        <HeroFilm step={current.id} />

        <div className="ys-copy" ref={textRef}>
          {step > 0 && (
            <div className="ys-progress" aria-hidden="true">
              <span className="ys-progress__label">작업</span>
              <span className="ys-progress__count">
                {workCount} / {WORK_STEP_IDS.length}
              </span>
              <span className="ys-progress__track">
                <span style={{ width: `${(workCount / WORK_STEP_IDS.length) * 100}%` }} />
              </span>
            </div>
          )}
          <h1 id="ys-title" key={current.id} className="ys-title">
            <Words text={current.title} />
          </h1>
          <p key={`${current.id}-b`} className="ys-body">
            {current.body}
          </p>
          <div className="ys-actions">
            <Link href={isOutro ? `/quote?work=${encodeURIComponent([...activeWorks].join(","))}` : "/quote"} className="btn btn--primary">
              무료 견적 시작하기
            </Link>
            {step === 0 && (
              <p className="ys-hint">
                <span>
                  서울·경기·인천 · <strong>견적 요청 별도 비용 없음</strong>
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
      {/* 모바일 장면 멈춤 지점: 데스크톱 휠 넘김과 같은 위치(각 장면 75%) + 히어로 끝 */}
      {SNAP_POINTS.map((f, i) => (
        <span key={i} className="ys-snap" style={{ "--f": f } as React.CSSProperties} aria-hidden="true" />
      ))}
      <span className="ys-snap ys-snap--end" aria-hidden="true" />
      {/* 화면 읽기 프로그램용 요약 */}
      <ol className="sr-only">
        {YARD_STEPS.map((s) => (
          <li key={s.id}>
            {s.title.replace("\n", " ")} {s.body}
          </li>
        ))}
      </ol>
    </section>
  );
}
