"use client";

import { useEffect, useRef, useState } from "react";
import { useAutoPlay } from "../_components/home/useAutoPlay";

/** 화면에 들어오면 한 번 켜짐 */
function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on] as const;
}

/** 화면에 들어오면 정해진 시간 동안 --p 를 0 → 1 로 (스크롤로 조작하지 않음) */
function usePlayP<T extends HTMLElement>(duration: number) {
  const ref = useAutoPlay<T>(duration, (p) => ref.current?.style.setProperty("--p", p.toFixed(4)), 0.3);
  return ref;
}

// ---------- 노선도: 점이 노선을 따라 달리며 역이 켜짐 ----------
const FLOW = [
  ["접수", "한 질문씩 답하기"],
  ["확인", "필요한 내용 확인"],
  ["실측", "담당자가 방문해 실측"],
  ["견적", "항목별 금액 확인"],
  ["결정", "진행·조정·보류 선택"],
  ["완료", "완료 사진·후기"],
];

export function RouteMap() {
  const [ref, on] = useInView<HTMLOListElement>(0.3);
  return (
    <ol ref={ref} className={`rm${on ? " is-on" : ""}`}>
      <span className="rm-line" aria-hidden="true">
        <span className="rm-line__fill" />
        <span className="rm-train" />
      </span>
      {FLOW.map(([t, d], i) => (
        <li key={t} className="rm-stop" style={{ "--i": i } as React.CSSProperties}>
          <span className="rm-dot" aria-hidden="true" />
          <strong>{t}</strong>
          <span>{d}</span>
        </li>
      ))}
    </ol>
  );
}

// ---------- 체크리스트: 화면에 들어오면 하나씩 체크 ----------
const PREP = [
  ["사는 지역", "시·군·구 · 주거 형태"],
  ["필요한 작업", "작업 유형 · 자재/배송/시공 범위"],
  ["현재 모습", "현장 사진 1장 이상 · 크기 또는 수량"],
  ["생각한 조건", "희망 시기 · 요청사항 · 이메일"],
];

export function Checklist() {
  const ref = usePlayP<HTMLUListElement>(4200);
  return (
    <ul ref={ref} className="ck">
      {PREP.map(([name, desc], i) => (
        <li key={name} className="ck-row" style={{ "--k": `clamp(0, var(--p) * ${PREP.length} - ${i}, 1)` } as React.CSSProperties}>
          <span className="ck-box" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5 10 17 19 7" pathLength={1} />
            </svg>
          </span>
          <p className="ck-name">{name}</p>
          <p className="ck-desc">{desc}</p>
        </li>
      ))}
    </ul>
  );
}

// ---------- 24시간: 원형 시계 + 메일함 알림 ----------
const NOTES = [
  ["신청 확인", "접수 메일을 보내요. 신청 내용과 진행 단계는 내 신청에서 언제든 볼 수 있어요."],
  ["추가 자료가 필요하면", "'보완 필요' 메일을 받으면 내 신청에서 신청을 수정해 사진이나 설명을 더해주세요."],
];

export function DayClock() {
  const [ref, on] = useInView<HTMLDivElement>(0.4);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setN(24);
    let k = 0;
    const t = window.setInterval(() => {
      k += 1;
      setN(k);
      if (k >= 24) window.clearInterval(t);
    }, 45);
    return () => window.clearInterval(t);
  }, [on]);
  return (
    <div ref={ref} className={`dc${on ? " is-on" : ""}`}>
      <div className="dc-clock" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="86" className="dc-track" />
          <circle cx="100" cy="100" r="86" className="dc-ring" pathLength={1} />
        </svg>
        <span className="dc-num">
          {n}
          <small>시간</small>
        </span>
      </div>
      <ul className="dc-inbox">
        {NOTES.map(([t, d], i) => (
          <li key={t} className="dc-mail" style={{ "--i": i } as React.CSSProperties}>
            <span className="dc-mail__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <div>
              <strong>{t}</strong>
              <p>{d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- 견적 구성: 줄에 매달린 가격표 세 장이 떨어져 흔들림 ----------
const COSTS = [
  ["자재비", "자재 종류·수량과 금액"],
  ["배송비", "업체가 산정한 배송 조건과 금액"],
  ["시공비", "견적에 포함된 작업과 금액"],
];
// 가격표 안 예시 줄 (홈 견적서 예시와 같은 금액)
const COST_LINES: [string, string][][] = [
  [["화강석 판석 600×300", "12장"], ["마사토 · 부자재", "1식"]],
  [["1톤 화물 배송", "1회"], ["하차 · 현장 이동", "포함"]],
  [["판석 깔기 · 수평 잡기", "2인"], ["주변 정리", "포함"]],
];
const COST_WON = [420000, 80000, 360000];
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function CostTags() {
  const [ref, on] = useInView<HTMLDivElement>(0.15);
  return (
    <div ref={ref} className={`ct${on ? " is-on" : ""}`}>
      <p className="ct-label">견적 구성 예시</p>
      <span className="ct-string" aria-hidden="true" />
      <ul className="ct-tags">
        {COSTS.map(([name, desc], i) => (
          <li key={name} className={`ct-tag ct-tag--${i}`} style={{ "--i": i } as React.CSSProperties}>
            <span className="ct-tag__cord" aria-hidden="true" />
            <div className="ct-tag__card">
              <span className="ct-tag__hole" aria-hidden="true" />
              <span className="ct-tag__no" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <strong className="ct-tag__name">{name}</strong>
              <span className="ct-tag__desc">{desc}</span>
              <span className="ct-tag__lines">
                {COST_LINES[i].map(([k, v]) => (
                  <span key={k}>
                    <span>{k}</span>
                    <span>{v}</span>
                  </span>
                ))}
              </span>
              <span className="ct-tag__won">{won(COST_WON[i])}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="ct-sum">
        <span className="ct-sum__total">
          <small>합계 · 부가세 포함</small>
          <strong>{won(COST_WON.reduce((a, b) => a + b, 0))}</strong>
        </span>
        <ul className="ct-sum__terms" aria-label="함께 적는 조건">
          <li>
            <em>제외</em> 기존 바닥 철거·폐기물 처리
          </li>
          <li>
            <em className="is-add">추가 비용</em> 장비가 들어가기 어려운 현장은 별도 협의
          </li>
          <li>
            <em className="is-ok">유효기간</em> 발행일부터 14일
          </li>
        </ul>
      </div>
      <p className="ct-sample">금액은 이해를 돕기 위한 예시예요. 디딤석 화강석 판석 12장, 경기 용인시 기준</p>
    </div>
  );
}

// ---------- 결정: 세로 선이 그려지며 카드가 좌우에서 ----------
const DECIDE = [
  ["현장 실측 · 필수", "견적 전에 담당자가 방문해 현장을 실측해요. 실측한 내용으로 견적이 나와요."],
  ["진행 의사 전달", "내 신청 견적서에서 진행·조정·보류 중 하나를 골라주세요."],
  ["계약·시공", "업체와 작업 범위·일정·대금을 확인하고 직접 계약해요."],
  ["완료·후기", "완료 후 내 신청에서 완료 사진을 확인하고 후기를 남길 수 있어요."],
];

export function DecideLine() {
  const ref = usePlayP<HTMLOListElement>(3600);
  return (
    <ol ref={ref} className="dl">
      <span className="dl-line" aria-hidden="true" />
      {DECIDE.map(([t, d], i) => (
        <li key={t} className={`dl-step dl-step--${i % 2 ? "r" : "l"}`} style={{ "--k": `clamp(0, var(--p) * ${DECIDE.length + 0.2} - ${i}, 1)` } as React.CSSProperties}>
          <span className="dl-no" aria-hidden="true">
            {i + 1}
          </span>
          <div className="dl-card">
            <p className="dl-title">{t}</p>
            <p className="dl-desc">{d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------- 마무리: 테두리 로고가 선으로 그려진 뒤 색이 채워짐 ----------
const LOGO = [
  { d: "M58.5701 0H0V14.4671H58.5701V0Z", c: "#1DA049" },
  { d: "M58.5701 63C0.666285 63 0 32.0719 0 30.7536V23.5201H58.5701V37.9872H18.5042C24.038 43.312 35.9238 48.533 58.5701 48.533V63Z", c: "#1DA049" },
  { d: "M122.785 0H64.215V14.4671H122.785V0Z", c: "#ffffff" },
  { d: "M122.785 48.533H64.215V63H122.785V48.533Z", c: "#ffffff" },
  { d: "M187 63H128.43V25.0128H168.496C162.962 19.688 151.076 14.4671 128.43 14.4671V0C186.334 0 187 30.9319 187 32.2464V39.4799H142.851V48.5329H187V63Z", c: "#1DA049" },
];

export function LogoDraw() {
  const [ref, on] = useInView<HTMLSpanElement>(0.4);
  return (
    <span ref={ref} className={`ld${on ? " is-on" : ""}`} aria-hidden="true">
      <svg viewBox="-2 -2 191 67" fill="none">
        {LOGO.map((p, i) => (
          <path key={i} d={p.d} pathLength={1} style={{ "--c": p.c, "--i": i } as React.CSSProperties} />
        ))}
      </svg>
    </span>
  );
}
