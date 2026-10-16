"use client";

import { useRef, useState } from "react";

export type Kind = "material" | "delivery" | "labor";
export const KIND_LABEL: Record<Kind, string> = { material: "자재", delivery: "배송", labor: "시공" };

export type EstimateItem = {
  id: string;
  sort: number;
  work: string; // 공종명
  material: string | null;
  spec?: string | null; // 규격
  quantity: string | null; // (예전) 수량 글자
  unit?: string | null; // 단위
  qty?: number | null; // 수량
  unit_price?: number | null; // 단가
  kind?: Kind | null; // 구분: 자재 · 배송 · 시공
  material_cost: number; // (예전) 자재비·배송비·시공비
  delivery_cost: number;
  labor_cost: number;
  note: string | null;
};

export type Estimate = {
  id: string;
  issued_at: string;
  valid_until: string | null;
  vat_included: boolean;
  measure_note: string | null;
  schedule_note: string | null;
  exclusions: string | null;
  site_issues?: string | null;
  overhead_rate?: number | null; // 공과잡비 %
  equipment_cost?: number; // (예전) 추가 비용
  waste_cost?: number;
  extra_labor_cost?: number;
  extra_note?: string | null;
  meals_included?: boolean;
  items: EstimateItem[];
  photos: { path: string; url: string | null }[];
};

const num = (n: number) => n.toLocaleString("ko-KR");
const qtyText = (n: number) => n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const day = (v: string) => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(v));
const plus14 = (v: string) => {
  const d = new Date(v);
  d.setDate(d.getDate() + 14);
  return d.toISOString();
};

/** 줄 금액: 단가가 있으면 수량 × 단가, 예전 견적서는 자재비+배송비+시공비 */
export const itemAmount = (i: EstimateItem) =>
  (i.unit_price ?? 0) > 0 ? Math.round(Number(i.qty ?? 1) * (i.unit_price ?? 0)) : i.material_cost + i.delivery_cost + i.labor_cost;

/** 자재비·배송비·시공비 묶음 (공과잡비·부가세 전). 예전 견적서는 줄 안의 세 칸, 예전 추가 비용은 시공에 넣음 */
export function estimateParts(e: Pick<Estimate, "items" | "equipment_cost" | "waste_cost" | "extra_labor_cost">) {
  const p = { material: 0, delivery: 0, labor: 0 };
  for (const i of e.items) {
    if ((i.unit_price ?? 0) > 0) p[i.kind ?? "material"] += itemAmount(i);
    else {
      p.material += i.material_cost;
      p.delivery += i.delivery_cost;
      p.labor += i.labor_cost;
    }
  }
  p.labor += (e.equipment_cost ?? 0) + (e.waste_cost ?? 0) + (e.extra_labor_cost ?? 0);
  return p;
}

/** 계 → 공과잡비 → 공급가액 → 부가세 → 합계. 부가세 포함으로 적은 견적은 거꾸로 나눔 */
export function estimateTotals(e: Pick<Estimate, "items" | "overhead_rate" | "vat_included" | "equipment_cost" | "waste_cost" | "extra_labor_cost">) {
  const legacyExtra = (e.equipment_cost ?? 0) + (e.waste_cost ?? 0) + (e.extra_labor_cost ?? 0);
  const subtotal = e.items.reduce((a, i) => a + itemAmount(i), 0) + legacyExtra;
  const rate = Number(e.overhead_rate ?? 0);
  const overhead = Math.round((subtotal * rate) / 100);
  const total = subtotal + overhead;
  const supply = e.vat_included ? Math.round(total / 1.1) : total;
  const vat = e.vat_included ? total - supply : Math.round(total * 0.1);
  return { subtotal, rate, overhead, legacyExtra, supply, vat, grand: supply + vat };
}

/** 실측 후 받은 견적서. 조경업체 방식: 공종명 · 규격 · 단위 · 수량 · 단가 · 금액 → 계 · 공과잡비 · 공급가액 · 부가세 · 합계 */
export function EstimateCard({ estimate: e, receiptNo, customer }: { estimate: Estimate; receiptNo: string | null; customer: string | null }) {
  const t = estimateTotals(e);
  const parts = estimateParts(e);
  const paper = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  // 견적서를 그림(PNG)으로 내려받기 — 휴대폰·PC 같은 모양으로 보관
  const download = async () => {
    if (!paper.current || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      // 휴대폰에서도 업체 견적서와 같은 표 모양으로 찍음 (잠시 넓게 펼쳤다가 되돌림)
      paper.current.classList.add("is-capture");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const url = await toPng(paper.current, {
        width: 760, pixelRatio: 2, backgroundColor: "#ffffff", filter: (n) => !(n instanceof HTMLElement && n.dataset.noCapture === "1") });
      const a = document.createElement("a");
      a.href = url;
      a.download = `테두리-견적서-${receiptNo ?? "예시"}.png`;
      a.click();
    } catch {
      window.alert("이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      paper.current?.classList.remove("is-capture");
      setSaving(false);
    }
  };
  const until = e.valid_until ?? plus14(e.issued_at);
  const expired = new Date(until).getTime() + 86400000 < Date.now();

  return (
    <section className="est" aria-labelledby="est-title">
      <div className="est-paper" ref={paper}>
        <header className="est-top">
          <div>
            <p className="est-brand">테두리 · 부분조경</p>
            <h2 id="est-title" className="est-title">
              견적서
            </h2>
          </div>
          <dl className="est-info">
            <div>
              <dt>견적번호</dt>
              <dd>{receiptNo ?? "—"}</dd>
            </div>
            <div>
              <dt>발행일</dt>
              <dd>{day(e.issued_at)}</dd>
            </div>
            <div>
              <dt>유효기간</dt>
              <dd className={expired ? "is-expired" : ""}>{expired ? "지남" : `${day(until)}까지`}</dd>
            </div>
          </dl>
        </header>

        <div className="est-to">
          <p>
            <strong>{customer || "고객"}</strong> 님 귀하
          </p>
          <p className="est-to__sub">실측한 내용을 바탕으로 아래와 같이 견적합니다.</p>
        </div>

        <div className="est-grand">
          <span>견적 금액 · 부가세 포함</span>
          <strong>
            {num(t.grand)}
            <small>원</small>
          </strong>
        </div>

        {/* 업체 견적서와 같은 표: 공종명 · 규격 · 단위 · [견적내역 수량 · 단가 · 금액] · 비고 → 계 · 공과잡비 · 합계 */}
        <div className="est-sheet">
          <table className="est-xl">
            <colgroup>
              <col className="c-name" />
              <col className="c-spec" />
              <col className="c-unit" />
              <col className="c-qty" />
              <col className="c-price" />
              <col className="c-amt" />
              <col className="c-note" />
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>공종명</th>
                <th rowSpan={2}>규격</th>
                <th rowSpan={2}>단위</th>
                <th colSpan={3}>견적 내역</th>
                <th rowSpan={2}>비고</th>
              </tr>
              <tr>
                <th>수량</th>
                <th>단가</th>
                <th>금액</th>
              </tr>
            </thead>
            <tbody>
              {e.items.map((i) => {
                const priced = (i.unit_price ?? 0) > 0;
                return (
                  <tr key={i.id}>
                    <td className="t-name">
                      {i.work}
                      {i.material ? ` ${i.material}` : ""}
                      {/* 휴대폰: 규격 · 수량단위 × 단가 한 줄 */}
                      <span className="est-td__meta">
                        {[i.spec, priced ? `${qtyText(Number(i.qty ?? 1))}${i.unit ?? ""} × ${num(i.unit_price ?? 0)}원` : i.quantity].filter(Boolean).join(" · ")}
                      </span>
                      {i.note && <span className="est-td__note">비고 · {i.note}</span>}
                    </td>
                    <td className="t-spec">{i.spec || ""}</td>
                    <td className="t-unit">{priced ? i.unit || "" : "식"}</td>
                    <td className="t-num">{priced ? qtyText(Number(i.qty ?? 1)) : i.quantity || "1"}</td>
                    <td className="t-num">{priced ? num(i.unit_price ?? 0) : num(itemAmount(i))}</td>
                    <td className="t-num t-amt">{num(itemAmount(i))}</td>
                    <td className="t-note">{i.note || ""}</td>
                  </tr>
                );
              })}
              {t.legacyExtra > 0 && (
                <tr>
                  <td className="t-name">추가 비용</td>
                  <td className="t-spec" />
                  <td className="t-unit">식</td>
                  <td className="t-num">1</td>
                  <td className="t-num">{num(t.legacyExtra)}</td>
                  <td className="t-num t-amt">{num(t.legacyExtra)}</td>
                  <td className="t-note">{e.extra_note || ""}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="t-sub">
                <td className="t-name">계</td>
                <td className="t-spec" />
                <td className="t-unit" />
                <td className="t-num" />
                <td className="t-num" />
                <td className="t-num t-amt">{num(t.subtotal)}</td>
                <td className="t-note" />
              </tr>
              {t.overhead > 0 && (
                <tr className="t-sub">
                  <td className="t-name">공과잡비</td>
                  <td className="t-spec t-center">{t.rate}%</td>
                  <td className="t-unit" />
                  <td className="t-num" />
                  <td className="t-num" />
                  <td className="t-num t-amt">{num(t.overhead)}</td>
                  <td className="t-note" />
                </tr>
              )}
              <tr className="t-total">
                <td className="t-name">합계</td>
                <td className="t-spec" />
                <td className="t-unit" />
                <td className="t-num">{qtyText(e.items.reduce((a, i) => a + ((i.unit_price ?? 0) > 0 ? Number(i.qty ?? 1) : 1), 0))}</td>
                <td className="t-num" />
                <td className="t-num t-amt">{num(t.subtotal + t.overhead)}</td>
                <td className="t-note">{e.vat_included ? "부가세 포함" : "부가세 별도"}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 자재비 · 배송비 · 시공비 나눠 보기 (공과잡비·부가세 전) */}
        <div className="est-parts" aria-label="비용 구분">
          {(["material", "delivery", "labor"] as Kind[]).map((k) => (
            <div key={k} className={`est-part est-part--${k}${parts[k] ? "" : " is-zero"}`}>
              <span>{KIND_LABEL[k]}비</span>
              <strong>{parts[k] ? `${num(parts[k])}원` : "없음"}</strong>
            </div>
          ))}
          <p>공과잡비·부가세 전 금액이에요.</p>
        </div>

        <dl className="est-totals">
          <div>
            <dt>공급가액</dt>
            <dd>{num(t.supply)}원</dd>
          </div>
          <div>
            <dt>부가세 (10%)</dt>
            <dd>{num(t.vat)}원</dd>
          </div>
          <div className="est-totals__grand">
            <dt>합계</dt>
            <dd>{num(t.grand)}원</dd>
          </div>
        </dl>

        {e.site_issues && (
          <div className="est-issue" role="note">
            <strong>현장 특이사항</strong>
            <p>{e.site_issues}</p>
          </div>
        )}

        <dl className="est-terms">
          <div>
            <dt>식비 등 현장 경비</dt>
            <dd>{e.meals_included === false ? "별도 청구" : "견적 금액에 포함"}</dd>
          </div>
          {e.schedule_note && (
            <div>
              <dt>예상 일정</dt>
              <dd>{e.schedule_note}</dd>
            </div>
          )}
          {e.exclusions && (
            <div>
              <dt>포함되지 않음</dt>
              <dd>{e.exclusions}</dd>
            </div>
          )}
          {e.measure_note && (
            <div>
              <dt>기타 사항</dt>
              <dd>{e.measure_note}</dd>
            </div>
          )}
        </dl>

        {e.photos.some((p) => p.url) && (
          <div className="est-photos">
            <p className="est-label">실측 사진</p>
            <ul>
              {e.photos.map((p, n) =>
                p.url ? (
                  <li key={p.path}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      <img src={p.url} alt={`실측 사진 ${n + 1}`} loading="lazy" />
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

        <footer className="est-sign">
          <p>
            위 금액은 실측 결과 기준이며, 현장 조건이 바뀌면 협의 후 조정될 수 있습니다.
            <br />
            시공 계약은 고객과 조경업체가 직접 맺습니다.
          </p>
          <button type="button" className="est-save" data-no-capture="1" onClick={() => void download()} disabled={saving}>
            {saving ? "이미지 만드는 중…" : "견적서 이미지로 저장"}
          </button>
          <div className="est-issuer">
            <img src="/figma/logo-mark.svg" width={56} height={19} alt="" />
            <span>
              <strong>테두리</strong>
              contact@tedoori.com
            </span>
          </div>
        </footer>
      </div>

    </section>
  );
}

/** 대시보드 요약용: 부가세 포함 합계 */
export function estimateGrand(e: Estimate) {
  return estimateTotals(e).grand;
}

/** 견적서 아래 도움말 띠: 카카오 채널 · 문의하기 */
/** onAsk: 내 신청 안에서는 대시보드 문의하기 탭으로 이동 */
export function HelpStrip({ onAsk }: { onAsk?: () => void } = {}) {
  return (
    <aside className="help" aria-label="문의 바로가기">
      <span className="help-text">
        <strong>견적 내용이 궁금하신가요?</strong>
        <small>담당자가 바로 답해드려요</small>
      </span>
      <span className="help-links">
        <a href="http://pf.kakao.com/_HeKBX" target="_blank" rel="noopener noreferrer" className="help-link help-link--kakao">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 4C6.9 4 3 7.2 3 11.1c0 2.5 1.6 4.6 4.1 5.9l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .9.1 1.3.1 5.1 0 9-3.2 9-7.1S17.1 4 12 4Z" />
          </svg>
          카카오톡 문의
        </a>
        <a
          href="/contact"
          className="help-link"
          onClick={(e) => {
            if (!onAsk) return;
            e.preventDefault();
            onAsk();
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 5h16v11H8l-4 3z" />
          </svg>
          문의하기
        </a>
      </span>
    </aside>
  );
}
