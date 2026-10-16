"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { EstimateEditor } from "./EstimateEditor";

type Row = {
  id: string;
  receipt_no: string;
  email: string;
  name: string | null;
  phone: string | null;
  region: string;
  district: string;
  housing: string;
  works: string[];
  works_unknown: boolean;
  scope: string;
  size_note: string | null;
  wish: string | null;
  timing: string;
  budget: string | null;
  photo_paths: string[];
  status: string;
  visit_at: string | null;
  visit_note: string | null;
  visit_address: string | null;
  visit_address_detail: string | null;
  visit_memo: string | null;
  customer_response: string | null;
  build_at: string | null;
  build_note: string | null;
  created_at: string;
};

const STATUS: [string, string][] = [
  ["received", "접수됨"],
  ["checking", "확인 중"],
  ["visit", "실측 예정"],
  ["needs", "보완 필요"],
  ["quoted", "견적 도착"],
  ["done", "진행 확정"],
  ["hold", "보류"],
  ["canceled", "취소됨"],
];
const LABEL = Object.fromEntries(STATUS);
const RESP: Record<string, string> = { go: "진행할게요", adjust: "조정 상담", hold: "보류" };

const fmt = (v: string | null) => (v ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(v)) : "—");
// datetime-local 값 ↔ 한국 시간
const toLocal = (v: string | null) => {
  if (!v) return "";
  const d = new Date(new Date(v).getTime() + 9 * 3600000);
  return d.toISOString().slice(0, 16);
};
const fromLocal = (v: string) => (v ? new Date(`${v}:00+09:00`).toISOString() : null);

export function AdminApp() {
  const sb = getSupabase();
  const [phase, setPhase] = useState<"loading" | "email" | "code" | "denied" | "ready">("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("open");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) return setMsg("목록을 불러오지 못했어요: " + error.message);
    setRows((data ?? []) as Row[]);
  }, [sb]);

  const check = useCallback(async () => {
    if (!sb) return setPhase("email");
    const { data } = await sb.auth.getSession();
    if (!data.session) return setPhase("email");
    const { data: ok } = await sb.rpc("is_admin");
    if (!ok) return setPhase("denied");
    setPhase("ready");
    void loadRows();
  }, [sb, loadRows]);

  useEffect(() => {
    void check();
  }, [check]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    setMsg("");
    const { error } = await sb.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    if (error) return setMsg("확인 메일을 보내지 못했어요. 관리자 이메일인지 확인해주세요.");
    setPhase("code");
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    if (error) return setMsg("코드가 맞지 않거나 만료됐어요.");
    setCode("");
    await check();
  };

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "open" && ["done", "hold", "canceled"].includes(r.status)) return false;
      if (filter !== "open" && filter !== "all" && r.status !== filter) return false;
      if (!k) return true;
      return [r.receipt_no, r.name, r.phone, r.email, r.district, r.visit_address].some((v) => (v ?? "").toLowerCase().includes(k));
    });
  }, [rows, filter, q]);
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const sel = rows.find((r) => r.id === selId) ?? null;

  if (phase === "loading") return <p className="adm-note">불러오는 중…</p>;
  if (phase === "email" || phase === "code")
    return (
      <section className="adm-login">
        <h1>테두리 관리자</h1>
        {phase === "email" ? (
          <form onSubmit={send}>
            <input className="ui-input" type="email" placeholder="관리자 이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn btn--primary">확인 코드 받기</button>
          </form>
        ) : (
          <form onSubmit={verify}>
            <input className="ui-input" inputMode="numeric" placeholder="메일로 받은 코드" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
            <button className="btn btn--primary">로그인</button>
          </form>
        )}
        {msg && <p className="my-error">{msg}</p>}
      </section>
    );
  if (phase === "denied")
    return (
      <section className="adm-login">
        <h1>관리자 권한이 없어요</h1>
        <p className="adm-note">관리자 명단(admins)에 등록된 이메일로 로그인해주세요.</p>
        <button className="btn btn--secondary" onClick={() => void sb?.auth.signOut().then(() => setPhase("email"))}>
          다른 이메일로 로그인
        </button>
      </section>
    );

  return (
    <div className="adm-app">
      <header className="adm-top">
        <h1>테두리 관리자</h1>
        <div className="adm-top__right">
          <button className="adm-btn" onClick={() => void loadRows()}>
            새로고침
          </button>
          <button className="adm-btn" onClick={() => void sb?.auth.signOut().then(() => setPhase("email"))}>
            로그아웃
          </button>
        </div>
      </header>

      <nav className="adm-filters" aria-label="상태 거르기">
        {[["open", `진행 중 ${rows.filter((r) => !["done", "hold", "canceled"].includes(r.status)).length}`], ["all", `전체 ${rows.length}`], ...STATUS.map(([k, l]) => [k, `${l} ${count(k)}`])].map(([k, l]) => (
          <button key={k} className={filter === k ? "is-on" : ""} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
        <input className="ui-input adm-search" placeholder="접수번호·이름·전화·주소 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      </nav>

      <div className="adm-body">
        <ul className="adm-list">
          {shown.map((r) => (
            <li key={r.id}>
              <button className={r.id === selId ? "is-on" : ""} onClick={() => setSelId(r.id)}>
                <span className="adm-list__top">
                  <strong>{r.name || "이름 없음"}</strong>
                  <em className={`adm-st adm-st--${r.status}`}>{LABEL[r.status] ?? r.status}</em>
                </span>
                <span>
                  {r.receipt_no} · {r.region} {r.district} · {r.works_unknown ? "작업 상담" : r.works.join("·")}
                </span>
                <small>
                  {fmt(r.created_at)}
                  {r.customer_response && ` · 응답: ${RESP[r.customer_response]}`}
                </small>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="adm-note">해당하는 신청이 없어요.</li>}
        </ul>

        <section className="adm-detail">{sel ? <Detail key={sel.id} r={sel} onSaved={loadRows} /> : <p className="adm-note">왼쪽에서 신청을 골라주세요.</p>}</section>
      </div>
    </div>
  );
}

function Detail({ r, onSaved }: { r: Row; onSaved: () => Promise<void> }) {
  const sb = getSupabase();
  const [status, setStatus] = useState(r.status);
  const [visitAt, setVisitAt] = useState(toLocal(r.visit_at));
  const [visitNote, setVisitNote] = useState(r.visit_note ?? "");
  const [buildAt, setBuildAt] = useState(toLocal(r.build_at));
  const [buildNote, setBuildNote] = useState(r.build_note ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!sb || !r.photo_paths.length) return;
    void sb.storage
      .from("quote-photos")
      .createSignedUrls(r.photo_paths, 3600)
      .then(({ data }) => setPhotos((data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[]));
  }, [sb, r.photo_paths]);

  const save = async () => {
    if (!sb || busy) return;
    setBusy(true);
    setDone("");
    const { error } = await sb
      .from("quote_requests")
      .update({ status, visit_at: fromLocal(visitAt), visit_note: visitNote || null, build_at: fromLocal(buildAt), build_note: buildNote || null })
      .eq("id", r.id);
    setBusy(false);
    if (error) return setDone("저장하지 못했어요: " + error.message);
    setDone(status !== r.status && (status === "visit" || status === "quoted") ? "저장했어요. 고객에게 안내 메일이 가요." : "저장했어요.");
    await onSaved();
  };

  const info: [string, string][] = [
    ["접수번호", r.receipt_no],
    ["이름", r.name ?? "—"],
    ["휴대전화", r.phone ?? "—"],
    ["이메일", r.email],
    ["지역", `${r.region} ${r.district} · ${r.housing}`],
    ["방문 주소", r.visit_address ? `${r.visit_address} ${r.visit_address_detail ?? ""}` : "아직 없음"],
    ["방문 메모", r.visit_memo ?? "—"],
    ["작업", r.works_unknown ? "상담하며 정할게요" : r.works.join(" · ")],
    ["맡길 범위", r.scope],
    ["크기", r.size_note ?? "—"],
    ["희망 시기", r.timing],
    ["예산", r.budget ?? "—"],
    ["요청사항", r.wish ?? "—"],
    ["고객 응답", r.customer_response ? RESP[r.customer_response] : "—"],
  ];

  return (
    <div className="adm-detail__in">
      <header className="adm-detail__head">
        <div>
          <p className="adm-kicker">{r.receipt_no}</p>
          <h2>
            {r.name || "이름 없음"} <small>{r.phone}</small>
          </h2>
        </div>
        {r.phone && (
          <a className="adm-btn adm-btn--call" href={`tel:${r.phone.replace(/-/g, "")}`}>
            전화하기
          </a>
        )}
      </header>

      <div className="adm-card">
        <h3>진행 관리</h3>
        <div className="adm-status">
          {STATUS.map(([k, l]) => (
            <button key={k} className={`adm-st adm-st--${k}${status === k ? " is-on" : ""}`} onClick={() => setStatus(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="adm-grid">
          <label>
            <span>실측 방문 일시</span>
            <input className="ui-input" type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} />
          </label>
          <label>
            <span>실측 안내 메모 (고객에게 보임)</span>
            <input className="ui-input" value={visitNote} onChange={(e) => setVisitNote(e.target.value)} placeholder="예: 담당 김OO, 30분 정도 걸려요" />
          </label>
          <label>
            <span>시공 일시</span>
            <input className="ui-input" type="datetime-local" value={buildAt} onChange={(e) => setBuildAt(e.target.value)} />
          </label>
          <label>
            <span>시공 안내 메모 (고객에게 보임)</span>
            <input className="ui-input" value={buildNote} onChange={(e) => setBuildNote(e.target.value)} placeholder="예: 오전 9시 도착, 하루 작업" />
          </label>
        </div>
        <div className="adm-save">
          {done && <span>{done}</span>}
          <button className="btn btn--primary" disabled={busy} onClick={() => void save()}>
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      <EstimateEditor quoteId={r.id} status={status} onSent={async () => (setStatus("quoted"), await onSaved())} />

      <div className="adm-card">
        <h3>신청 내용</h3>
        <dl className="adm-dl">
          {info.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {photos.length > 0 && (
          <ul className="adm-photos">
            {photos.map((u, i) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noopener noreferrer">
                  <img src={u} alt={`현장 사진 ${i + 1}`} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
