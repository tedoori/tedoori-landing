"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminSupabase } from "../../lib/supabase";
import { EstimateCard, KIND_LABEL, estimateParts, estimateTotals, type Kind } from "../my/[id]/EstimateCard";

// 견적서 작성: 조경업체 방식 — 공종명 · 규격 · 단위 · 수량 · 단가 → 금액(자동), 아래 계 · 공과잡비 % · 부가세
// 예전 방식(자재비·배송비·시공비)으로 쓴 견적서는 열면 '1식 × 합계 단가' 줄로 바뀌어요

type Item = { kind: Kind; work: string; spec: string; unit: string; qty: string; unit_price: number; note: string };
type Est = {
  id?: string;
  published: boolean;
  vat_included: boolean;
  overhead_rate: string;
  valid_until: string;
  site_issues: string;
  measure_note: string;
  schedule_note: string;
  exclusions: string;
  meals_included: boolean;
  // 예전 추가 비용 (새 견적서에서는 공종 줄로 적어요)
  equipment_cost: number;
  waste_cost: number;
  extra_labor_cost: number;
  extra_note: string;
};

// 자주 쓰는 공종명·단위 (직접 입력도 돼요)
const WORK_HINTS = ["주차장판석", "디딤돌", "디딤석", "자연석", "잔디", "잔디엣지", "터밭", "화단", "수전", "왕사", "마사토", "자갈", "소나무", "에메랄드그린", "미측백", "식재", "포크레인", "인건비", "운반비"];
const UNITS = ["식", "빠렛", "주", "일", "타", "㎡", "장", "개", "본", "대", "톤", "m"];
const blankItem = (): Item => ({ kind: "material", work: "", spec: "", unit: "식", qty: "1", unit_price: 0, note: "" });
// 공종명으로 구분 짐작 (바꿀 수 있어요)
const guessKind = (w: string): Kind => (/운반|배송|운송|화물/.test(w) ? "delivery" : /포크레인|굴삭|장비|인건|인부|시공|설치|깔기|식재|정리|철거|폐기/.test(w) ? "labor" : "material");
const blankEst = (): Est => ({
  published: false,
  vat_included: false,
  overhead_rate: "",
  valid_until: "",
  site_issues: "",
  measure_note: "",
  schedule_note: "",
  exclusions: "",
  meals_included: true,
  equipment_cost: 0,
  waste_cost: 0,
  extra_labor_cost: 0,
  extra_note: "",
});
const won = (n: number) => n.toLocaleString("ko-KR");
const num = (v: string) => Math.max(0, Number(v.replace(/[^\d]/g, "")) || 0);
const qtyNum = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0);
const amountOf = (i: Item) => Math.round(qtyNum(i.qty) * i.unit_price);

type DbItem = {
  sort: number;
  work: string;
  material: string | null;
  spec: string | null;
  quantity: string | null;
  unit: string | null;
  qty: number | null;
  unit_price: number | null;
  kind: Kind | null;
  material_cost: number;
  delivery_cost: number;
  labor_cost: number;
  note: string | null;
};

/** 예전 줄(자재비·배송비·시공비)은 1식 × 합계 단가로 옮김 */
const fromDb = (i: DbItem): Item =>
  (i.unit_price ?? 0) > 0
    ? { kind: i.kind ?? "material", work: i.work, spec: i.spec ?? "", unit: i.unit ?? "식", qty: String(i.qty ?? 1), unit_price: i.unit_price ?? 0, note: i.note ?? "" }
    : {
        kind: i.labor_cost >= Math.max(i.material_cost, i.delivery_cost) ? "labor" : i.delivery_cost > i.material_cost ? "delivery" : "material",
        work: [i.work, i.material].filter(Boolean).join(" "),
        spec: [i.spec, i.quantity].filter(Boolean).join(" · "),
        unit: "식",
        qty: "1",
        unit_price: i.material_cost + i.delivery_cost + i.labor_cost,
        note: i.note ?? "",
      };

export function EstimateEditor({ quoteId, status, onSent }: { quoteId: string; status: string; onSent: () => Promise<void> }) {
  const sb = getAdminSupabase();
  const [est, setEst] = useState<Est>(blankEst());
  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("quote_estimates").select("*, items:quote_estimate_items(*)").eq("quote_id", quoteId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return;
    setEst({
      ...blankEst(),
      id: data.id,
      published: !!data.published,
      vat_included: !!data.vat_included,
      overhead_rate: data.overhead_rate ? String(Number(data.overhead_rate)) : "",
      valid_until: data.valid_until ?? "",
      site_issues: data.site_issues ?? "",
      measure_note: data.measure_note ?? "",
      schedule_note: data.schedule_note ?? "",
      exclusions: data.exclusions ?? "",
      meals_included: data.meals_included !== false,
      equipment_cost: data.equipment_cost ?? 0,
      waste_cost: data.waste_cost ?? 0,
      extra_labor_cost: data.extra_labor_cost ?? 0,
      extra_note: data.extra_note ?? "",
    });
    const its = ((data.items ?? []) as DbItem[]).sort((a, b) => a.sort - b.sort);
    setItems(its.length ? its.map(fromDb) : [blankItem()]);
    setOpen(true);
  }, [sb, quoteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setI = (i: number, patch: Partial<Item>) => setItems((p) => p.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setItems((p) => {
      const j = i + d;
      if (j < 0 || j >= p.length) return p;
      const c = [...p];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const valid = items.filter((i) => i.work.trim());
  // 미리보기·합계 계산은 고객 견적서와 같은 함수로
  const preview_items = valid.map((i, n) => ({
    id: String(n),
    sort: n,
    work: i.work.trim(),
    material: null,
    spec: i.spec || null,
    quantity: null,
    unit: i.unit || null,
    qty: qtyNum(i.qty),
    unit_price: i.unit_price,
    kind: i.kind,
    material_cost: 0,
    delivery_cost: 0,
    labor_cost: 0,
    note: i.note || null,
  }));
  const rate = Math.min(50, qtyNum(est.overhead_rate));
  const parts = estimateParts({ items: preview_items, equipment_cost: est.equipment_cost, waste_cost: est.waste_cost, extra_labor_cost: est.extra_labor_cost });
  const t = estimateTotals({ items: preview_items, overhead_rate: rate, vat_included: est.vat_included, equipment_cost: est.equipment_cost, waste_cost: est.waste_cost, extra_labor_cost: est.extra_labor_cost });

  const save = async (publish: boolean) => {
    if (!sb || busy) return;
    if (!valid.length) return setMsg("공종을 하나 이상 넣어주세요.");
    if (valid.some((i) => !i.unit_price)) return setMsg("단가가 비어 있는 줄이 있어요.");
    if (publish && !confirm(`고객에게 ${won(t.grand)}원(부가세 포함) 견적서를 보낼까요? 상태가 '견적 도착'으로 바뀌고 안내 메일이 가요.`)) return;
    setBusy(true);
    setMsg("");
    const row = {
      quote_id: quoteId,
      published: publish || est.published,
      vat_included: est.vat_included,
      overhead_rate: rate,
      valid_until: est.valid_until || null,
      site_issues: est.site_issues || null,
      measure_note: est.measure_note || null,
      schedule_note: est.schedule_note || null,
      exclusions: est.exclusions || null,
      meals_included: est.meals_included,
      // 예전 추가 비용은 공종 줄로 옮겼으니 비움
      equipment_cost: 0,
      waste_cost: 0,
      extra_labor_cost: 0,
      extra_note: null,
    };
    const res = est.id ? await sb.from("quote_estimates").update(row).eq("id", est.id).select("id").single() : await sb.from("quote_estimates").insert(row).select("id").single();
    if (res.error || !res.data) {
      setBusy(false);
      return setMsg("저장하지 못했어요: " + (res.error?.message ?? ""));
    }
    const estimateId = res.data.id as string;
    // 줄은 지우고 다시 넣음 (순서 = 화면 순서)
    await sb.from("quote_estimate_items").delete().eq("estimate_id", estimateId);
    const ins = await sb.from("quote_estimate_items").insert(
      valid.map((i, n) => ({
        estimate_id: estimateId,
        sort: n + 1,
        work: i.work.trim(),
        spec: i.spec || null,
        unit: i.unit || null,
        qty: qtyNum(i.qty),
        unit_price: i.unit_price,
        kind: i.kind,
        material_cost: 0,
        delivery_cost: 0,
        labor_cost: 0,
        note: i.note || null,
      })),
    );
    if (ins.error) {
      setBusy(false);
      return setMsg("항목을 저장하지 못했어요: " + ins.error.message);
    }
    if (publish && status !== "quoted") {
      await sb.from("quote_requests").update({ status: "quoted" }).eq("id", quoteId);
    }
    // 예전 추가 비용을 공종 줄로 옮겼으면 화면에서도 비움
    if (est.equipment_cost || est.waste_cost || est.extra_labor_cost) setEst((p) => ({ ...p, equipment_cost: 0, waste_cost: 0, extra_labor_cost: 0, extra_note: "" }));
    setEst((p) => ({ ...p, id: estimateId, published: publish || p.published }));
    setBusy(false);
    setMsg(publish ? "고객에게 보냈어요. 견적 도착 메일이 가요." : "임시 저장했어요. 고객에게는 아직 안 보여요.");
    if (publish) await onSent();
  };

  if (!open)
    return (
      <div className="adm-card">
        <h3>견적서</h3>
        <p className="adm-note">아직 작성한 견적서가 없어요.</p>
        <button className="btn btn--primary" onClick={() => setOpen(true)}>
          견적서 작성하기
        </button>
      </div>
    );

  const legacyExtra = est.equipment_cost + est.waste_cost + est.extra_labor_cost;

  return (
    <div className="adm-card">
      <h3>
        견적서 <small>{est.published ? "고객에게 보이는 중" : "임시 저장 · 고객에게 안 보임"}</small>
      </h3>

      <datalist id="est-works">
        {WORK_HINTS.map((w) => (
          <option key={w} value={w} />
        ))}
      </datalist>

      {/* 업체 견적서와 같은 표: 공종명 · 규격 · 단위 · 수량 · 단가 · 금액 */}
      <div className="adm-etable" role="table" aria-label="견적 내역 입력">
        <div className="adm-etr adm-etr--head" role="row">
          <span>구분</span>
          <span>공종명</span>
          <span>규격</span>
          <span>단위</span>
          <span>수량</span>
          <span>단가</span>
          <span>금액</span>
          <span />
        </div>
        {items.map((it, i) => (
          <div key={i} className="adm-etr" role="row">
            <select className={`ui-input adm-etr__kind is-${it.kind}`} value={it.kind} aria-label={`${i + 1}번 구분`} onChange={(e) => setI(i, { kind: e.target.value as Kind })}>
              {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <input
              className="ui-input"
              list="est-works"
              value={it.work}
              placeholder="예: 디딤돌"
              aria-label={`${i + 1}번 공종명`}
              onChange={(e) => setI(i, { work: e.target.value, ...(it.work ? {} : { kind: guessKind(e.target.value) }) })}
              onBlur={(e) => !it.unit_price && setI(i, { kind: guessKind(e.target.value) })}
            />
            <input className="ui-input" value={it.spec} placeholder="예: 자연석 600" aria-label={`${i + 1}번 규격`} onChange={(e) => setI(i, { spec: e.target.value })} />
            <select className="ui-input" value={UNITS.includes(it.unit) ? it.unit : "_"} aria-label={`${i + 1}번 단위`} onChange={(e) => setI(i, { unit: e.target.value === "_" ? "" : e.target.value })}>
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
              <option value="_">직접</option>
            </select>
            <input className="ui-input adm-etr__num" inputMode="decimal" value={it.qty} aria-label={`${i + 1}번 수량`} onChange={(e) => setI(i, { qty: e.target.value.replace(/[^\d.]/g, "") })} />
            <input className="ui-input adm-etr__num" inputMode="numeric" value={it.unit_price ? won(it.unit_price) : ""} placeholder="0" aria-label={`${i + 1}번 단가`} onChange={(e) => setI(i, { unit_price: num(e.target.value) })} />
            <strong className="adm-etr__amt">{won(amountOf(it))}</strong>
            <span className="adm-etr__tools">
              <button type="button" className="adm-btn" aria-label="위로" disabled={i === 0} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" className="adm-btn" aria-label="아래로" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button type="button" className="adm-btn adm-btn--danger" aria-label="줄 삭제" disabled={items.length === 1} onClick={() => setItems((p) => p.filter((_, n) => n !== i))}>
                ×
              </button>
            </span>
            {!UNITS.includes(it.unit) && (
              <input className="ui-input adm-etr__unit" value={it.unit} placeholder="단위 직접 입력" aria-label={`${i + 1}번 단위 직접 입력`} onChange={(e) => setI(i, { unit: e.target.value })} />
            )}
            <input className="ui-input adm-etr__note" value={it.note} placeholder="비고 (선택) · 예: 주차장에서 현관, 테두리마감석" aria-label={`${i + 1}번 비고`} onChange={(e) => setI(i, { note: e.target.value })} />
          </div>
        ))}
        <button type="button" className="adm-btn" onClick={() => setItems((p) => [...p, blankItem()])}>
          + 줄 추가
        </button>
      </div>

      {legacyExtra > 0 && (
        <p className="adm-note">
          예전 방식 추가 비용 {won(legacyExtra)}원{est.extra_note ? ` (${est.extra_note})` : ""}이 있어요. 저장하면 사라지니, 필요하면 위에 공종 줄(예: 포크레인 1일)로 넣어주세요.
        </p>
      )}

      <div className="adm-esum">
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
          <div key={k} className="adm-esum__part">
            <span>{KIND_LABEL[k]}비</span>
            <span>{won(parts[k])}원</span>
          </div>
        ))}
        <div>
          <span>계</span>
          <strong>{won(t.subtotal)}원</strong>
        </div>
        <label>
          <span>공과잡비</span>
          <input className="ui-input adm-etr__num" inputMode="decimal" value={est.overhead_rate} placeholder="예: 5" onChange={(e) => setEst((p) => ({ ...p, overhead_rate: e.target.value.replace(/[^\d.]/g, "") }))} />
          <small>% → {won(t.overhead)}원</small>
        </label>
        <div>
          <span>공급가액</span>
          <strong>{won(t.supply)}원</strong>
        </div>
        <div>
          <span>부가세 10%</span>
          <strong>{won(t.vat)}원</strong>
        </div>
        <div className="adm-esum__grand">
          <span>합계 (고객에게 보이는 금액)</span>
          <strong>{won(t.grand)}원</strong>
        </div>
      </div>

      <h4>안내</h4>
      <div className="adm-grid">
        {(
          [
            ["site_issues", "현장 특이사항 (주황 상자)", "땅이 질고 배수가 안 돼요"],
            ["schedule_note", "예상 일정", "계약 후 2주 안, 하루 작업"],
            ["exclusions", "포함되지 않음", "기존 수목 이식"],
            ["measure_note", "기타 사항", "우천 시 일정 변경"],
          ] as const
        ).map(([k, l, ph]) => (
          <label key={k}>
            <span>{l}</span>
            <textarea className="ui-input" rows={2} value={est[k]} placeholder={ph} onChange={(e) => setEst((p) => ({ ...p, [k]: e.target.value }))} />
          </label>
        ))}
      </div>
      <div className="adm-checks">
        <label>
          <input type="checkbox" checked={est.vat_included} onChange={(e) => setEst((p) => ({ ...p, vat_included: e.target.checked }))} /> 단가에 부가세 포함 <small>(업체 견적이 '부가세 별도'면 끄기)</small>
        </label>
        <label>
          <input type="checkbox" checked={est.meals_included} onChange={(e) => setEst((p) => ({ ...p, meals_included: e.target.checked }))} /> 식비 등 현장 경비 견적 금액에 포함
        </label>
        <label>
          유효기간 <input className="ui-input adm-date" type="date" value={est.valid_until} onChange={(e) => setEst((p) => ({ ...p, valid_until: e.target.value }))} />
          <small>비우면 발행일 +14일</small>
        </label>
      </div>

      {preview && (
        <div className="adm-preview">
          <p className="adm-preview__head">
            고객에게 이렇게 보여요 <small>저장 전 내용 기준</small>
          </p>
          <EstimateCard
            receiptNo="미리보기"
            customer="고객"
            estimate={{
              id: "preview",
              issued_at: new Date().toISOString(),
              valid_until: est.valid_until || null,
              vat_included: est.vat_included,
              overhead_rate: rate,
              measure_note: est.measure_note || null,
              schedule_note: est.schedule_note || null,
              exclusions: est.exclusions || null,
              site_issues: est.site_issues || null,
              equipment_cost: est.equipment_cost,
              waste_cost: est.waste_cost,
              extra_labor_cost: est.extra_labor_cost,
              extra_note: est.extra_note || null,
              meals_included: est.meals_included,
              items: preview_items,
              photos: [],
            }}
          />
          <div className="adm-preview__foot">
            <button className="adm-btn" onClick={() => setPreview(false)}>
              미리보기 닫기
            </button>
          </div>
        </div>
      )}

      <div className="adm-save">
        {msg && <span>{msg}</span>}
        <button className="btn btn--secondary" onClick={() => setPreview((p) => !p)}>
          {preview ? "미리보기 닫기" : "미리보기"}
        </button>
        <button className="btn btn--secondary" disabled={busy} onClick={() => void save(false)}>
          임시 저장
        </button>
        <button className="btn btn--primary" disabled={busy} onClick={() => void save(true)}>
          {est.published ? "수정 내용 반영" : "고객에게 보내기"}
        </button>
      </div>
    </div>
  );
}
