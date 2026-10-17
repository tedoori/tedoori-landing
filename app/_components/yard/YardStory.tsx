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

  // 휴대폰(좁은 화면): 히어로는 한 화면 높이. 장면은 시간으로 자동 넘김, 옆으로 밀면 다음/이전.
  // 위아래 스크롤은 막지 않아 바로 다음 섹션으로 부드럽게 넘어감 (예전 강제 스냅은 끊김·튕김 원인이라 뺌)
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!compact || !inView || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ms = step === 0 ? 4200 : YARD_STEPS[step].id === "outro" ? 5200 : 3400;
    const id = window.setTimeout(() => setStep((v) => (v + 1) % YARD_STEPS.length), ms);
    return () => window.clearTimeout(id);
  }, [compact, inView, paused, step]);
  // 다른 앱으로 갔다 오면 그 사이엔 멈춤
  useEffect(() => {
    const on = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  // 옆으로 밀기: 다음 / 이전 장면
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (!compact) return;
    swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const st = swipe.current;
    swipe.current = null;
    if (!compact || !st) return;
    const dx = e.changedTouches[0].clientX - st.x;
    const dy = e.changedTouches[0].clientY - st.y;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    setStep((v) => (dx < 0 ? (v + 1) % YARD_STEPS.length : (v - 1 + YARD_STEPS.length) % YARD_STEPS.length));
  };

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
      // 휴대폰은 시간으로 넘기므로 스크롤이 장면을 바꾸지 않음 (글자는 늘 또렷하게)
      if (window.matchMedia("(max-width: 899px)").matches) {
        textRef.current?.style.setProperty("--t", "1");
        return;
      }
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
    <section ref={sectionRef} className={`ys ys--film${compact ? " ys--auto" : ""}`} aria-labelledby="ys-title">
      <div className="ys-sticky" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* 실사 정원 영상: 첫 화면은 흔들리는 정원, 단계마다 조경이 하나씩 생김 */}
        <HeroFilm step={current.id} />
        {compact && (
          <div className="ys-dots" role="tablist" aria-label="장면">
            {YARD_STEPS.map((x, i) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={`${i + 1}번째 장면`}
                className={i < step ? "is-past" : i === step ? "is-on" : ""}
                onClick={() => setStep(i)}
              >
                <i key={i === step ? `on-${step}` : "off"} style={{ "--ms": `${i === 0 ? 4200 : x.id === "outro" ? 5200 : 3400}ms` } as React.CSSProperties} />
              </button>
            ))}
          </div>
        )}

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
