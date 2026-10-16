"use client";

import { useEffect, useRef, useState } from "react";
import "./flow-mock.css";

// 이용안내: 견적 요청부터 완료까지, 단계마다 휴대폰에 뜨는 화면을 아이폰 목업으로 보여줌
// 목업 안 문구는 실제 신청·내 신청 화면 문구를 따름

const STEPS = [
  { k: "견적 요청", desc: "질문에 하나씩 답하고 사진을 올려요.", screen: "무료 견적 신청" },
  { k: "접수", desc: "접수번호가 나오고, 내 신청에서 신청 내용을 볼 수 있어요.", screen: "홈" },
  { k: "확인", desc: "담당자가 신청을 읽고 24시간 안에 연락드려요.", screen: "홈" },
  { k: "실측", desc: "방문 일정에서 실측 날짜를 확인하고 주소를 남겨요.", screen: "방문 일정" },
  { k: "견적", desc: "견적서에서 항목별 금액을 보고 진행·조정·보류를 골라요.", screen: "견적서" },
  { k: "결정", desc: "진행이 확정되면 작업일을 방문 일정에서 알려드려요.", screen: "방문 일정" },
  { k: "완료", desc: "완료 사진을 확인하고 후기를 남겨요.", screen: "완료" },
];
const TRACK = ["접수", "확인", "실측", "견적", "결정", "완료"];
const AUTO_MS = 2400;

export function FlowMock() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  // 화면에 보일 때만 자동으로 넘김
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setI((v) => (v + 1) % STEPS.length), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [i, auto, seen]);

  // 휴대폰 가로 탭: 지금 단계가 보이게 옆으로만 스크롤
  useEffect(() => {
    const list = listRef.current;
    const on = list?.querySelector<HTMLElement>(".is-on");
    if (!list || !on || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: on.offsetLeft - list.clientWidth / 2 + on.offsetWidth / 2, behavior: "smooth" });
  }, [i]);

  const pick = (n: number) => {
    setAuto(false);
    setI(n);
  };

  return (
    <div ref={ref} className="fm" style={{ "--auto": `${AUTO_MS}ms` } as React.CSSProperties}>
      <ol ref={listRef} className="fm-steps" aria-label="진행 단계">
        {STEPS.map((s, n) => (
          <li key={s.k}>
            <button type="button" className={`fm-step${n === i ? " is-on" : ""}${n < i ? " is-past" : ""}`} aria-current={n === i ? "step" : undefined} onClick={() => pick(n)}>
              <span className="fm-step__no">{n + 1}</span>
              <span className="fm-step__txt">
                <strong>{s.k}</strong>
                <span>{s.desc}</span>
              </span>
              {n === i && auto && seen && <i className="fm-step__bar" key={i} aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ol>

      <p className="fm-now" key={`now-${i}`}>{STEPS[i].desc}</p>

      <div className="fm-stage">
        <div className="fm-iphone" aria-live="polite">
          <div className="fm-display">
            <span className="fm-island" aria-hidden="true" />
            <div className="fm-status" aria-hidden="true">
              <span>9:41</span>
              <span className="fm-status__icons">
                <svg viewBox="0 0 18 12" width="17" height="11"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
                <svg viewBox="0 0 16 12" width="15" height="11"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .4 10.3 10.3 0 0 0 .8 3.3L2 4.6a8.5 8.5 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4a6.7 6.7 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3ZM8 9.4 9.8 7.6a2.6 2.6 0 0 0-3.6 0Z" /></svg>
                <span className="fm-battery"><i /></span>
              </span>
            </div>
            <div className="fm-app">
              <div className="fm-appbar">
                <img src="/figma/logo-mark.svg" width={34} height={12} alt="" />
                <strong>테두리</strong>
                <span className="fm-appbar__tab" key={`tab-${i}`}>{STEPS[i].screen}</span>
              </div>
              <div className="fm-screen" key={i}>
                {i > 0 && <Track now={i - 1} />}
                <Screen i={i} />
              </div>
            </div>
            <span className="fm-home" aria-hidden="true" />
          </div>
        </div>
        <p className="fm-caption">화면 예시예요</p>
      </div>
    </div>
  );
}

function Track({ now }: { now: number }) {
  return (
    <ol className="fm-track fm-in" style={{ "--d": 0 } as React.CSSProperties} aria-label={`진행 단계 ${TRACK[now]}`}>
      {TRACK.map((t, n) => (
        <li key={t} className={n < now || now === 5 ? "is-done" : n === now ? "is-now" : ""}>
          <i />
          {t}
        </li>
      ))}
    </ol>
  );
}

/** 2026년 10월 달력 (1일 목요일). 오늘은 16일 */
function Calendar({ marks }: { marks: Record<number, "done" | "next"> }) {
  const cells: (number | null)[] = [...Array(4).fill(null), ...Array.from({ length: 31 }, (_, n) => n + 1)];
  return (
    <div className="fm-cal fm-in" style={{ "--d": 1 } as React.CSSProperties}>
      <div className="fm-cal__head">
        <strong>2026년 10월</strong>
        <span>‹ ›</span>
      </div>
      <div className="fm-cal__grid">
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
          <span key={w} className="fm-cal__w">{w}</span>
        ))}
        {cells.map((d, n) => (
          <span key={n} className={d ? `fm-cal__d${d === 16 ? " is-today" : ""}${marks[d] ? ` is-${marks[d]}` : ""}` : ""}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

const D = (n: number) => ({ "--d": n }) as React.CSSProperties;

function Screen({ i }: { i: number }) {
  if (i === 0)
    return (
      <>
        <div className="fm-progress fm-in" style={D(0)}><span /></div>
        <p className="fm-q fm-in" style={D(1)}>어떤 작업이 필요하세요?</p>
        <div className="fm-chips fm-in" style={D(2)}>
          {["식재", "잔디", "자갈", "디딤석", "화단", "기타"].map((c) => (
            <span key={c} className={c === "잔디" || c === "디딤석" ? "is-on" : ""}>{c}</span>
          ))}
        </div>
        <span className="fm-btn fm-in" style={D(3)}>다음</span>
      </>
    );
  if (i === 1)
    return (
      <div className="fm-card fm-in" style={D(1)}>
        <span className="fm-badge">접수됨</span>
        <strong className="fm-card__title">잔디 · 디딤석</strong>
        <span className="fm-muted">TD-2610-0001 · 경기 용인시</span>
        <p className="fm-hint">상세 주소를 미리 입력해 두시면 실측 일정을 더 빨리 잡을 수 있어요.</p>
        <span className="fm-btn fm-btn--line">주소 입력하기</span>
      </div>
    );
  if (i === 2)
    return (
      <div className="fm-card fm-in" style={D(1)}>
        <span className="fm-kicker">지금 할 일</span>
        <strong className="fm-card__title">신청을 확인하고 있어요</strong>
        <span className="fm-muted">24시간 안에 담당자가 연락드려요.</span>
        <div className="fm-typing" aria-hidden="true"><i /><i /><i /></div>
      </div>
    );
  if (i === 3)
    return (
      <>
        <Calendar marks={{ 20: "next" }} />
        <div className="fm-event fm-in" style={D(2)}>
          <span className="fm-event__bar" />
          <div>
            <strong>실측 방문 <em className="fm-pill">D-4</em></strong>
            <span>10월 20일 (화) 오후 2:00</span>
            <span className="fm-ok">✓ 방문 주소 입력 완료</span>
          </div>
        </div>
        <p className="fm-muted fm-in" style={D(3)}>담당자가 방문해 크기와 바닥 상태를 확인해요. 일정이 바뀌면 바로 알려드려요.</p>
      </>
    );
  if (i === 4)
    return (
      <div className="fm-card fm-in" style={D(1)}>
        <span className="fm-kicker">견적서</span>
        <dl className="fm-rows">
          <div><dt>자재비</dt><dd>1,240,000원</dd></div>
          <div><dt>배송비</dt><dd>150,000원</dd></div>
          <div><dt>시공비</dt><dd>980,000원</dd></div>
          <div className="fm-rows__sum"><dt>합계</dt><dd>2,370,000원</dd></div>
        </dl>
        <div className="fm-answers">
          <span className="is-on">진행할게요</span>
          <span>조정 상담</span>
          <span>이번엔 보류</span>
        </div>
      </div>
    );
  if (i === 5)
    return (
      <>
        <Calendar marks={{ 20: "done", 28: "next" }} />
        <div className="fm-event fm-in" style={D(2)}>
          <span className="fm-event__bar" />
          <div>
            <strong>시공 <em className="fm-pill">D-12</em></strong>
            <span>10월 28일 (수) 오전 9:00</span>
            <span className="fm-ok">✓ 실측 완료 · ✓ 진행 확정</span>
          </div>
        </div>
        <p className="fm-muted fm-in" style={D(3)}>작업일과 준비할 내용을 미리 알려드려요.</p>
      </>
    );
  return (
    <div className="fm-card fm-in" style={D(1)}>
      <span className="fm-kicker">완료 보고</span>
      <img className="fm-photo" src="/service/garden-end-s.webp" alt="" loading="lazy" decoding="async" />
      <strong className="fm-card__title">테두리가 완료됐어요</strong>
      <span className="fm-stars" aria-label="별점 5점">
        {[0, 1, 2, 3, 4].map((n) => (
          <i key={n} style={D(n)}>★</i>
        ))}
      </span>
    </div>
  );
}
