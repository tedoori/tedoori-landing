"use client";

import { useEffect, useRef, useState } from "react";
import "./flow-mock.css";

// 이용안내: 견적 요청부터 완료까지, 단계마다 내 신청 화면이 어떻게 바뀌는지 보여주는 목업
// 목업 안 문구는 실제 신청·내 신청 화면 문구를 따름

const STEPS = [
  { k: "견적 요청", desc: "질문에 하나씩 답하고 사진을 올려요." },
  { k: "접수", desc: "접수번호가 나오고, 내 신청에서 신청 내용을 볼 수 있어요." },
  { k: "확인", desc: "담당자가 신청을 읽고 24시간 안에 연락드려요." },
  { k: "실측", desc: "방문 일정에서 실측 날짜를 확인하고 주소를 남겨요." },
  { k: "견적", desc: "견적서에서 항목별 금액을 보고 진행·조정·보류를 골라요." },
  { k: "결정", desc: "진행이 확정되면 작업일을 방문 일정에서 알려드려요." },
  { k: "완료", desc: "완료 사진을 확인하고 후기를 남겨요." },
];
const TRACK = ["접수", "확인", "실측", "견적", "결정", "완료"];
const AUTO_MS = 3400;

export function FlowMock() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
  const listRef = useRef<HTMLOListElement>(null);
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
    <div ref={ref} className="fm">
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

      <p className="fm-now">{STEPS[i].desc}</p>

      <div className="fm-phone" aria-live="polite">
        <div className="fm-phone__top">
          <span className="fm-dot" />
          <span>{i === 0 ? "무료 견적 신청" : "내 신청"}</span>
        </div>
        <div className="fm-screen" key={i}>
          {i > 0 && <Track now={i - 1} />}
          <Screen i={i} />
        </div>
        <p className="fm-caption">화면 예시예요</p>
      </div>
    </div>
  );
}

function Track({ now }: { now: number }) {
  return (
    <ol className="fm-track" aria-label={`진행 단계 ${TRACK[now]}`}>
      {TRACK.map((t, n) => (
        <li key={t} className={n < now || now === 5 ? "is-done" : n === now ? "is-now" : ""}>
          <i />
          {t}
        </li>
      ))}
    </ol>
  );
}

function Screen({ i }: { i: number }) {
  if (i === 0)
    return (
      <>
        <div className="fm-progress"><span style={{ width: "45%" }} /></div>
        <p className="fm-q">어떤 작업이 필요하세요?</p>
        <div className="fm-chips">
          {["식재", "잔디", "자갈", "디딤석", "화단", "기타"].map((c) => (
            <span key={c} className={c === "잔디" || c === "디딤석" ? "is-on" : ""}>{c}</span>
          ))}
        </div>
        <span className="fm-btn">다음</span>
      </>
    );
  if (i === 1)
    return (
      <div className="fm-card">
        <span className="fm-badge">접수됨</span>
        <strong className="fm-card__title">잔디 · 디딤석</strong>
        <span className="fm-muted">TD-2610-0001 · 경기 용인시</span>
        <p className="fm-hint">상세 주소를 미리 입력해 두시면 실측 일정을 더 빨리 잡을 수 있어요.</p>
      </div>
    );
  if (i === 2)
    return (
      <div className="fm-card">
        <span className="fm-kicker">지금 할 일</span>
        <strong className="fm-card__title">신청을 확인하고 있어요</strong>
        <span className="fm-muted">24시간 안에 담당자가 연락드려요.</span>
      </div>
    );
  if (i === 3)
    return (
      <div className="fm-card">
        <span className="fm-kicker">방문 일정</span>
        <div className="fm-date">
          <span>10월</span>
          <strong>20</strong>
          <span>월</span>
        </div>
        <strong className="fm-card__title">
          실측 방문 <em className="fm-pill">D-4</em>
        </strong>
        <span className="fm-muted">오후 2:00 · 담당자가 방문해 크기와 바닥 상태를 확인해요.</span>
      </div>
    );
  if (i === 4)
    return (
      <div className="fm-card">
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
      <div className="fm-card">
        <span className="fm-badge">진행 확정</span>
        <div className="fm-date">
          <span>10월</span>
          <strong>28</strong>
          <span>화</span>
        </div>
        <strong className="fm-card__title">
          시공 예정 <em className="fm-pill">D-12</em>
        </strong>
        <span className="fm-muted">작업일과 준비할 내용을 미리 알려드려요.</span>
      </div>
    );
  return (
    <div className="fm-card">
      <span className="fm-kicker">완료 보고</span>
      <img className="fm-photo" src="/service/garden-end-s.webp" alt="" loading="lazy" decoding="async" />
      <strong className="fm-card__title">테두리가 완료됐어요</strong>
      <span className="fm-stars" aria-label="별점 5점">★★★★★</span>
    </div>
  );
}
