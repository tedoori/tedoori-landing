export type EstimateItem = {
  id: string;
  sort: number;
  work: string;
  material: string | null;
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
  items: EstimateItem[];
  photos: { path: string; url: string | null }[];
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const day = (v: string) => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(v));
const plus14 = (v: string) => {
  const d = new Date(v);
  d.setDate(d.getDate() + 14);
  return d.toISOString();
};

/** 실측 후 받은 항목별 견적서 (자재비 · 배송비 · 시공비) */
export function EstimateCard({ estimate: e }: { estimate: Estimate }) {
  const sum = (k: "material_cost" | "delivery_cost" | "labor_cost") => e.items.reduce((a, i) => a + i[k], 0);
  const parts = [
    ["자재비", sum("material_cost")],
    ["배송비", sum("delivery_cost")],
    ["시공비", sum("labor_cost")],
  ] as const;
  const total = parts.reduce((a, [, v]) => a + v, 0);
  const until = e.valid_until ?? plus14(e.issued_at);
  const expired = new Date(until).getTime() + 86400000 < Date.now();

  return (
    <section className="my-card est" aria-labelledby="est-title">
      <header className="est-head">
        <div>
          <p className="my-eyebrow">실측 후 견적서</p>
          <h2 id="est-title" className="est-total">
            {won(total)}
          </h2>
          <p className="est-meta">
            {e.vat_included ? "부가세 포함" : "부가세 별도"} · {day(e.issued_at)} 발행
          </p>
        </div>
        <p className={`est-valid${expired ? " is-expired" : ""}`}>
          {expired ? "유효기간 지남" : `${day(until)}까지 유효`}
        </p>
      </header>

      <ul className="est-sum" aria-label="비용 나눠 보기">
        {parts.map(([k, v]) => (
          <li key={k}>
            <span>{k}</span>
            <strong>{won(v)}</strong>
            <i style={{ width: total ? `${(v / total) * 100}%` : 0 }} aria-hidden="true" />
          </li>
        ))}
      </ul>

      <div className="est-items">
        <h3 className="est-sub">항목별 금액</h3>
        <ol>
          {e.items.map((i) => {
            const line = i.material_cost + i.delivery_cost + i.labor_cost;
            return (
              <li key={i.id} className="est-item">
                <div className="est-item__head">
                  <strong>{i.work}</strong>
                  {(i.material || i.quantity) && <span>{[i.material, i.quantity].filter(Boolean).join(" · ")}</span>}
                  <b>{won(line)}</b>
                </div>
                <dl className="est-item__costs">
                  <div>
                    <dt>자재</dt>
                    <dd>{won(i.material_cost)}</dd>
                  </div>
                  <div>
                    <dt>배송</dt>
                    <dd>{won(i.delivery_cost)}</dd>
                  </div>
                  <div>
                    <dt>시공</dt>
                    <dd>{won(i.labor_cost)}</dd>
                  </div>
                </dl>
                {i.note && <p className="est-item__note">{i.note}</p>}
              </li>
            );
          })}
        </ol>
      </div>

      {(e.measure_note || e.schedule_note || e.exclusions) && (
        <dl className="my-dl">
          {e.measure_note && (
            <div>
              <dt>실측 메모</dt>
              <dd className="my-dl__pre">{e.measure_note}</dd>
            </div>
          )}
          {e.schedule_note && (
            <div>
              <dt>예상 일정</dt>
              <dd className="my-dl__pre">{e.schedule_note}</dd>
            </div>
          )}
          {e.exclusions && (
            <div>
              <dt>포함되지 않아요</dt>
              <dd className="my-dl__pre">{e.exclusions}</dd>
            </div>
          )}
        </dl>
      )}

      {e.photos.length > 0 && (
        <div>
          <h3 className="est-sub">실측 사진</h3>
          <ul className="my-photos">
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

      <p className="est-next">견적을 보고 진행 여부를 문의하기나 카카오톡 채널 @테두리로 알려주세요.</p>
    </section>
  );
}
