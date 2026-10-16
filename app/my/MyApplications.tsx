"use client";

import Link from "next/link";
import { MyDashboard } from "./[id]/QuoteDetail";
import { useCallback, useEffect, useState } from "react";
import { Callout, type QuoteStatus } from "../_components/ui";
import { isSupabaseConfigured, getSupabase } from "../../lib/supabase";
import { QuoteApiError, quoteApi } from "../../lib/quote-api";
import { touchActivity, useIdleSignOut } from "../../lib/idle";

type QuoteRow = {
  id: string;
  receipt_no: string | null;
  region: string;
  district: string;
  housing: string;
  works: string[];
  works_unknown: boolean;
  status: QuoteStatus;
  build_at?: string | null;
  created_at: string;
};

const PAGE_SIZE = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_VALUES = new Set<QuoteStatus>(["received", "checking", "visit", "needs", "quoted", "done", "hold", "canceled"]);

function safeStatus(value: string): QuoteStatus {
  return STATUS_VALUES.has(value as QuoteStatus) ? (value as QuoteStatus) : "received";
}


export function MyApplications() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [phase, setPhase] = useState<"email" | "verify" | "list">("email");
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // 상세에서 삭제하고 돌아왔을 때 (/my?deleted=접수번호) 한 번 안내
  const [deleted, setDeleted] = useState<string | null>(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("deleted");
    if (v === null) return;
    setDeleted(v);
    window.history.replaceState(null, "", "/my");
  }, []);


  const loadList = async (nextPage = 1) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setBusy(true);
    setError("");
    // 목록은 서버(Route Handler)에서 본인 신청만 최신순 10건씩
    try {
      const data = await quoteApi<{ email: string; items: QuoteRow[]; total: number; page: number }>(`?page=${nextPage}`);
      setVerifiedEmail(data.email);
      setRows(data.items.map((row) => ({ ...row, status: safeStatus(row.status) })));
      setTotal(data.total);
      setPage(data.page);
      setPhase("list");
    } catch (e) {
      if (e instanceof QuoteApiError && e.status === 401) {
        setPhase("email");
        setRows([]);
        setError(e.detail.code === "idle" ? e.message : "이메일 인증이 만료됐어요. 다시 확인해주세요.");
      } else {
        setError(e instanceof QuoteApiError ? e.message : "신청 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) void loadList(1);
    });
    // 초기 세션이 있으면 인증을 다시 요구하지 않고 본인 목록을 보여준다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setError("현재 접수 조회 설정이 준비되지 않았어요.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    if (otpError) {
      setError("확인 메일을 보내지 못했어요. 이메일 주소를 확인하고 다시 시도해주세요.");
    } else {
      setEmail(normalizedEmail);
      setPhase("verify");
      setNotice(`${normalizedEmail}로 확인 코드를 보냈어요.`);
    }
    setBusy(false);
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("메일로 받은 확인 코드를 입력해주세요.");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;

    setBusy(true);
    setError("");
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    if (verifyError) {
      setError("확인 코드가 맞지 않거나 만료됐어요. 코드를 확인해주세요.");
    } else {
      setCode("");
      touchActivity(); // 새로 인증했으니 1시간을 지금부터 셈
      await loadList(1);
    }
    setBusy(false);
  };

  // 로그아웃: 인증 세션을 끝내야 다시 열었을 때 이전 목록이 보이지 않음
  const reset = async (message = "") => {
    await getSupabase()?.auth.signOut();
    setPhase("email");
    setCode("");
    setRows([]);
    setTotal(0);
    setError(message);
    setNotice("");
  };

  // 목록을 띄워 둔 채 1시간이 지나면 자동 로그아웃
  const onIdle = useCallback(() => {
    void reset("1시간 동안 사용하지 않아 로그아웃됐어요. 이메일을 다시 확인해주세요.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useIdleSignOut(onIdle);


  return (
    <div className={`my-applications${phase === "list" ? " is-dash" : ""}`}>
      {phase !== "list" && (
        <header className="my-intro">
          <h1 className="title-l">신청 내용은<br />안전하게 확인해요.</h1>
          <p className="lead">신청 이메일로 확인 코드를 받은 뒤, 내 견적 신청을 확인할 수 있어요.</p>
        </header>
      )}

      {phase === "email" && (
        <section className="my-panel" aria-labelledby="my-auth-title">
          <p className="my-eyebrow">MY APPLICATIONS</p>
          <h2 id="my-auth-title" className="my-panel__title">신청 내역을 확인할게요.</h2>
          <p className="my-panel__text">신청할 때 입력한 이메일로 확인 코드를 보내드려요. 코드를 입력하면 내 신청만 볼 수 있어요.</p>
          <form className="my-form" onSubmit={sendCode}>
            <label className="my-field">
              <span>신청 이메일</span>
              <input type="email" autoComplete="email" inputMode="email" placeholder="신청할 때 입력한 이메일" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            {error && <p className="my-error" role="alert">{error}</p>}
            {!isSupabaseConfigured && <p className="my-note">현재는 미리보기 상태예요. 배포 환경변수가 연결되면 이메일 확인을 시작할 수 있어요.</p>}
            <button className="btn btn--primary" type="submit" disabled={busy || !isSupabaseConfigured}>{busy ? "보내는 중…" : "확인 코드 받기"}</button>
          </form>
          <p className="my-panel__hint">접수번호만으로는 신청 내용을 확인할 수 없어요.</p>
        </section>
      )}

      {phase === "verify" && (
        <section className="my-panel" aria-labelledby="my-verify-title">
          <p className="my-eyebrow">EMAIL CHECK</p>
          <h2 id="my-verify-title" className="my-panel__title">이메일을 확인해주세요.</h2>
          <p className="my-panel__text">{notice || `${email}로 받은 확인 코드를 입력해주세요.`}</p>
          <form className="my-form" onSubmit={verifyCode}>
            <label className="my-field">
              <span>확인 코드</span>
              <input className="my-code" inputMode="numeric" autoComplete="one-time-code" placeholder="메일로 받은 코드" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required />
            </label>
            {error && <p className="my-error" role="alert">{error}</p>}
            <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? "확인 중…" : "내 신청 확인하기"}</button>
            <button className="my-link" type="button" onClick={() => void reset()}>이메일 다시 입력</button>
          </form>
        </section>
      )}

      {phase === "list" && (
        <>
          {deleted !== null && (
            <Callout tone="success" title="신청을 삭제했어요">
              {deleted ? `${deleted} 신청과 올린 사진을 지웠어요.` : "신청과 올린 사진을 지웠어요."}
            </Callout>
          )}
          {error && <Callout tone="danger" title="조회할 수 없어요">{error}</Callout>}
          <MyDashboard
            email={verifiedEmail}
            rows={rows}
            total={total}
            initialId={typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("id")}
            onLogout={() => void reset()}
            onListChange={() => loadList(1)}
          />
        </>
      )}

      {phase !== "list" && (
        <div className="btn-row my-auth-links">
          <Link href="/contact" className="btn btn--secondary">
            신청 이메일을 찾기 어려워요
          </Link>
          <Link href="/quote" className="btn btn--primary">
            새 견적 신청하기
          </Link>
        </div>
      )}
    </div>
  );
}
