"use client";

import { useAutoPlay } from "./useAutoPlay";
import { StatusBadge } from "../ui";
import "./receipt-cost.css";

// 와이어프레임 문구 그대로
const COSTS = [
  { name: "자재비", desc: "자재 종류·수량에 따른 금액" },
  { name: "배송비", desc: "업체가 산정한 배송 조건·금액" },
  { name: "시공비", desc: "견적에 포함된 작업·금액" },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/**
 * 07 · 비용은 항목별로 (영수증 출력)
 * 프린터 출력구에서 종이가 내려오며 항목이 한 줄씩 찍히고, 마지막에 '견적 도착' 도장
 */
export function ReceiptCost() {
  // 화면에 들어오면 자동으로 영수증이 출력되고 도장이 찍힘
  const track = useAutoPlay<HTMLDivElement>(2400, (p) => {
    const el = track.current;
    if (!el) return;
    const set = (k: string, v: number) => el.style.setProperty(k, v.toFixed(4));
    set("--feed", seg(p, 0.02, 0.72));
    set("--l0", seg(p, 0.08, 0.16));
    COSTS.forEach((_, i) => set(`--r${i}`, seg(p, 0.2 + i * 0.14, 0.3 + i * 0.14)));
    set("--l9", seg(p, 0.62, 0.7));
    set("--stamp", seg(p, 0.78, 0.84));
  });

  return (
    <div className="rc-track" ref={track}>
      <div className="rc-stage container">
        <div className="rc-head">
          <h2 id="cost-title" className="rc-title">
            비용은
            <br />
            항목별로 확인해요.
          </h2>
          <p className="lead">
            방문 실측한 내용을 토대로 테두리가 빠르게 확인·정리해
            <br className="rc-br" />
            자재비·배송비·시공비로 나눈 견적서를 보내드려요.
          </p>
        </div>

        <div className="rc-printer">
          <div className="rc-slot" aria-hidden="true">
            <span />
          </div>
          <div className="rc-paper-clip">
            <div className="rc-paper">
              <p className="rc-line rc-paper__head" style={{ "--k": "var(--l0)" } as React.CSSProperties}>
                <span>견적 구성 예시</span>
                <span className="rc-dots" aria-hidden="true">
                  — — — — — — — —
                </span>
              </p>
              <dl>
                {COSTS.map((c, i) => (
                  <div key={c.name} className="rc-line rc-row" style={{ "--k": `var(--r${i})` } as React.CSSProperties}>
                    <dt>{c.name}</dt>
                    <dd>{c.desc}</dd>
                  </div>
                ))}
              </dl>
              <p className="rc-line rc-paper__foot" style={{ "--k": "var(--l9)" } as React.CSSProperties}>
                실측 내용을 바탕으로 금액과 일정을 정리해요.
              </p>
              <span className="rc-barcode" aria-hidden="true" />
              <span className="rc-stamp" aria-hidden="true">
                <StatusBadge status="quoted" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
