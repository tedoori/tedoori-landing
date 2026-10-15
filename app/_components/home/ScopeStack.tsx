"use client";

import { useEffect, useRef, useState } from "react";
import "./scope-stack.css";

// 와이어프레임 문구 그대로
const SCOPES = [
  { name: "자재만", items: ["필요한 자재의 종류·수량 확인", "배송·시공 제외"], icon: "box", img: "/service/scope-material.webp" },
  { name: "자재+배송", items: ["자재와 현장까지의 배송 확인", "시공 제외"], icon: "truck", img: "/service/scope-delivery.webp" },
  { name: "시공 포함", items: ["자재·배송·작업 범위를 함께 확인", "최종 포함 범위는 견적서에서 확인"], icon: "shovel", img: "/service/scope-build.webp" },
] as const;

function Icon({ name }: { name: (typeof SCOPES)[number]["icon"] }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "box")
    return (
      <svg viewBox="0 0 64 64" {...p}>
        <path d="M8 20 32 8l24 12v26L32 58 8 46Z" />
        <path d="M8 20l24 12 24-12M32 32v26" />
        <path d="M20 14l24 12v8" />
      </svg>
    );
  if (name === "truck")
    return (
      <svg viewBox="0 0 64 64" {...p}>
        <path d="M4 16h34v28H4zM38 26h12l10 10v8H38z" />
        <circle cx="16" cy="48" r="6" />
        <circle cx="48" cy="48" r="6" />
        <path d="M10 24h16M10 31h10" />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" {...p}>
      <path d="M40 6l18 18-6 6-18-18z" />
      <path d="M37 21 14 44" />
      <path d="M6 50c4-8 10-10 14-6s2 10-6 14z" />
      <path d="M44 44c6 0 12 3 14 10H30c2-7 8-10 14-10z" />
    </svg>
  );
}

/**
 * 05 · 맡길 범위
 * 같은 크기의 카드 3장이 같은 간격으로 나란히, 화면에 들어오면 차례로 올라옴
 */
export function ScopeStack() {
  // 화면에 들어오면 카드가 왼쪽부터 차례로 올라옴 (스크롤로 조작하지 않음)
  const list = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.25 });
    if (list.current) io.observe(list.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="sc">
      <div className="sc-head">
        <h2 id="scope-title" className="sc-title">
          자재만 필요할 때도,
          <br />
          시공까지 맡기고 싶을 때도.
        </h2>
        <p className="lead">직접 할 부분은 남기고, 필요한 만큼 맡겨요.</p>
      </div>

      <div className={`sc-stack${inView ? " is-in" : ""}`} ref={list}>
        {SCOPES.map((s, i) => (
          <article key={s.name} className={`sc-card sc-card--${i}`} style={{ "--i": i } as React.CSSProperties}>
            <div className="sc-card__body">
              <h3>{s.name}</h3>
              <ul>
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
            {/* 맨 위 사진, 아이콘은 사진 모서리 배지로 */}
            <span className="sc-card__photo" aria-hidden="true">
              <img src={s.img} alt="" loading="lazy" width={1200} height={900} />
              <span className="sc-card__icon">
                <Icon name={s.icon} />
              </span>
            </span>
          </article>
        ))}
      </div>

      <p className="note sc-note">
        울타리·데크 등 시설물은 ‘기타’로 접수합니다.
        <br />
        지원 범위가 제한적이어서 검토 후 가능 여부를 안내해요.
      </p>
    </div>
  );
}
