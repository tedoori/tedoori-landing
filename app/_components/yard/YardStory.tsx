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

  // 스크롤 + 자동 재생: 히어로에서 가만히 있으면 다음 장면 위치로 화면이 부드럽게 내려감 (장면과 스크롤이 늘 같이 움직임)
  // 스크롤·터치·휠·키를 쓰면 타이머를 처음부터 다시 셈. 마지막 장면에서는 멈춤
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    const go = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      // 히어로가 화면에 고정돼 있을 때만 (위로 지나갔거나 아직 안 왔으면 쉼)
      if (document.hidden || total <= 0 || r.top > 1 || -r.top > total + 1) return arm();
      const idx = stepIndexAt(clamp01(-r.top / total));
      if (idx >= YARD_STEPS.length - 1) return;
      const next = YARD_STEPS[idx + 1];
      const y = window.scrollY + r.top + total * (next.start + (next.end - next.start) * 0.35);
      window.dispatchEvent(new CustomEvent("tedoori:scroll-to", { detail: Math.round(y) }));
    };
    const arm = () => {
      window.clearTimeout(timer);
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const idx = total > 0 ? stepIndexAt(clamp01(-r.top / total)) : 0;
      timer = window.setTimeout(go, idx === 0 ? 4200 : 3400);
    };
    const events = ["scroll", "touchstart", "wheel", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, []);

  // 로고를 누르면 첫 장면부터 다시
  useEffect(() => {
    const top = () => setStep(0);
    window.addEventListener("tedoori:home-top", top);
    return () => window.removeEventListener("tedoori:home-top", top);
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
    // 휴대폰 장면 따라가기
    const STEP_GAP = 450;
    let target = 0;
    let shown = 0;
    let lastMove = 0;
    let chaseTimer = 0;
    const chase = () => {
      if (shown === target) return;
      const wait = STEP_GAP - (performance.now() - lastMove);
      if (wait > 0) {
        if (!chaseTimer) chaseTimer = window.setTimeout(() => ((chaseTimer = 0), chase()), wait);
        return;
      }
      shown += target > shown ? 1 : -1;
      lastMove = performance.now();
      setStep(shown);
      if (shown !== target) chaseTimer = window.setTimeout(() => ((chaseTimer = 0), chase()), STEP_GAP);
    };
    const onTop = () => {
      target = shown = 0;
    };
    window.addEventListener("tedoori:home-top", onTop);
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
      if (window.matchMedia("(max-width: 899px)").matches) {
        // 휴대폰: 스크롤 위치를 따라가되 한 번에 한 장면씩, 장면마다 최소 STEP_GAP 은 보여줌
        target = idx;
        chase();
        textRef.current?.style.setProperty("--t", "1");
        el.style.setProperty("--p", String(p));
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
      window.clearTimeout(chaseTimer);
      window.removeEventListener("tedoori:home-top", onTop);
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
