"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminSupabase } from "../../lib/supabase";
import { EstimateEditor } from "./EstimateEditor";
import { CompletionCard } from "../my/[id]/CompletionCard";

type Row = {
  id: string;
  user_id: string;
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
  build_scope: string[] | null;
  next_title: string | null;
  next_desc: string | null;
  completed_at: string | null;
  completion_note: string | null;
  completion_photos: string[] | null;
  created_at: string;
};

// 진행 순서대로. done = 진행 확정(고객이 진행하기로 함), completed = 완료(시공·배송·자재 모두 끝나 거래 종료)
const STATUS: [string, string][] = [
  ["received", "접수됨"],
  ["checking", "확인 중"],
  ["visit", "실측 예정"],
  ["quoted", "견적 도착"],
  ["needs", "보완 필요"],
  ["hold", "보류"],
  ["canceled", "취소됨"],
  ["done", "진행 확정"],
  ["completed", "완료"],
];
const CLOSED = ["completed", "hold", "canceled"];
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
  const sb = getAdminSupabase();
  const [phase, setPhase] = useState<"loading" | "email" | "denied" | "ready">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("all");
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

  // 관리자는 이메일 + 비밀번호 (Supabase → Authentication → Users 에서 만든 계정)
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    setMsg("");
    const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return setMsg("이메일 또는 비밀번호가 맞지 않아요.");
    setPassword("");
    await check();
  };

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "open" && CLOSED.includes(r.status)) return false;
      if (filter !== "open" && filter !== "all" && r.status !== filter) return false;
      if (!k) return true;
      return [r.receipt_no, r.name, r.phone, r.email, r.district, r.visit_address].some((v) => (v ?? "").toLowerCase().includes(k));
    });
  }, [rows, filter, q]);
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const sel = rows.find((r) => r.id === selId) ?? null;

  if (phase === "loading") return <p className="adm-note">불러오는 중…</p>;
  if (phase === "email")
    return (
      <section className="adm-login">
        <h1>테두리 관리자</h1>
        <form onSubmit={login}>
          <input className="ui-input" type="email" autoComplete="username" placeholder="관리자 이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="ui-input" type="password" autoComplete="current-password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn btn--primary">로그인</button>
        </form>
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
        {[["all", `전체 ${rows.length}`], ["open", `진행 중 ${rows.filter((r) => !CLOSED.includes(r.status)).length}`], ...STATUS.map(([k, l]) => [k, `${l} ${count(k)}`])].map(([k, l]) => (
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

// 관리자가 할 일을 단계별로 묶음 (상태 → 단계)
type Stage = "intake" | "visit" | "quote" | "build" | "complete";
const STAGES: [Stage, string, string][] = [
  ["intake", "접수·확인", "연락해서 신청 내용과 방문 주소를 확인해요"],
  ["visit", "실측", "실측 날짜를 정해 고객에게 알려요"],
  ["quote", "견적", "견적서를 작성해 고객에게 보내요"],
  ["build", "진행", "작업 종류·날짜를 정해 고객에게 알려요"],
  ["complete", "완료", "완료 사진과 남길 말을 올려 거래를 마무리해요"],
];
const STAGE_OF: Record<string, Stage> = { received: "intake", checking: "intake", needs: "intake", hold: "quote", canceled: "intake", visit: "visit", quoted: "quote", done: "build", completed: "complete" };
// 각 단계에서 고르는 상태
const STAGE_STATUS: Record<Stage, string[]> = {
  intake: ["received", "checking", "needs", "canceled"],
  visit: ["visit"],
  quote: ["quoted", "hold"],
  build: ["done"],
  complete: ["completed"],
};

// 짧은 날짜 (예: 11월 3일 (월) 오전 9:00)
const fmtShort = (local: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(`${local}:00+09:00`));

type Phrase = { id: string; field: string; text: string };

/** 고객에게 보이는 문구 칸: 직접 입력 + 기본·저장 문구 고르기(저장·수정·삭제) + 어디에 보이는지 */
function CopyField({ field, label, path, value, onChange, presets, fallback }: { field: string; label: string; path?: string; value: string; onChange: (v: string) => void; presets: string[]; fallback?: string }) {
  const sb = getAdminSupabase();
  const [saved, setSaved] = useState<Phrase[]>([]);
  const [editing, setEditing] = useState(false);
  const load = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("admin_phrases").select("id, field, text").eq("field", field).order("created_at");
    setSaved((data ?? []) as Phrase[]);
  }, [sb, field]);
  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    const t = value.trim();
    if (!sb || !t || saved.some((p) => p.text === t)) return;
    await sb.from("admin_phrases").insert({ field, text: t });
    void load();
  };
  const edit = async (p: Phrase) => {
    const t = window.prompt("문구 수정", p.text)?.trim();
    if (!sb || !t || t === p.text) return;
    await sb.from("admin_phrases").update({ text: t }).eq("id", p.id);
    void load();
  };
  const del = async (p: Phrase) => {
    if (!sb || !window.confirm(`'${p.text}' 문구를 지울까요?`)) return;
    await sb.from("admin_phrases").delete().eq("id", p.id);
    void load();
  };
  const all = [...presets.filter((p) => !saved.some((x) => x.text === p)).map((t) => ({ id: "", field, text: t })), ...saved];
  const canSave = value.trim() && !all.some((p) => p.text === value.trim());

  return (
    <div className="adm-copy">
      <label>
        <span>{label}</span>
        <input className="ui-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={fallback ?? "직접 입력하거나 아래에서 골라주세요"} />
      </label>
      <div className="adm-copy__chips">
        {all.map((p) => (
          <span key={p.id || p.text} className={`adm-chip${value === p.text ? " is-on" : ""}${p.id ? " is-saved" : ""}`}>
            <button type="button" onClick={() => onChange(value === p.text ? "" : p.text)}>
              {p.text}
            </button>
            {editing && p.id && (
              <>
                <button type="button" className="adm-chip__x" aria-label="수정" onClick={() => void edit(p)}>
                  ✎
                </button>
                <button type="button" className="adm-chip__x" aria-label="삭제" onClick={() => void del(p)}>
                  ×
                </button>
              </>
            )}
          </span>
        ))}
        {canSave && (
          <button type="button" className="adm-copy__save" onClick={() => void add()}>
            + 지금 문구 저장
          </button>
        )}
        {saved.length > 0 && (
          <button type="button" className="adm-copy__clear" onClick={() => setEditing((v) => !v)}>
            {editing ? "편집 끝" : "저장한 문구 편집"}
          </button>
        )}
        {value && (
          <button type="button" className="adm-copy__clear" onClick={() => onChange("")}>
            지우고 자동 문구 쓰기
          </button>
        )}
      </div>
      {path && <small className="adm-path">{path}</small>}
    </div>
  );
}

export function Detail({ r, onSaved }: { r: Row; onSaved: () => Promise<void> }) {
  const sb = getAdminSupabase();
  const [status, setStatus] = useState(r.status);
  const [visitAt, setVisitAt] = useState(toLocal(r.visit_at));
  const [visitNote, setVisitNote] = useState(r.visit_note ?? "");
  const [buildAt, setBuildAt] = useState(toLocal(r.build_at));
  const [buildNote, setBuildNote] = useState(r.build_note ?? "");
  const [kind, setKind] = useState<string>(r.build_scope?.includes("labor") ? "labor" : r.build_scope?.includes("delivery") ? "delivery" : r.build_scope?.length ? "material" : "");
  const [nextTitle, setNextTitle] = useState(r.next_title ?? "");
  const [nextDesc, setNextDesc] = useState(r.next_desc ?? "");
  const kindLabel = kind === "delivery" ? "배송" : kind === "material" ? "자재 준비" : "시공";
  const [doneNote, setDoneNote] = useState(r.completion_note ?? "");
  const [donePaths, setDonePaths] = useState<string[]>(r.completion_photos ?? []);
  const [doneUrls, setDoneUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [donePreview, setDonePreview] = useState(false);
  const [stage, setStage] = useState<Stage>(STAGE_OF[r.status] ?? "intake");
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

  // 완료 사진 미리보기 주소
  useEffect(() => {
    if (!sb || !donePaths.length) return;
    void sb.storage
      .from("quote-photos")
      .createSignedUrls(donePaths, 3600)
      .then(({ data }) => setDoneUrls(Object.fromEntries((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))));
  }, [sb, donePaths]);

  // 완료 사진 올리기: 고객 폴더 아래 complete/ (고객도 내 신청에서 볼 수 있음)
  const upload = async (files: FileList | null) => {
    if (!sb || !files?.length) return;
    setUploading(true);
    const added: string[] = [];
    for (const f of Array.from(files).slice(0, 10)) {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${r.user_id}/complete/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from("quote-photos").upload(path, f, { contentType: f.type });
      if (!error) added.push(path);
    }
    setDonePaths((p) => [...p, ...added]);
    setUploading(false);
    if (added.length < files.length) setDone("일부 사진을 올리지 못했어요 (jpg·png·webp, 10MB 이하).");
  };

  const save = async () => {
    if (!sb || busy) return;
    setBusy(true);
    setDone("");
    const { error } = await sb
      .from("quote_requests")
      .update({
        status,
        visit_at: fromLocal(visitAt),
        visit_note: visitNote || null,
        build_at: fromLocal(buildAt),
        build_note: buildNote || null,
        build_scope: kind ? (kind === "labor" ? ["material", "delivery", "labor"] : kind === "delivery" ? ["material", "delivery"] : ["material"]) : r.build_scope,
        next_title: nextTitle.trim() || null,
        next_desc: nextDesc.trim() || null,
        completion_note: doneNote || null,
        completion_photos: donePaths,
        completed_at: status === "completed" ? (r.completed_at ?? new Date().toISOString()) : r.completed_at,
      })
      .eq("id", r.id);
    setBusy(false);
    if (error) return setDone("저장하지 못했어요: " + error.message);
    setDone(status !== r.status && status !== "received" && status !== "checking" ? "저장했어요. 고객에게 안내 메일이 가요." : "저장했어요.");
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
        <h3>
          진행 관리 <small>지금 상태 · {LABEL[status]}</small>
        </h3>
        <ol className="adm-stages">
          {STAGES.map(([k, l], i) => {
            const cur = STAGE_OF[status] === k;
            const passed = STAGES.findIndex(([x]) => x === STAGE_OF[status]) > i;
            return (
              <li key={k}>
                <button className={`${stage === k ? "is-on" : ""}${cur ? " is-cur" : ""}${passed ? " is-done" : ""}`} onClick={() => setStage(k)}>
                  <b>{passed ? "✓" : i + 1}</b>
                  {l}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="adm-stage-desc">{STAGES.find(([k]) => k === stage)![2]}</p>
        <div className="adm-status">
          <span className="adm-status__k">이 단계 상태로 바꾸기</span>
          {STATUS.filter(([k]) => STAGE_STATUS[stage].includes(k)).map(([k, l]) => (
            <button key={k} className={`adm-st adm-st--${k}${status === k ? " is-on" : ""}`} onClick={() => setStatus(k)}>
              {l}
            </button>
          ))}
        </div>
        {stage === "intake" && (
          <dl className="adm-dl adm-check">
            <div>
              <dt>연락처</dt>
              <dd>
                {r.name} {r.phone}
              </dd>
            </div>
            <div>
              <dt>방문 주소</dt>
              <dd>{r.visit_address ? `✓ ${r.visit_address} ${r.visit_address_detail ?? ""}` : "아직 없음 · 고객이 내 신청에서 입력하거나 통화로 받아주세요"}</dd>
            </div>
            <div>
              <dt>다음 할 일</dt>
              <dd>내용 확인이 끝나면 &lsquo;실측&rsquo; 단계에서 날짜를 정해요.</dd>
            </div>
          </dl>
        )}

        {stage === "visit" && (
          <>
            <label className="adm-one">
              <span>실측 방문 일시</span>
              <input className="ui-input" type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} />
            </label>
            <CopyField
              field="visit_note"
              label="실측 안내 메모"
              path="고객 화면 › 방문 일정 › 실측 방문 카드 설명 · 실측 안내 메일"
              value={visitNote}
              onChange={setVisitNote}
              presets={["담당자가 방문해 30분 정도 크기와 바닥 상태를 확인해요.", "도착 10분 전에 전화드려요.", "주차할 곳이 있으면 미리 알려주세요."]}
              fallback="담당자가 방문해 작업할 곳의 크기와 바닥 상태를 확인해요."
            />
          </>
        )}

        {stage === "quote" && <p className="adm-note">아래 &lsquo;견적서&rsquo;에서 작성하고 [고객에게 보내기]를 누르면 상태가 견적 도착으로 바뀌어요. 고객이 보류를 고르면 보류가 돼요.</p>}

        {stage === "build" && (
          <>
            <div className="adm-grid">
              <label>
                <span>작업 종류</span>
                <select className="ui-input" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="">자동 (고객이 고른 범위·신청 범위)</option>
                  <option value="labor">시공</option>
                  <option value="delivery">배송</option>
                  <option value="material">자재 준비</option>
                </select>
                <small className="adm-path">고객 화면 › 방문 일정 › &lsquo;{kindLabel} 일정&rsquo; 카드 제목 · 홈 &lsquo;○월 ○일 {kindLabel} 예정&rsquo;</small>
              </label>
              <label>
                <span>{kindLabel} 일시</span>
                <input className="ui-input" type="datetime-local" value={buildAt} onChange={(e) => setBuildAt(e.target.value)} />
              </label>
            </div>
            <CopyField
              field={`build_note_${kind || "auto"}`}
              label={`${kindLabel} 안내 메모`}
              path={`고객 화면 › 방문 일정 › ${kindLabel} 일정 카드 설명 · 홈 '지금 할 일' 설명 · 일정 안내 메일`}
              value={buildNote}
              onChange={setBuildNote}
              presets={
                kind === "delivery"
                  ? ["도착 30분 전에 기사님이 전화드려요.", "대문 앞에 내려드려요. 받으실 분이 없으면 미리 알려주세요.", "오전 중 도착 예정이에요."]
                  : kind === "material"
                    ? ["자재가 준비되면 받으실 방법을 안내드려요.", "준비된 자재는 사진으로 먼저 보여드려요."]
                    : ["오전 9시에 도착해 하루 동안 작업해요.", "작업 전날 시간을 다시 알려드려요.", "비가 오면 일정을 다시 맞춰 연락드려요."]
              }
              fallback="비우면 작업 종류에 맞는 기본 안내가 보여요."
            />
          </>
        )}

        <div className="adm-custom">
          <h4>
            고객 홈 &lsquo;지금 할 일&rsquo; <small>비우면 상태에 맞는 자동 문구가 보여요</small>
          </h4>
          <p className="adm-path">고객 화면 › 홈 › 가장 최근 신청 카드 아래 검은 띠</p>
          <CopyField
            field="next_title"
            label="제목"
            value={nextTitle}
            onChange={setNextTitle}
            presets={[
              buildAt ? `${fmtShort(buildAt)} ${kindLabel} 예정이에요` : `${kindLabel} 날짜를 정하고 있어요`,
              "담당자가 곧 연락드릴게요",
              kind === "delivery" ? "자재를 준비해 배송을 기다리고 있어요" : "작업을 준비하고 있어요",
            ]}
          />
          <CopyField
            field="next_desc"
            label="설명"
            value={nextDesc}
            onChange={setNextDesc}
            presets={["궁금한 점은 카카오톡 채널 @테두리로 물어보세요.", "일정이 바뀌면 바로 알려드릴게요.", buildNote || "견적서 내용대로 준비해요."]}
          />
          <div className="adm-live">
            <p className="adm-live__head">미리보기 · 고객 홈</p>
            <div className="dash-focus__next">
              <div>
                <strong>{nextTitle || "(자동 문구)"}</strong>
                <span>{nextTitle ? nextDesc : "상태에 맞는 안내가 보여요"}</span>
              </div>
            </div>
          </div>
        </div>
        {stage === "complete" && (
          <div className="adm-done">
            <h4>완료 보고 <small>고객의 내 신청에 보여요</small></h4>
            <label>
              <span>남길 말 (관리법 안내 등)</span>
              <textarea className="ui-input" rows={3} value={doneNote} onChange={(e) => setDoneNote(e.target.value)} placeholder="예: 잔디는 첫 2주 동안 아침마다 물을 흠뻑 주세요." />
            </label>
            <div className="adm-done__photos">
              {donePaths.map((p) => (
                <figure key={p}>
                  {doneUrls[p] ? <img src={doneUrls[p]} alt="" /> : <span>불러오는 중</span>}
                  <button className="adm-btn adm-btn--danger" onClick={() => setDonePaths((x) => x.filter((y) => y !== p))}>
                    빼기
                  </button>
                </figure>
              ))}
              <label className="adm-done__add">
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void upload(e.target.files)} />
                {uploading ? "올리는 중…" : "+ 완료 사진"}
              </label>
            </div>
            {donePreview && (
              <div className="adm-preview">
                <p className="adm-preview__head">
                  고객에게 이렇게 보여요 <small>저장 전 내용 기준</small>
                </p>
                <CompletionCard note={doneNote || null} photos={donePaths.map((p) => ({ path: p, url: doneUrls[p] ?? null }))} at={r.completed_at ?? new Date().toISOString()} />
              </div>
            )}
            <div className="adm-done__bar">
              <button className="adm-btn" onClick={() => setDonePreview((v) => !v)}>
                {donePreview ? "미리보기 닫기" : "미리보기"}
              </button>
              <button className="adm-btn" disabled={busy || uploading} onClick={() => void save()}>
                {r.completion_note || (r.completion_photos ?? []).length ? "완료 보고 수정 저장" : "완료 보고 저장"}
              </button>
            </div>
            <p className="adm-note">
              {status === "completed"
                ? "완료 상태라 고객의 내 신청 홈 맨 위에 바로 보여요."
                : "지금은 진행 확정이라 고객에게 아직 안 보여요. 상태를 '완료'로 바꿔 저장하면 공개되고 완료 안내 메일이 가요."}
            </p>
          </div>
        )}
        <div className="adm-save">
          {done && <span>{done}</span>}
          <button className="btn btn--primary" disabled={busy || uploading} onClick={() => void save()}>
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      {stage === "quote" && <EstimateEditor quoteId={r.id} status={status} onSent={async () => (setStatus("quoted"), await onSaved())} />}

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
