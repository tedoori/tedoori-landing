"use client";

import { useEffect, useRef, useState } from "react";
import { useAutoPlay } from "../_components/home/useAutoPlay";
import { WORKS } from "./works";

// ---------- 식재부터 화단까지: 사진 패널이 하나씩 펼쳐짐 ----------

export function WorkPanels() {
  // 스크롤과 상관없이 마우스를 올린(또는 누른) 패널만 펼쳐짐
  const [on, setOn] = useState(0);

  return (
    <div className="wp-track">
      <div className="wp-stage container">
        <div className="wp-head">
          <h2 id="works-title" className="sv-title">
            식재부터 화단까지,
            <br />
            필요한 작업을 골라요.
          </h2>
          <p className="lead">먼저 종류를 고르고, 구체적인 자재는 상담에서 정해요.</p>
        </div>
        <ul className="wp-panels">
          {WORKS.map((w, i) => (
            <li key={w.name} className={`wp-panel${i === on ? " is-on" : ""}`}>
              <button type="button" onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onClick={() => setOn(i)} aria-expanded={i === on}>
                <img src={w.img} alt="" />
                <span className="wp-panel__name">{w.name}</span>
                <span className="wp-panel__desc">{w.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- 자재만 받을까요, 시공까지 맡길까요?: 범위마다 사진·색·견적서가 바뀜 ----------
const SCOPES = [
  { name: "자재만", desc: "직접 자재를 받고 가꾸려는 경우", img: "/service/scope-material.webp" },
  { name: "자재+배송", desc: "자재 준비와 현장까지의 배송을 요청하는 경우", img: "/service/scope-delivery.webp" },
  { name: "시공 포함", desc: "식재나 바닥 작업까지 업체에 맡기려는 경우", img: "/service/scope-build.webp" },
];
const CELLS = ["자재", "배송", "시공"];

export function ScopePicker() {
  const [i, setI] = useState(0);
  return (
    <div className="spk" data-scope={i}>
      <div className="spk-seg" role="radiogroup" aria-label="견적 범위">
        <span className="spk-seg__ink" style={{ transform: `translateX(${i * 100}%)` }} aria-hidden="true" />
        {SCOPES.map((s, k) => (
          <button key={s.name} type="button" role="radio" aria-checked={i === k} className={i === k ? "is-on" : ""} onClick={() => setI(k)}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="spk-view">
        <div className="spk-photo" aria-hidden="true">
          {SCOPES.map((s, k) => (
            <img key={s.img} src={s.img} alt="" className={k === i ? "is-on" : ""} loading="lazy" width={1200} height={900} />
          ))}
        </div>
        {/* 견적서 미리보기: 고른 범위만 포함으로 켜짐 */}
        <div className="spk-doc" aria-hidden="true">
          <span className="spk-doc__head">
            <i />
            <i />
          </span>
          {CELLS.map((c, k) => (
            <span key={c} className={`spk-row${k <= i ? " is-on" : ""}`} style={{ "--k": k } as React.CSSProperties}>
              <span className="spk-row__check" />
              <b>{c}</b>
              <em>{k <= i ? "포함" : "제외"}</em>
            </span>
          ))}
        </div>
      </div>

      <p key={i} className="spk-desc">
        {SCOPES[i].desc}
      </p>
    </div>
  );
}

// ---------- 사진은 1장 이상: 쌓인 카드가 펼쳐짐 ----------
const PREP = [
  { name: "사진", desc: "작업할 부분과 주변이 함께 보이는 사진", icon: "photo", img: "/service/prep-photo.webp" },
  { name: "크기·수량", desc: "예: 현관 옆 약 2㎡ · 나무 2주", icon: "ruler", img: "/service/prep-size.webp" },
  { name: "요청사항", desc: "예: 흙이 드러난 부분을 디딤석 길로 바꾸고 싶어요.", icon: "note", img: "/service/prep-note.webp" },
  { name: "희망 시기·예산", desc: "희망 시기는 입력 · 예산은 정해졌을 때만", icon: "cal", img: "/service/prep-plan.webp" },
];

function PrepIcon({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "photo")
    return (
      <svg viewBox="0 0 32 32" {...p}>
        <rect x="4" y="7" width="24" height="19" rx="3" />
        <path d="m4 22 7-6 6 5 4-3 7 5" />
        <circle cx="21" cy="13" r="2" />
      </svg>
    );
  if (name === "ruler")
    return (
      <svg viewBox="0 0 32 32" {...p}>
        <path d="M4 22 22 4l6 6-18 18z" />
        <path d="m9 17 2 2M13 13l3 3M17 9l2 2" />
      </svg>
    );
  if (name === "note")
    return (
      <svg viewBox="0 0 32 32" {...p}>
        <path d="M7 4h14l5 5v19H7z" />
        <path d="M11 14h11M11 19h11M11 24h7" />
      </svg>
    );
  return (
    <svg viewBox="0 0 32 32" {...p}>
      <rect x="5" y="7" width="22" height="20" rx="3" />
      <path d="M5 13h22M11 4v6M21 4v6" />
    </svg>
  );
}

export function PrepFan() {
  const grid = useRef<HTMLDivElement>(null);
  // 화면에 들어오면 쌓여 있던 카드가 저절로 펼쳐짐
  const track = useAutoPlay<HTMLDivElement>(1500, (p) => {
    const e = 1 - Math.pow(1 - p, 3);
    track.current?.style.setProperty("--p", (0.1 + e * 0.6).toFixed(4));
  });

  // 각 카드가 가운데 한 묶음으로 쌓여 있으려면 얼마나 옮겨야 하는지 계산
  useEffect(() => {
    const measure = () => {
      const g = grid.current;
      if (!g) return;
      const gr = g.getBoundingClientRect();
      const cx = gr.left + gr.width / 2;
      const cy = gr.top + gr.height / 2;
      g.querySelectorAll<HTMLElement>(".pf-card").forEach((c) => {
        c.style.transform = "none";
        const r = c.getBoundingClientRect();
        c.style.removeProperty("transform");
        c.style.setProperty("--dx", `${(cx - (r.left + r.width / 2)).toFixed(1)}px`);
        c.style.setProperty("--dy", `${(cy - (r.top + r.height / 2)).toFixed(1)}px`);
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="pf-track" ref={track}>
      <div className="pf-stage container">
        <div className="pf-head">
          <h2 id="prep-title" className="sv-title">
            사진은 1장 이상,
            <br />
            예산은 정해졌을 때만.
          </h2>
          <p className="lead">작업할 곳과 주변이 함께 보이면 좋아요. 크기나 수량은 대략적이어도 괜찮아요.</p>
        </div>
        <div className="pf-grid" ref={grid}>
          {PREP.map((c, i) => (
            <div key={c.name} className="pf-card" style={{ "--i": i, "--r": `${[-8, 5, -3, 9][i]}deg` } as React.CSSProperties}>
              {"img" in c && <img className="pf-card__img" src={c.img} alt="" loading="lazy" width={900} height={1200} />}
              <span className="pf-card__icon" aria-hidden="true">
                <PrepIcon name={c.icon} />
              </span>
              <p className="pf-card__name">{c.name}</p>
              <p className="pf-card__desc">{c.desc}</p>
            </div>
          ))}
        </div>
        <p className="note pf-note">사진 업로드 시, 사람 얼굴과 차량 번호처럼 필요 없는 정보는 가리고 올려주세요.</p>
      </div>
    </div>
  );
}

// ---------- 시설물은 '기타'로: 스티커가 붙음 ----------
export function EtcSticker() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`es${inView ? " is-in" : ""}`}>
      <div className="es-copy">
        <h2 id="etc-title" className="es-title">
          시설물은 <span className="es-mark">‘기타’</span>로.
          <br />
          가능한 범위부터 확인해요.
        </h2>
        <p className="lead es-lead">
          울타리나 데크처럼 기본 작업에 없는 요청도 적어주세요.<br />지원 범위가 제한적이어서 검토 후 가능 여부를 안내해요.
        </p>
      </div>
      {/* 울타리·데크 사진 두 장에 각각 기타 스티커가 찍힘 */}
      <div className="es-photos">
        {[
          ["/service/etc-fence2.webp", "울타리"],
          ["/service/etc-deck.webp", "데크"],
        ].map(([src, name], i) => (
          <figure key={src} className="es-photo" style={{ "--i": i } as React.CSSProperties}>
            <img src={src} alt="" loading="lazy" width={1000} height={750} />
            <figcaption>{name}</figcaption>
            <span className="es-sticker" aria-hidden="true">
              기타
            </span>
          </figure>
        ))}
      </div>
    </div>
  );
}
