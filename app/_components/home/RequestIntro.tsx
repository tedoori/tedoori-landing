"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "../ui";
import "./request-intro.css";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// 와이어프레임 질문과 입력 안내 그대로
const QUESTIONS = [
  { q: "어디인가요?", hint: "시·군·구 · 주거 형태" },
  { q: "어떤 작업이 필요한가요?", hint: "식재 / 잔디 / 자갈 / 디딤석 / 화단" },
  { q: "현재 모습을 보여주세요.", hint: "현장 사진 · 없으면 나중에 보완" },
];
const WORKS = ["식재", "잔디", "자갈", "디딤석", "화단"];
const PICKED = ["잔디", "디딤석"];
// 대화 순서: 0 질문1 · 1 답1 · 2 질문2 · 3 칩 고르기 · 4 답2 · 5 질문3 · 6 사진 · 7 접수 완료 화면 · 8 접수 메일 도착
const CHAT_STEPS = 9;
const PHOTOS = ["/service/garden-end-s.webp", "/service/look-left-s.webp", "/service/look-right-s.webp"];

const HEAD = ["서울·경기·인천,", "\n", "집에서", "견적을", "요청하세요."];

/**
 * 01 · 집에서 견적 요청 (Tara 오마주)
 * 히어로가 위로 빠지면 원 두 개가 들어와 겹치고 → 문장이 한 단어씩 채워지고 →
 * 초록 원이 커져 배경이 되면서 → 휴대폰이 올라와 대화형 신청이 진행됨
 */
export function RequestIntro() {
  const track = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1);
  const after = useRef<HTMLDivElement>(null);
  const [afterIn, setAfterIn] = useState(false);

  // 모바일: 휴대폰 아래 안내·버튼이 화면에 들어올 때 부드럽게 올라옴
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setAfterIn(true), { threshold: 0.2 });
    if (after.current) io.observe(after.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = track.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = -2;
    // 휴대폰: 세게 쓸어 올려도 폰과 집이 만나는 첫 장면을 놓치지 않게, 섹션에 들어서면 시간으로 끝까지 재생
    const INTRO_END = 0.48;
    const INTRO_MS = 3200;
    // 대화 8단계 + 접수 화면까지 걸리는 시간 (한 단계 약 1초)
    const CHAT_MS = 8500;
    const CHAT_END = 0.92;
    let introAt: number | null = null;
    // 재생하는 동안 관성 스크롤에 휙 지나가지 않게 그 자리에 잠깐 붙잡음 (휴대폰, 맨 위에서 내려올 때마다 한 번)
    let lockY: number | null = null;
    let unlockTimer = 0;
    const holdTouch = (e: TouchEvent) => {
      if (lockY !== null) e.preventDefault();
    };
    const holdScroll = () => {
      if (lockY !== null && Math.abs(window.scrollY - lockY) > 1) window.scrollTo(0, lockY);
    };
    const lock = () => {
      lockY = Math.max(1, Math.round(window.scrollY));
      window.scrollTo(0, lockY);
      document.documentElement.style.overscrollBehavior = "none";
      window.addEventListener("touchmove", holdTouch, { passive: false });
      window.addEventListener("scroll", holdScroll, { passive: true });
      unlockTimer = window.setTimeout(unlock, INTRO_MS + 250);
    };
    const unlock = () => {
      lockY = null;
      document.documentElement.style.overscrollBehavior = "";
      window.removeEventListener("touchmove", holdTouch);
      window.removeEventListener("scroll", holdScroll);
    };
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const total = r.height - vh;
      const pScroll = reduce ? 1 : clamp01(total > 0 ? -r.top / total : 0);
      let p = pScroll;
      if (!reduce && vw < 900) {
        // 이 섹션은 히어로 화면과 겹쳐 있어, 히어로를 올리기 시작하면(조금이라도 내려가면) 재생 시작.
        // 맨 위로 완전히 되돌아가면 처음부터 다시
        if (introAt === null && pScroll > 0.004) {
          introAt = performance.now();
          // 새로고침으로 중간에서 열린 경우 등은 붙잡지 않음
          if (pScroll < 0.2) lock();
        }
        if (introAt !== null && pScroll === 0) introAt = null;
        if (introAt !== null) {
          // 폰·집 장면(시간) → 이어서 대화가 한 줄씩(시간) → 접수 완료 화면에서 멈춤. 스크롤을 더 내리면 그만큼 앞서 감
          const el2 = performance.now() - introAt;
          const pTime = el2 < INTRO_MS ? (el2 / INTRO_MS) * INTRO_END : Math.min(CHAT_END, INTRO_END + ((el2 - INTRO_MS) / CHAT_MS) * (CHAT_END - INTRO_END));
          p = Math.max(pScroll, pTime);
          if (pTime < CHAT_END) raf = requestAnimationFrame(update);
        }
      }
      // 히어로가 올라가는 동안 바로 시작 (섹션이 히어로 마지막 화면과 겹쳐 있음)
      const a = ease(seg(p, 0.0, 0.09));
      const t = seg(p, 0.05, 0.22);
      const g = ease(seg(p, 0.25, 0.38));
      const ph = ease(seg(p, 0.34, 0.48));
      const c = seg(p, 0.48, 0.92);
      // 초록 원이 화면을 다 덮을 만큼의 배율 (원 중심에서 가장 먼 모서리까지)
      const cs = vw < 900 ? 96 : 132;
      const cy = vh * (vw < 900 ? 0.3 : 0.32);
      // 아이폰은 툴바가 접히면 화면이 길어지므로 여유 있게 (아래 흰 줄 방지)
      const far = Math.hypot(vw / 2 + cs, Math.max(cy, vh * 1.25 - cy));
      el.style.setProperty("--a", a.toFixed(4));
      el.style.setProperty("--t", t.toFixed(4));
      el.style.setProperty("--g", g.toFixed(4));
      el.style.setProperty("--ph", ph.toFixed(4));
      el.style.setProperty("--gs", ((far * 2) / cs).toFixed(3));
      const s = c <= 0 ? -1 : Math.min(CHAT_STEPS - 1, Math.floor(c * CHAT_STEPS));
      if (s !== last) {
        last = s;
        setStep(s);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(unlockTimer);
      unlock();
    };
  }, []);

  const on = (k: number) => step >= k;
  const qIndex = step < 2 ? 0 : step < 5 ? 1 : 2;
  const answered = step >= 6 ? 3 : step >= 4 ? 2 : step >= 1 ? 1 : 0;
  let wi = 0;
  const words = HEAD.filter((w) => w !== "\n").length;

  return (
    <section className="ri" aria-labelledby="request-title">
      <div className="ri-track" ref={track}>
        <div className="ri-stage">
          <span className="ri-circle ri-circle--mint" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
              <path d="M10.5 18.5h3" strokeLinecap="round" />
            </svg>
          </span>
          <span className="ri-circle ri-circle--sand" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M3.5 11 12 4l8.5 7" />
              <path d="M5.5 9.5V20h13V9.5" />
              <path d="M10 20v-5h4v5" />
            </svg>
          </span>

          <div className="ri-head">
            <h2 id="request-title" className="ri-title">
              {HEAD.map((w, i) =>
                w === "\n" ? (
                  <br key={i} />
                ) : (
                  <span key={i} className={w === "집에서" ? "ri-w ri-w--em" : "ri-w"} style={{ "--i": wi++, "--n": words } as React.CSSProperties}>
                    {w}{" "}
                  </span>
                ),
              )}
            </h2>
            <p className="ri-lead ri-lead--m">필요한 작업과 사진을 알려주세요.</p>
          </div>

          <div className="ri-info">
            <p className="ri-lead">필요한 작업과 사진을 알려주세요.</p>
            <p className="note">
              이어서 희망 시기, 요청사항과 이메일을 확인해요.
              <br />
              예산은 정해졌을 때만 적어주세요.
            </p>
            <Link href="/guide" className="btn btn--outline">
              준비할 내용 확인
            </Link>
          </div>

          <figure className="ri-phone" aria-label="신청 화면 예시">
            <div className="ri-device">
              <span className="ri-btn ri-btn--a" aria-hidden="true" />
              <span className="ri-btn ri-btn--b" aria-hidden="true" />
              <span className="ri-btn ri-btn--c" aria-hidden="true" />
              <div className="ri-screen">
                <div className="ri-status" aria-hidden="true">
                  <span>9:41</span>
                  <span className="ri-island" />
                  <span className="ri-status__icons">
                    <svg viewBox="0 0 18 12" width="17" height="11" fill="currentColor">
                      <rect x="0" y="8" width="3" height="4" rx="1" />
                      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                      <rect x="10" y="3" width="3" height="9" rx="1" />
                      <rect x="15" y="0" width="3" height="12" rx="1" />
                    </svg>
                    <svg viewBox="0 0 26 12" width="24" height="11">
                      <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.4" />
                      <rect x="2" y="2" width="17" height="8" rx="1.6" fill="currentColor" />
                      <rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />
                    </svg>
                  </span>
                </div>
                <div className="ri-app">
                  <div className="ri-bar">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <strong>무료 견적 요청</strong>
                    <span className="ri-bar__count">{answered} / 3</span>
                  </div>
                  <div className="ri-steps" aria-hidden="true">
                    {[0, 1, 2].map((k) => (
                      <span key={k} className={answered > k ? "is-on" : ""} />
                    ))}
                  </div>

                  <div className="ri-chat">
                    <div className="ri-msgs">
                      <Msg show={on(0)} who="bot">{QUESTIONS[0].q}</Msg>
                      <Msg show={on(1)} who="me">경기 용인시 · 단독주택</Msg>
                      <Msg show={on(2)} who="bot">{QUESTIONS[1].q}</Msg>
                      {on(3) && (
                        <div className={`ri-chips${on(4) ? " is-done" : ""}`}>
                          {WORKS.map((w, i) => (
                            <span key={w} className={PICKED.includes(w) ? "ri-chip is-pick" : "ri-chip"} style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
                              {w}
                            </span>
                          ))}
                        </div>
                      )}
                      <Msg show={on(4)} who="me">잔디, 디딤석</Msg>
                      <Msg show={on(5)} who="bot">{QUESTIONS[2].q}</Msg>
                      {on(6) && (
                        <div className="ri-photos">
                          {PHOTOS.map((src) => (
                            <img key={src} src={src} alt="" draggable={false} loading="lazy" decoding="async" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`ri-done${on(7) ? " is-on" : ""}`} aria-hidden={!on(7)}>
                    <span className="ri-done__mark" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6">
                        <path d="m6 12.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <strong className="ri-done__title">견적 요청이 접수됐어요.</strong>
                    <span className="ri-done__no">
                      접수번호 <b>TD-2610-0001</b>
                    </span>
                    <ol className="ri-done__track">
                      {["접수", "확인", "실측", "견적", "결정", "완료"].map((t, k) => (
                        <li key={t} className={k === 0 ? "is-done" : k === 1 ? "is-now" : ""}>
                          <i />
                          {t}
                        </li>
                      ))}
                    </ol>
                    <span className="ri-done__note">신청 내역과 진행 단계는<br />내 신청에서 확인할 수 있어요.</span>
                  </div>

                  <div className="ri-input">
                    <span>{QUESTIONS[qIndex].hint}</span>
                    <i aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 19V5m-6 6 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </i>
                  </div>
                </div>
              </div>
            </div>
            <figcaption className="note">신청 화면 예시</figcaption>
          </figure>

          <div className={`ri-float${on(8) ? " is-on" : ""}`} aria-hidden="true">
            <span className="ri-float__from">
              <img src="/figma/logo-mark.svg" alt="" />
              테두리 · 방금
            </span>
            <strong>[테두리] 견적 요청이 접수됐어요</strong>
            <span className="ri-float__body">접수번호 TD-2610-0001 · 경기 용인시 · 잔디, 디딤석</span>
            <StatusBadge status="received" />
          </div>
        </div>
      </div>

      <div ref={after} className={`ri-after container${afterIn ? " is-in" : ""}`}>
        <p className="note">
          이어서 희망 시기, 요청사항과 이메일을 확인해요.
          <br />
          예산은 정해졌을 때만 적어주세요.
        </p>
        <Link href="/guide" className="btn btn--outline btn--block">
          준비할 내용 확인
        </Link>
      </div>
    </section>
  );
}

function Msg({ show, who, children }: { show: boolean; who: "bot" | "me"; children: React.ReactNode }) {
  if (!show) return null;
  return <p className={`ri-msg ri-msg--${who}`}>{children}</p>;
}
