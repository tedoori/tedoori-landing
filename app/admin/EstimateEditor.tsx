"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminSupabase } from "../../lib/supabase";

type Item = { work: string; material: string; spec: string; quantity: string; material_cost: number; delivery_cost: number; labor_cost: number; note: string };
type Est = {
  id?: string;
  published: boolean;
  vat_included: boolean;
  valid_until: string;
  site_issues: string;
  measure_note: string;
  schedule_note: string;
  exclusions: string;
  equipment_cost: number;
  waste_cost: number;
  extra_labor_cost: number;
  extra_note: string;
  meals_included: boolean;
};

const WORKS = ["잔디", "디딤석", "자갈", "화단", "식재", "기타"];
const blankItem = (): Item => ({ work: "잔디", material: "", spec: "", quantity: "", material_cost: 0, delivery_cost: 0, labor_cost: 0, note: "" });
const blankEst = (): Est => ({
  published: false,
  vat_included: true,
  valid_until: "",
  site_issues: "",
  measure_note: "",
  schedule_note: "",
  exclusions: "",
  equipment_cost: 0,
  waste_cost: 0,
  extra_labor_cost: 0,
  extra_note: "",
  meals_included: true,
});
const won = (n: number) => n.toLocaleString("ko-KR");
const num = (v: string) => Math.max(0, Number(v.replace(/[^\d]/g, "")) || 0);

/** 견적서 작성: 임시 저장 / 고객에게 보내기 */
export function EstimateEditor({ quoteId, status, onSent }: { quoteId: string; status: string; onSent: () => Promise<void> }) {
  const sb = getAdminSupabase();
  const [est, setEst] = useState<Est>(blankEst());
  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("quote_estimates").select("*, items:quote_estimate_items(*)").eq("quote_id", quoteId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return;
    setEst({
      ...blankEst(),
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? (typeof blankEst()[k as keyof Est] === "number" ? 0 : "")])),
      valid_until: data.valid_until ?? "",
    } as Est);
    const its = ((data.items ?? []) as (Item & { sort: number })[]).sort((a, b) => a.sort - b.sort);
    setItems(its.length ? its.map((i) => ({ ...blankItem(), ...Object.fromEntries(Object.entries(i).map(([k, v]) => [k, v ?? ""])) }) as Item) : [blankItem()]);
    setOpen(true);
  }, [sb, quoteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setI = (i: number, patch: Partial<Item>) => setItems((p) => p.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const itemsSum = items.reduce((a, i) => a + i.material_cost + i.delivery_cost + i.labor_cost, 0);
  const total = itemsSum + est.equipment_cost + est.waste_cost + est.extra_labor_cost;
  const grand = est.vat_included ? total : total + Math.round(total * 0.1);

  const save = async (publish: boolean) => {
    if (!sb || busy) return;
    const valid = items.filter((i) => i.work.trim());
    if (!valid.length) return setMsg("항목을 하나 이상 넣어주세요.");
    if (publish && !confirm(`고객에게 ${won(grand)}원 견적서를 보낼까요? 상태가 '견적 도착'으로 바뀌고 안내 메일이 가요.`)) return;
    setBusy(true);
    setMsg("");
    const row = {
      quote_id: quoteId,
      published: publish || est.published,
      vat_included: est.vat_included,
      valid_until: est.valid_until || null,
      site_issues: est.site_issues || null,
      measure_note: est.measure_note || null,
      schedule_note: est.schedule_note || null,
      exclusions: est.exclusions || null,
      equipment_cost: est.equipment_cost,
      waste_cost: est.waste_cost,
      extra_labor_cost: est.extra_labor_cost,
      extra_note: est.extra_note || null,
      meals_included: est.meals_included,
    };
    const res = est.id ? await sb.from("quote_estimates").update(row).eq("id", est.id).select("id").single() : await sb.from("quote_estimates").insert(row).select("id").single();
    if (res.error || !res.data) {
      setBusy(false);
      return setMsg("저장하지 못했어요: " + (res.error?.message ?? ""));
    }
    const estimateId = res.data.id as string;
    // 항목은 지우고 다시 넣음 (순서 = 화면 순서)
    await sb.from("quote_estimate_items").delete().eq("estimate_id", estimateId);
    const ins = await sb.from("quote_estimate_items").insert(
      valid.map((i, n) => ({
        estimate_id: estimateId,
        sort: n + 1,
        work: i.work,
        material: i.material || null,
        spec: i.spec || null,
        quantity: i.quantity || null,
        material_cost: i.material_cost,
        delivery_cost: i.delivery_cost,
        labor_cost: i.labor_cost,
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

  const numInput = (v: number, on: (n: number) => void, label: string) => (
    <label className="adm-num">
      <span>{label}</span>
      <input className="ui-input" inputMode="numeric" value={v ? won(v) : ""} placeholder="0" onChange={(e) => on(num(e.target.value))} />
    </label>
  );

  return (
    <div className="adm-card">
      <h3>
        견적서 <small>{est.published ? "고객에게 보이는 중" : "임시 저장 · 고객에게 안 보임"}</small>
      </h3>

      <div className="adm-items">
        {items.map((it, i) => (
          <div key={i} className="adm-item">
            <div className="adm-item__row">
              <label>
                <span>작업</span>
                <select className="ui-input" value={it.work} onChange={(e) => setI(i, { work: e.target.value })}>
                  {WORKS.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>자재</span>
                <input className="ui-input" value={it.material} placeholder="한국잔디" onChange={(e) => setI(i, { material: e.target.value })} />
              </label>
              <label>
                <span>규격</span>
                <input className="ui-input" value={it.spec} placeholder="600×300×30mm" onChange={(e) => setI(i, { spec: e.target.value })} />
              </label>
              <label>
                <span>수량</span>
                <input className="ui-input" value={it.quantity} placeholder="20㎡ · 1파레트 · 8장" onChange={(e) => setI(i, { quantity: e.target.value })} />
              </label>
            </div>
            <div className="adm-item__row">
              {numInput(it.material_cost, (n) => setI(i, { material_cost: n }), "자재비")}
              {numInput(it.delivery_cost, (n) => setI(i, { delivery_cost: n }), "배송비")}
              {numInput(it.labor_cost, (n) => setI(i, { labor_cost: n }), "시공비")}
              <label>
                <span>줄 메모</span>
                <input className="ui-input" value={it.note} placeholder="현관까지 일자로" onChange={(e) => setI(i, { note: e.target.value })} />
              </label>
            </div>
            <div className="adm-item__foot">
              <span>소계 {won(it.material_cost + it.delivery_cost + it.labor_cost)}원</span>
              {items.length > 1 && (
                <button className="adm-btn adm-btn--danger" onClick={() => setItems((p) => p.filter((_, n) => n !== i))}>
                  줄 삭제
                </button>
              )}
            </div>
          </div>
        ))}
        <button className="adm-btn" onClick={() => setItems((p) => [...p, blankItem()])}>
          + 항목 추가
        </button>
      </div>

      <h4>추가 비용</h4>
      <div className="adm-item__row">
        {numInput(est.equipment_cost, (n) => setEst((p) => ({ ...p, equipment_cost: n })), "장비비")}
        {numInput(est.waste_cost, (n) => setEst((p) => ({ ...p, waste_cost: n })), "폐기물 처리비")}
        {numInput(est.extra_labor_cost, (n) => setEst((p) => ({ ...p, extra_labor_cost: n })), "추가 인건비")}
        <label>
          <span>추가 비용 설명</span>
          <input className="ui-input" value={est.extra_note} placeholder="미니 굴삭기 반나절" onChange={(e) => setEst((p) => ({ ...p, extra_note: e.target.value }))} />
        </label>
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
          <input type="checkbox" checked={est.vat_included} onChange={(e) => setEst((p) => ({ ...p, vat_included: e.target.checked }))} /> 금액에 부가세 포함
        </label>
        <label>
          <input type="checkbox" checked={est.meals_included} onChange={(e) => setEst((p) => ({ ...p, meals_included: e.target.checked }))} /> 식비 등 현장 경비 시공비에 포함
        </label>
        <label>
          유효기간 <input className="ui-input adm-date" type="date" value={est.valid_until} onChange={(e) => setEst((p) => ({ ...p, valid_until: e.target.value }))} />
          <small>비우면 발행일 +14일</small>
        </label>
      </div>

      <div className="adm-total">
        합계 <strong>{won(grand)}원</strong> <small>{est.vat_included ? "부가세 포함" : `부가세 10% 더한 금액 (입력 ${won(total)}원)`}</small>
      </div>

      <div className="adm-save">
        {msg && <span>{msg}</span>}
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
