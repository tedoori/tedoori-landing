"use client";

import { useEffect, useState } from "react";
import { useAutoPlay } from "./useAutoPlay";
import { StatusBadge } from "../ui";
import "./receipt-cost.css";

// 와이어프레임 문구 그대로 (항목 이름·설명) + 실제 견적서처럼 공종 줄 예시. 금액은 현장마다 달라 가림
const COSTS = [
  { key: "material", name: "자재비", desc: "자재 종류·수량에 따른 금액", lines: [["디딤돌", "자연석 · 1빠렛"], ["에메랄드그린", "H1.5 · 10주"]] },
  { key: "delivery", name: "배송비", desc: "업체가 산정한 배송 조건·금액", lines: [["운반비", "1톤 · 1식"]] },
  { key: "labor", name: "시공비", desc: "견적에 포함된 작업·금액", lines: [["식재·설치", "인력 · 1일"]] },
] as const;

// 맡길 범위: 고른 범위에 들어가는 항목
const SCOPES = [
  { label: "자재만", keys: ["material"] },
  { label: "자재+배송", keys: ["material", "delivery"] },
  { label: "시공 포함", keys: ["material", "delivery", "labor"] },
] as const;

// 견적서에서 짚어주는 말 (번호는 견적서 위 표시와 같음)
const NOTES = [
  "작업 항목마다 규격·수량·단가를 적고, 자재비·배송비·시공비로 묶어 보여드려요.",
  "맡길 범위를 바꾸면 빠지는 묶음이 '제외'로 표시돼요.",
  "계 아래에 공과잡비와 부가세를 나눠 적어요.",
  "견적서는 14일 동안 유효하고, 이미지로 저장할 수도 있어요.",
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const AUTO_MS = 2600;

/**
 * 07 · 비용은 항목별로 (영수증 출력)
 * 영수증이 찍혀 나온 뒤, 맡길 범위가 자동으로 바뀌며 빠지는 항목과 합계가 달라지는 걸 보여줌
 * 직접 눌러도 바뀌고, 자동 넘김은 계속됨. 왼쪽 말풍선이 견적서의 번호와 짝지어 차례로 켜짐
 */
export function ReceiptCost() {
  const [scope, setScope] = useState(2);
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState(0);

  // 화면에 들어오면 영수증이 출력되고 도장이 찍힘 → 끝나면 범위 자동 넘김 시작
  const track = useAutoPlay<HTMLDivElement>(2400, (p) => {
    const el = track.current;
    if (!el) return;
    const set = (k: string, v: number) => el.style.setProperty(k, v.toFixed(4));
    set("--feed", seg(p, 0.02, 0.72));
    set("--l0", seg(p, 0.08, 0.16));
    COSTS.forEach((_, i) => set(`--r${i}`, seg(p, 0.2 + i * 0.12, 0.3 + i * 0.12)));
    set("--l8", seg(p, 0.56, 0.64));
    set("--l9", seg(p, 0.62, 0.7));
    set("--stamp", seg(p, 0.78, 0.84));
    setNotes(p >= 1 ? NOTES.length : Math.floor(seg(p, 0.3, 0.95) * NOTES.length));
    if (p >= 1) setReady(true);
  });

  useEffect(() => {
    if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setScope((s) => (s + 1) % SCOPES.length), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [ready, scope]);

  const keys: readonly string[] = SCOPES[scope].keys;

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
            방문 실측한 내용을 토대로 테두리가 빠르게 확인·정리해{" "}
            <br className="rc-br" />
            자재비·배송비·시공비로 나눈 견적서를 보내드려요.
          </p>
          <ol className="rc-notes rc-notes--side" aria-label="견적서 읽는 법">
            {NOTES.map((t, i) => (
              <li key={t} className={i < notes ? "is-on" : ""}>
                <span className="rc-pin">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rc-right">
          <div className="rc-scope" role="group" aria-label="맡길 범위 예시">
            {SCOPES.map((s, i) => (
              <button key={s.label} type="button" aria-pressed={scope === i} onClick={() => setScope(i)}>
                {s.label}
              </button>
            ))}
            <span className="rc-scope__thumb" style={{ "--s": scope } as React.CSSProperties} aria-hidden="true" />
          </div>

          <div className="rc-printer">
            <div className="rc-slot" aria-hidden="true">
              <span />
            </div>
            <div className="rc-paper-clip">
              <div className="rc-paper">
                <p className="rc-line rc-paper__head" style={{ "--k": "var(--l0)" } as React.CSSProperties}>
                  <span>
                    견적서 · 예시 <i className="rc-pin rc-pin--on">1</i>
                  </span>
                  <small>공종 · 규격 · 수량 · 단가로 적어요</small>
                  <span className="rc-dots" aria-hidden="true">
                    — — — — — — — —
                  </span>
                </p>
                <dl>
                  {COSTS.map((c, i) => {
                    const out = !keys.includes(c.key);
                    return (
                      <div key={c.key} className={`rc-line rc-row${out ? " is-out" : ""}`} style={{ "--k": `var(--r${i})` } as React.CSSProperties}>
                        <dt>{c.name}</dt>
                        <dd>
                          <span className="rc-row__desc">{c.desc}</span>
                          <span className="rc-row__won">
                            {i === 1 && <i className="rc-pin rc-pin--on">2</i>}
                            {out && <em>제외</em>}
                            <b className="rc-mask" aria-label="금액은 실측 후 정해져요">000,000원</b>
                          </span>
                          <span className="rc-lines">
                            {c.lines.map(([w, m]) => (
                              <span key={w}>
                                <span>{w}</span>
                                <span>{m}</span>
                              </span>
                            ))}
                          </span>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                <div className="rc-line rc-total" style={{ "--k": "var(--l8)" } as React.CSSProperties}>
                  <span className="rc-total__rows">
                    <span>
                      계 <b className="rc-mask">0,000,000원</b>
                    </span>
                    <span>
                      공과잡비 <b className="rc-mask">000,000원</b>
                    </span>
                    <span>
                      부가세 10% <b className="rc-mask">000,000원</b>
                    </span>
                  </span>
                  <span className="rc-total__grand">
                    <span>
                      합계 <i className="rc-pin rc-pin--on">3</i>
                    </span>
                    <strong>실측 후 산정</strong>
                  </span>
                </div>
                <p className="rc-line rc-paper__foot" style={{ "--k": "var(--l9)" } as React.CSSProperties}>
                  실측 내용을 바탕으로 금액과 일정을 정리해요.
                  <br />
                  <span className="rc-valid">
                    <i className="rc-pin rc-pin--on">4</i> 유효기간 14일 · 이미지로 저장 가능
                  </span>
                </p>
                <span className="rc-barcode" aria-hidden="true" />
                <span className="rc-stamp" aria-hidden="true">
                  <StatusBadge status="quoted" />
                </span>
              </div>
            </div>
          </div>

          <ol className="rc-notes rc-notes--below" aria-hidden="true">
            {NOTES.map((t, i) => (
              <li key={t} className={i < notes ? "is-on" : ""}>
                <span className="rc-pin">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <p className="rc-sample">항목은 예시예요. 금액은 현장마다 달라 실측 후 견적서로 안내해요.</p>
        </div>
      </div>
    </div>
  );
}
