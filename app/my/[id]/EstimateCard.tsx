export type EstimateItem = {
  id: string;
  sort: number;
  work: string;
  material: string | null;
  spec?: string | null;
  quantity: string | null;
  material_cost: number;
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
  equipment_cost?: number;
  waste_cost?: number;
  extra_labor_cost?: number;
  extra_note?: string | null;
  meals_included?: boolean;
  items: EstimateItem[];
  photos: { path: string; url: string | null }[];
};

const num = (n: number) => n.toLocaleString("ko-KR");
const day = (v: string) => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(v));
const plus14 = (v: string) => {
  const d = new Date(v);
  d.setDate(d.getDate() + 14);
  return d.toISOString();
};

/** 실측 후 받은 항목별 견적서. 종이 견적서처럼: 머리말 → 항목 표 → 합계 → 조건 */
export function EstimateCard({ estimate: e, receiptNo, customer }: { estimate: Estimate; receiptNo: string | null; customer: string | null }) {
  const sum = (k: "material_cost" | "delivery_cost" | "labor_cost") => e.items.reduce((a, i) => a + i[k], 0);
  const extras = (
    [
      ["장비비", e.equipment_cost ?? 0],
      ["폐기물 처리비", e.waste_cost ?? 0],
      ["추가 인건비", e.extra_labor_cost ?? 0],
    ] as [string, number][]
  ).filter(([, v]) => v > 0);
  const total = sum("material_cost") + sum("delivery_cost") + sum("labor_cost") + extras.reduce((a, [, v]) => a + v, 0);
  // 부가세 포함이면 공급가액·부가세로 나눠 보여주고, 별도면 10%를 더해 합계를 냄
  const supply = e.vat_included ? Math.round(total / 1.1) : total;
  const vat = e.vat_included ? total - supply : Math.round(total * 0.1);
  const grand = supply + vat;
  const until = e.valid_until ?? plus14(e.issued_at);
  const expired = new Date(until).getTime() + 86400000 < Date.now();

  return (
    <section className="est" aria-labelledby="est-title">
      <div className="est-paper">
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
          <span>합계 금액 · 부가세 포함</span>
          <strong>
            {num(grand)}
            <small>원</small>
          </strong>
        </div>

        {/* 항목: 웹·모바일 같은 모양. 비어 있는 값은 숨김 */}
        <div className="est-list">
          <p className="est-list__head">
            <span>작업 항목</span>
            <span>금액</span>
          </p>
          {e.items.map((i) => {
            const facts = [
              i.material && ["자재", i.material],
              i.spec && ["규격", i.spec],
              i.quantity && ["수량", i.quantity],
            ].filter(Boolean) as [string, string][];
            const costs = (
              [
                ["자재비", i.material_cost],
                ["배송비", i.delivery_cost],
                ["시공비", i.labor_cost],
              ] as [string, number][]
            ).filter(([, v]) => v > 0);
            return (
              <article key={i.id} className="est-li">
                <header className="est-li__top">
                  <strong>{i.work}</strong>
                  <b>{num(i.material_cost + i.delivery_cost + i.labor_cost)}원</b>
                </header>
                {facts.length > 0 && (
                  <ul className="est-li__facts">
                    {facts.map(([k, v]) => (
                      <li key={k}>
                        <span>{k}</span>
                        {v}
                      </li>
                    ))}
                  </ul>
                )}
                {costs.length > 0 && (
                  <dl className="est-li__costs">
                    {costs.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{num(v)}원</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {i.note && <p className="est-li__note">{i.note}</p>}
              </article>
            );
          })}
          {extras.length > 0 && (
            <article className="est-li est-li--extra">
              <header className="est-li__top">
                <strong>추가 비용</strong>
                <b>{num(extras.reduce((a, [, v]) => a + v, 0))}원</b>
              </header>
              <dl className="est-li__costs">
                {extras.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{num(v)}원</dd>
                  </div>
                ))}
              </dl>
              {e.extra_note && <p className="est-li__note">{e.extra_note}</p>}
            </article>
          )}
        </div>


        <dl className="est-totals">
          <div>
            <dt>공급가액</dt>
            <dd>{num(supply)}원</dd>
          </div>
          <div>
            <dt>부가세 (10%)</dt>
            <dd>{num(vat)}원</dd>
          </div>
          <div className="est-totals__grand">
            <dt>합계</dt>
            <dd>{num(grand)}원</dd>
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
            <dd>{e.meals_included === false ? "별도 청구" : "시공비에 포함"}</dd>
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
          <div className="est-issuer">
            <img src="/figma/logo-mark.svg" width={56} height={19} alt="" />
            <span>
              <strong>테두리</strong>
              contact@tedoori.com
            </span>
          </div>
        </footer>
      </div>

      <p className="est-next">궁금한 점은 카카오톡 채널 @테두리나 문의하기로 물어보세요.</p>
    </section>
  );
}

/** 대시보드 요약용: 부가세 포함 합계 */
export function estimateGrand(e: Estimate) {
  const t =
    e.items.reduce((a, i) => a + i.material_cost + i.delivery_cost + i.labor_cost, 0) +
    (e.equipment_cost ?? 0) +
    (e.waste_cost ?? 0) +
    (e.extra_labor_cost ?? 0);
  return e.vat_included ? t : t + Math.round(t * 0.1);
}

/** 진행 범위 고르기용: 자재·배송·시공 묶음별 금액 (추가 비용은 시공에 포함) */
export function estimateParts(e: Estimate) {
  const sum = (k: "material_cost" | "delivery_cost" | "labor_cost") => e.items.reduce((a, i) => a + i[k], 0);
  const extra = (e.equipment_cost ?? 0) + (e.waste_cost ?? 0) + (e.extra_labor_cost ?? 0);
  const withVat = (n: number) => (e.vat_included ? n : n + Math.round(n * 0.1));
  return {
    material: withVat(sum("material_cost")),
    delivery: withVat(sum("delivery_cost")),
    labor: withVat(sum("labor_cost") + extra),
  };
}
