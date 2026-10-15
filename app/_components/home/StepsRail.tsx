"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, StatusBadge, type QuoteStatus } from "../ui";
import "./steps-rail.css";

// 와이어프레임 문구 그대로
const STEPS = [
  { title: "견적 요청", desc: "사진과 요청을 보내면 접수가 시작돼요.", status: "received" as QuoteStatus, icon: "send" },
  { title: "내용 확인", desc: "24시간 안에 필요한 내용을 함께 확인해요.", status: "checking" as QuoteStatus, icon: "check" },
  { title: "견적 확인", desc: "항목별 금액을 보고 진행 여부를 결정해요.", status: "quoted" as QuoteStatus, icon: "doc" },
];
const AUTO_MS = 2800;

/** 단계마다 보여주는 사진·작은 화면 목업 */
function Visual({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="sv0">
        <img className="sv0__bg" src="/service/garden-end.webp" alt="" draggable={false} />
        <div className="sv0__thumbs">
          {["/service/look-left.webp", "/service/garden-end.webp", "/service/look-right.webp"].map((src, k) => (
            <span key={src} style={{ "--k": k } as React.CSSProperties}>
              <img src={src} alt="" draggable={false} />
              <i aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    );
  if (i === 1)
    return (
      <div className="sv1">
        <img src="/service/look-right.webp" alt="" draggable={false} />
        <span className="sv1__lens" aria-hidden="true" />
        <span className="sv1__badge">
          <StatusBadge status="checking" />
        </span>
      </div>
    );
  return (
    <div className="sv2">
      <div className="sv2__doc">
        <div className="sv2__head">
          <b>견적 구성 예시</b>
          <StatusBadge status="quoted" />
        </div>
        {["자재비", "배송비", "시공비"].map((n, k) => (
          <p key={n} className="sv2__row" style={{ "--k": k } as React.CSSProperties}>
            <span>{n}</span>
            <i aria-hidden="true" />
          </p>
        ))}
      </div>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "send")
    return (
      <svg viewBox="0 0 48 48" {...p}>
        <rect x="6" y="10" width="26" height="22" rx="3" />
        <path d="m6 26 7-6 6 5 5-4 8 7" />
        <circle cx="25" cy="17" r="2" />
        <path d="M30 38 44 24M44 24h-8M44 24v8" />
      </svg>
    );
  if (name === "check")
    return (
      <svg viewBox="0 0 48 48" {...p}>
        <circle cx="21" cy="21" r="12" />
        <path d="m30 30 10 10" />
        <path d="m15 21 4 4 8-8" />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" {...p}>
      <path d="M12 4h18l8 8v32H12z" />
      <path d="M30 4v8h8" />
      <path d="M18 22h14M18 29h14M18 36h8" />
    </svg>
  );
}

/**
 * 06 · 신청부터 견적까지
 * 카드가 혼자 천천히 넘어가고, 마우스·손가락으로 끌어서 넘길 수도 있음. 넘어갈 때마다 상태 배지가 바뀜
 */
export function StepsRail() {
  const wrap = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const start = useRef<{ x: number; id: number } | null>(null);

  const go = useCallback((i: number) => setActive((i + STEPS.length) % STEPS.length), []);

  // 화면에 보일 때만 자동으로 넘어감
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused || !inView) return;
    const t = window.setTimeout(() => go(active + 1), active === STEPS.length - 1 ? AUTO_MS + 900 : AUTO_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, inView, go]);

  const step = () => {
    const first = rail.current?.children[0] as HTMLElement | undefined;
    return first ? first.offsetWidth + 20 : 0;
  };

  const onDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setPaused(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag(e.clientX - start.current.x);
  };
  const onUp = () => {
    if (!start.current) return;
    const w = step() || 1;
    if (drag < -w * 0.18) go(active + 1);
    else if (drag > w * 0.18) go(active - 1);
    start.current = null;
    setDrag(0);
    window.setTimeout(() => setPaused(false), 2500);
  };

  return (
    <div className="sr" ref={wrap} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="sr-copy container">
        <h2 id="steps-title" className="sr-title">
          신청하고,
          <br />
          한 번씩 확인해요.
        </h2>
        <p className="lead">테두리가 요청을 확인해 외부 조경업체의 견적과 시공 상담을 연결해요.</p>
        <div className="sr-status" aria-live="polite">
          <span className="sr-status__label">무료 견적 요청</span>
          <span key={active} className="sr-status__badge">
            <StatusBadge status={STEPS[active].status} />
          </span>
        </div>
      </div>

      <div
        className={`sr-view${start.current ? " is-drag" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="sr-rail" ref={rail} style={{ transform: `translateX(calc(${-active} * (var(--card) + 20px) + ${drag}px))` }}>
          {STEPS.map((s, i) => (
            <article
              key={s.title}
              className={`sr-panel${i === active ? " is-on" : ""}`}
              onClick={() => Math.abs(drag) < 4 && go(i)}
              aria-current={i === active ? "step" : undefined}
            >
              <div className="sr-panel__visual">
                <Visual i={i} />
              </div>
              <div className="sr-panel__text">
              <div className="sr-panel__top">
                <span className="sr-panel__no">{i + 1}</span>
                <span className="sr-panel__icon" aria-hidden="true">
                  <Icon name={s.icon} />
                </span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="sr-controls container">
        <div className="sr-bars" role="tablist" aria-label="단계 고르기">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.title}
              className={`sr-bar${i < active ? " is-done" : ""}${i === active ? " is-on" : ""}${paused || !inView ? " is-paused" : ""}`}
              style={{ "--dur": `${i === STEPS.length - 1 ? AUTO_MS + 900 : AUTO_MS}ms` } as React.CSSProperties}
              onClick={() => go(i)}
            >
              <span key={`${active}-${i}`} />
            </button>
          ))}
        </div>
        <div className="sr-arrows">
          <button type="button" onClick={() => go(active - 1)} aria-label="이전 단계">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <button type="button" onClick={() => go(active + 1)} aria-label="다음 단계">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="sr-more container">
        <Button href="/guide" variant="outline">
          이용 과정 자세히 보기
        </Button>
      </div>
    </div>
  );
}
