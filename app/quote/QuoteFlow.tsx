"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DISTRICTS, REGIONS, type Region } from "@/lib/districts";
import {
  HOUSING_TYPES,
  MAX_PHOTOS,
  SCOPES,
  STEPS,
  TIMINGS,
  WISH_EXAMPLES,
  VISITS,
  BUDGET_STEPS,
  budgetLabel,
  WORK_TYPES,
  emptyAnswers,
  type Answers,
  type Step,
} from "@/lib/quote";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { QuoteApiError, quoteApi } from "@/lib/quote-api";
import { checkPhotos, formatPhone, PHONE_RE, PHOTO_ACCEPT, shrinkPhoto } from "@/lib/photo";
import { touchActivity } from "@/lib/idle";
import { PrivacyContent } from "../_components/legal/PrivacyContent";
import { TermsContent } from "../_components/legal/TermsContent";

const STORAGE_KEY = "teduri-quote-v1";
const KAKAO_URL = "https://pf.kakao.com/_HeKBX";
// 접수 완료 화면: 진행 단계 (이용 안내 노선도와 같은 이름)
const DONE_TRACK = ["접수", "확인", "실측", "견적", "결정", "완료"];
const MORE_LINKS = [
  { href: "/service", name: "서비스 소개", desc: "식재부터 화단까지, 작업별 사진 보기", img: "/service/work-bed.webp" },
  { href: "/guide", name: "이용 안내", desc: "견적을 받은 뒤 진행되는 과정", img: "/guide/hero-shot.webp" },
];
// 예산 눈금 막대 높이(%) — 장식용
const BAR_H = [34, 48, 60, 74, 88, 100, 90, 76, 62, 48, 36];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Photo = { id: string; file: File; url: string };
type Phase = Step | "outside" | "done";

// 진행 표시에 쓰는 단계 수 (확인 코드 단계는 이메일 단계에 포함)
const COUNTED: readonly Step[] = STEPS.filter((s) => s !== "verify");

function BackIcon() {
  return (
    <svg className="q-back__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 8H3m4-4L3 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="q-check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function authErrorMessage(message: string) {
  if (/rate limit|too many|security purposes/i.test(message)) return "잠시 후 다시 시도해주세요. 짧은 시간에 요청이 많았어요.";
  if (/expired|invalid/i.test(message)) return "확인 코드가 맞지 않거나 시간이 지났어요. 다시 확인해주세요.";
  return "지금은 처리하지 못했어요. 잠시 후 다시 시도해주세요.";
}

export function QuoteFlow({ initialWorks }: { initialWorks: string[] }) {
  const [answers, setAnswers] = useState<Answers>(() => ({ ...emptyAnswers(), works: initialWorks }));
  const [phase, setPhase] = useState<Phase>("region");
  const [returnToReview, setReturnToReview] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [restored, setRestored] = useState(false);

  // 단계별 입력 임시값
  const [districtQuery, setDistrictQuery] = useState("");
  const [sizeDraft, setSizeDraft] = useState("");
  const [wishDraft, setWishDraft] = useState("");
  const [budgetDraft, setBudgetDraft] = useState("");
  const [wishPicks, setWishPicks] = useState<string[]>([]);
  const [budgetIdx, setBudgetIdx] = useState(3);
  const [budgetOther, setBudgetOther] = useState(false);
  const [timingPick, setTimingPick] = useState(false);
  const [timingDate, setTimingDate] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [code, setCode] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [openDoc, setOpenDoc] = useState<"privacy" | "terms" | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [receiptNo, setReceiptNo] = useState("");
  const [quoteId, setQuoteId] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 새로고침해도 답변이 남도록 (사진 제외)
  useEffect(() => {
    // 개발 중에만: /quote?preview=done 으로 접수 완료 화면 미리보기
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).get("preview") === "done") {
      setAnswers({ ...emptyAnswers(), region: "경기", district: "용인시", works: ["디딤석", "화단"], scope: "시공까지", timing: "한 달 안에", budget: "300만 원 안팎", email: "example@email.com" });
      setReceiptNo("TD-260101-0001");
      setPhase("done");
      setRestored(true);
      return;
    }
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { answers: Answers; phase: Phase };
        if (parsed.phase !== "done") {
          setAnswers({ ...parsed.answers, works: initialWorks.length ? initialWorks : parsed.answers.works });
          setPhase(parsed.phase === "verify" ? "email" : parsed.phase);
        }
      }
    } catch {}
    setRestored(true);
  }, [initialWorks]);

  useEffect(() => {
    if (!restored || phase === "done") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, phase }));
    } catch {}
  }, [answers, phase, restored]);

  // 단계가 바뀌면 질문으로 초점 이동
  useEffect(() => {
    setError("");
    if (restored) headingRef.current?.focus();
    if (phase === "size") setSizeDraft(answers.size ?? "");
    if (phase === "wish") {
      // 고른 예시는 칩으로, 나머지 글은 입력칸으로 되돌림
      const picks = answers.wishPicks ?? [];
      setWishPicks(picks);
      const rest = (answers.wish ?? "").split("\n").filter((l) => !picks.includes(l) && l !== "상담하며 정할게요");
      setWishDraft(rest.join("\n"));
    }
    if (phase === "budget") {
      const k = BUDGET_STEPS.findIndex((_, i) => budgetLabel(i) === answers.budget);
      setBudgetOther(!!answers.budget && k < 0);
      setBudgetDraft(k < 0 ? (answers.budget ?? "") : "");
      if (k >= 0) setBudgetIdx(k);
    }
    if (phase === "timing") setTimingPick(false);
    if (phase === "email") setEmailDraft(answers.email ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  const update = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));

  const goNext = (from: Step) => {
    if (returnToReview && from !== "email" && from !== "verify") {
      setReturnToReview(false);
      setPhase("review");
      return;
    }
    const i = STEPS.indexOf(from);
    setPhase(STEPS[i + 1]);
  };

  const goBack = () => {
    if (phase === "outside") return setPhase("region");
    if (returnToReview) {
      setReturnToReview(false);
      return setPhase("review");
    }
    const i = STEPS.indexOf(phase as Step);
    if (i > 0) setPhase(STEPS[phase === "review" ? i - 2 : i - 1]);
  };

  const editFromReview = (step: Step) => {
    setReturnToReview(step !== "email");
    setPhase(step);
  };

  const progressIndex = phase === "verify" ? COUNTED.indexOf("email") : COUNTED.indexOf(phase as Step);

  // ---------- 이메일 확인 ----------

  const sendCode = async () => {
    const email = emailDraft.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return setError("이메일 주소를 다시 확인해주세요.");
    const supabase = getSupabase();
    if (!supabase) return setError("접수 설정이 아직 끝나지 않았어요. 운영자가 설정을 마치면 신청할 수 있어요.");

    setBusy(true);
    setError("");
    // 이미 같은 이메일로 확인을 마쳤다면 바로 다음으로
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user.email?.toLowerCase() === email) {
      update({ email });
      setBusy(false);
      setPhase("review");
      return;
    }
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    touchActivity(); // 접수 직후 내 신청에서 1시간을 지금부터 셈
    update({ email });
    setCode("");
    setNotice("");
    setResendIn(60);
    setPhase("verify");
  };

  const resendCode = async () => {
    const supabase = getSupabase();
    if (!supabase || !answers.email || resendIn > 0) return;
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email: answers.email, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    touchActivity(); // 접수 직후 내 신청에서 1시간을 지금부터 셈
    setNotice("확인 메일을 다시 보냈어요.");
    setResendIn(60);
  };

  const verifyCode = async () => {
    const supabase = getSupabase();
    const token = code.replace(/\D/g, "");
    if (!supabase || !answers.email) return;
    if (token.length < 6) return setError("메일로 받은 확인 코드를 모두 입력해주세요.");
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({ email: answers.email, token, type: "email" });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    touchActivity(); // 접수 직후 내 신청에서 1시간을 지금부터 셈
    setPhase("review");
  };

  // ---------- 사진 ----------

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    // 형식(JPG·PNG·WebP) · 크기(장당 10MB) · 개수(5장) 확인
    const checked = checkPhotos(Array.from(files), MAX_PHOTOS - photos.length);
    const picked = checked.ok.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    setError(checked.error);
    if (picked.length) {
      setPhotos((p) => [...p, ...picked]);
      update({ noPhoto: false });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (id: string) =>
    setPhotos((p) => {
      const hit = p.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return p.filter((x) => x.id !== id);
    });

  // ---------- 제출 ----------

  const submit = async () => {
    const supabase = getSupabase();
    if (!supabase) return setError("접수 설정이 아직 끝나지 않았어요.");
    if (answers.name.trim().length < 2) return setError("이름을 입력해주세요.");
    if (!PHONE_RE.test(answers.phone.replace(/-/g, ""))) return setError("휴대전화 번호를 다시 확인해주세요. 예: 010-1234-5678");
    if (!answers.visit) return setError("방문 실측 방식을 골라주세요.");
    if (!agreePrivacy || !agreeTerms) return setError("필수 확인 사항을 읽고 선택해주세요.");
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session || session.user.email?.toLowerCase() !== answers.email) {
      setError("이메일 확인이 필요해요. 이메일을 다시 확인해주세요.");
      return setPhase("email");
    }

    setBusy(true);
    setError("");
    try {
      const uid = session.user.id;
      const photoPaths: string[] = [];
      for (const p of photos) {
        const blob = await shrinkPhoto(p.file);
        const path = `${uid}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("quote-photos")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw new Error("photo");
        photoPaths.push(path);
      }

      // 등록은 서버(Route Handler)에서 검증한 뒤 저장
      const data = await quoteApi<{ id: string; receipt_no: string }>("", {
        method: "POST",
        body: JSON.stringify({
          region: answers.region,
          district: answers.district,
          housing: answers.housing,
          works: answers.worksUnknown ? [] : answers.works,
          works_unknown: answers.worksUnknown,
          scope: answers.scope,
          photo_paths: photoPaths,
          size_note: answers.sizeUnknown ? null : answers.size || null,
          wish: [`방문: ${answers.visit}`, answers.wish].filter(Boolean).join("\n") || null,
          timing: answers.timing,
          budget: answers.budgetUndecided ? null : answers.budget || null,
          name: answers.name.trim(),
          phone: answers.phone.trim(),
          agreed: agreePrivacy && agreeTerms,
        }),
      });

      // 접수 확인 메일 (실패해도 접수는 완료)
      fetch("/api/quote-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id: data.id }),
      }).catch(() => {});

      setReceiptNo(data.receipt_no);
      setQuoteId(data.id);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      setPhase("done");
    } catch (e) {
      setError(
        e instanceof QuoteApiError && e.detail.fields
          ? Object.values(e.detail.fields)[0]
          : e instanceof QuoteApiError
            ? e.message
            : e instanceof Error && e.message === "photo"
              ? "사진을 올리지 못했어요. 사진을 빼거나 JPG·PNG로 바꿔 다시 시도해주세요."
              : "신청을 접수하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setBusy(false);
    }
  };

  // ---------- 화면 조각 ----------

  const worksLabel = answers.worksUnknown ? "아직 어떤 작업인지 모르겠어요" : answers.works.join(", ");
  const history = useMemo(() => {
    const rows: { step: Step; label: string; value: string }[] = [];
    if (answers.region && answers.district) rows.push({ step: "district", label: "지역", value: `${answers.region} ${answers.district}` });
    if (answers.housing) rows.push({ step: "housing", label: "주거 형태", value: answers.housing });
    if (answers.works.length || answers.worksUnknown) rows.push({ step: "works", label: "작업", value: worksLabel });
    if (answers.scope) rows.push({ step: "scope", label: "맡길 범위", value: answers.scope });
    return rows;
  }, [answers, worksLabel]);

  const visibleHistory = (() => {
    const idx = STEPS.indexOf(phase as Step);
    if (idx < 0 || phase === "review") return [];
    return history.filter((h) => STEPS.indexOf(h.step) < idx).slice(-3);
  })();

  const Option = ({ label, selected, onClick }: { label: string; selected?: boolean; onClick: () => void }) => (
    <button type="button" className="q-option" aria-pressed={selected} onClick={onClick}>
      {label}
      {selected && <CheckIcon />}
    </button>
  );

  const Back = ({ label = "이전 답변" }: { label?: string }) => (
    <button type="button" className="q-back" onClick={goBack}>
      <BackIcon /> {label}
    </button>
  );

  const Question = ({ title, hint }: { title: string; hint?: string }) => (
    <div className="q-question">
      <h1 ref={headingRef} tabIndex={-1} className="q-title">
        {title}
      </h1>
      {hint && <p className="q-hint">{hint}</p>}
    </div>
  );

  const ErrorText = () =>
    error ? (
      <p className="q-error" role="alert">
        {error}
      </p>
    ) : null;

  // 처음 그릴 때도 첫 질문을 바로 보여줌 (검색 로봇·느린 연결에서 빈 화면이 되지 않게). 이어 쓰기는 곧바로 이어서 열림

  if (phase === "done") {
    const summary = [
      ["지역", [answers.region, answers.district].filter(Boolean).join(" ")],
      ["작업", answers.worksUnknown ? "상담하며 정할게요" : answers.works.join(", ")],
      ["맡길 범위", answers.scope],
      ["희망 시기", answers.timing],
      ["예산", answers.budgetUndecided ? "아직 정하지 않았어요" : answers.budget],
    ].filter(([, v]) => v) as [string, string][];
    return (
      <div className="q-shell q-done">
        <div className="q-done__mark" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" pathLength={1} />
            <path d="M15 27 23 34 38 18" pathLength={1} />
          </svg>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="q-title">
          신청이 접수됐어요.
        </h1>
        <p className="q-receipt">
          접수번호 <strong>{receiptNo}</strong>
        </p>

        {/* 지금 어디쯤인지: 다음 단계가 깜빡임 */}
        <ol className="q-track" aria-label="진행 상황">
          {DONE_TRACK.map((t, i) => (
            <li key={t} className={i === 0 ? "is-done" : i === 1 ? "is-now" : ""} style={{ "--i": i } as React.CSSProperties}>
              <span className="q-track__dot" aria-hidden="true">
                {i === 0 && <CheckIcon />}
              </span>
              <span className="q-track__name">{t}</span>
              {i === 1 && <span className="q-track__now">진행 중</span>}
            </li>
          ))}
        </ol>

        <ol className="q-next">
          <li>
            <strong>접수 확인</strong>
            <span>{answers.email}로 접수 확인 메일을 보냈어요. 메일이 보이지 않으면 스팸함을 확인해주세요.</span>
          </li>
          <li>
            <strong>운영자 첫 연락</strong>
            <span>24시간 안에 첫 연락을 드려요. 밤에 신청하셨다면 다음 날 연락드려요.</span>
          </li>
          <li>
            <strong>업체 제공 동의</strong>
            <span>업체에 정보를 전달하기 전에 업체명과 전달할 내용을 먼저 알려드리고 따로 동의를 받아요.</span>
          </li>
        </ol>

        {summary.length > 0 && (
          <dl className="q-sum">
            <p className="q-sum__head">신청 내용</p>
            {summary.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="q-hint">사진을 더하거나 내용을 바꾸려면 내 신청에서 바로 고칠 수 있어요.</p>
        <div className="q-help">
          <Link href={quoteId ? `/my/${quoteId}/edit` : "/my"} className="q-help__card">
            <span className="q-help__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
                <path d="m13.5 6.5 4 4" />
              </svg>
            </span>
            <strong>신청 수정하기</strong>
            <span>사진·요청사항·연락처를 바로 고칠 수 있어요.</span>
          </Link>
          <a href={KAKAO_URL} target="_blank" rel="noopener noreferrer" className="q-help__card q-help__card--kakao">
            <span className="q-help__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4C6.9 4 3 7.2 3 11.1c0 2.5 1.6 4.6 4.1 5.9l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .9.1 1.3.1 5.1 0 9-3.2 9-7.1S17.1 4 12 4Z" />
              </svg>
            </span>
            <strong>카카오톡 채널 문의</strong>
            <span>테두리 채널에서 바로 물어보세요.</span>
          </a>
        </div>

        <div className="q-more">
          <p className="q-more__head">기다리는 동안 둘러보기</p>
          <div className="q-more__list">
            {MORE_LINKS.map((m) => (
              <Link key={m.href} href={m.href} className="q-more__card">
                <img src={m.img} alt="" loading="lazy" width={600} height={400} />
                <strong>{m.name}</strong>
                <span>{m.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        <Link href="/" className="btn btn--secondary">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="q-shell">
      <div className="q-progress">
        <span>무료 견적 요청</span>
        {progressIndex >= 0 && (
          <span className="q-progress__count">
            {progressIndex + 1} / {COUNTED.length}
          </span>
        )}
        {progressIndex >= 0 && (
          <span className="q-progress__bar" aria-hidden="true">
            <span style={{ width: `${((progressIndex + 1) / COUNTED.length) * 100}%` }} />
          </span>
        )}
      </div>

      {visibleHistory.length > 0 && (
        <ul className="q-history" aria-label="지금까지의 답변">
          {visibleHistory.map((h) => (
            <li key={h.step}>
              <button type="button" className="q-bubble" onClick={() => setPhase(h.step)}>
                <span className="q-bubble__label">{h.label}</span>
                {h.value}
                <span className="q-bubble__edit">수정</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div key={phase} className="q-step">
      {phase === "region" && (
        <>
          <Question title="어느 지역의 정원인가요?" hint="서울·경기·인천에서 요청할 수 있어요." />
          <div className="q-options">
            {REGIONS.map((r) => (
              <Option
                key={r}
                label={r}
                selected={answers.region === r}
                onClick={() => {
                  if (answers.region !== r) update({ region: r, district: undefined });
                  setDistrictQuery("");
                  setPhase("district");
                }}
              />
            ))}
            <Option label="그 밖의 지역" onClick={() => setPhase("outside")} />
          </div>
          <Link href="/" className="q-back">
            <BackIcon /> 홈으로
          </Link>
        </>
      )}

      {phase === "outside" && (
        <>
          <Question
            title="현재는 수도권에서 시작해요."
            hint="지금은 서울·경기·인천의 요청을 받고 있어요. 서비스 지역이 넓어지면 안내할게요."
          />
          <Link href="/contact" className="btn btn--secondary q-wide">
            문의하기
          </Link>
          <Back />
        </>
      )}

      {phase === "district" && answers.region && (
        <>
          <Question title="어느 시·군·구인가요?" hint="정확한 주소는 지금 받지 않아요." />
          <label className="q-field">
            <span className="sr-only">시·군·구 검색</span>
            <input
              type="search"
              className="q-input"
              placeholder="시·군·구 검색"
              value={districtQuery}
              onChange={(e) => setDistrictQuery(e.target.value)}
            />
          </label>
          <div className="q-grid q-grid--district">
            {DISTRICTS[answers.region as Region]
              .filter((d) => d.includes(districtQuery.trim()))
              .map((d) => (
                <Option
                  key={d}
                  label={d}
                  selected={answers.district === d}
                  onClick={() => {
                    update({ district: d });
                    goNext("district");
                  }}
                />
              ))}
          </div>
          {DISTRICTS[answers.region as Region].every((d) => !d.includes(districtQuery.trim())) && (
            <p className="q-hint">찾는 지역이 없어요. 이름을 다시 확인해주세요.</p>
          )}
          <button type="button" className="q-back" onClick={() => setPhase("region")}>
            <BackIcon /> 지역 다시 선택
          </button>
        </>
      )}

      {phase === "housing" && (
        <>
          <Question title="어떤 집의 공간인가요?" />
          <div className="q-options">
            {HOUSING_TYPES.map((h) => (
              <Option
                key={h}
                label={h}
                selected={answers.housing === h}
                onClick={() => {
                  update({ housing: h });
                  goNext("housing");
                }}
              />
            ))}
          </div>
          <Back />
        </>
      )}

      {phase === "works" && (
        <>
          <Question title="어떤 부분을 바꾸고 싶으세요?" hint="여러 개를 함께 고를 수 있어요." />
          <div className="q-grid">
            {WORK_TYPES.map((w) => {
              const on = !answers.worksUnknown && answers.works.includes(w);
              return (
                <Option
                  key={w}
                  label={w}
                  selected={on}
                  onClick={() =>
                    update({
                      worksUnknown: false,
                      works: on ? answers.works.filter((x) => x !== w) : [...answers.works, w],
                    })
                  }
                />
              );
            })}
          </div>
          <Option
            label="아직 어떤 작업인지 모르겠어요"
            selected={answers.worksUnknown}
            onClick={() => update({ worksUnknown: !answers.worksUnknown })}
          />
          <ErrorText />
          <button
            type="button"
            className="btn btn--primary q-wide"
            onClick={() =>
              answers.worksUnknown || answers.works.length
                ? goNext("works")
                : setError("바꾸고 싶은 작업을 하나 이상 골라주세요.")
            }
          >
            이 조합으로 다음
          </button>
          <Back />
        </>
      )}

      {phase === "scope" && (
        <>
          <Question title="어디까지 맡기고 싶으세요?" hint="직접 할 부분은 남기고, 필요한 만큼 맡겨요." />
          <div className="q-options">
            {SCOPES.map((s) => (
              <Option
                key={s}
                label={s}
                selected={answers.scope === s}
                onClick={() => {
                  update({ scope: s });
                  goNext("scope");
                }}
              />
            ))}
          </div>
          <Back />
        </>
      )}

      {phase === "photos" && (
        <>
          <Question title="바꾸고 싶은 곳을 보여주세요." hint="작업할 곳과 주변이 함께 보이면 좋아요." />
          <input
            ref={fileRef}
            id="q-photo-input"
            type="file"
            accept={PHOTO_ACCEPT}
            multiple
            className="sr-only"
            onChange={(e) => addPhotos(e.target.files)}
          />
          {photos.length > 0 && (
            <ul className="q-photos">
              {photos.map((p, i) => (
                <li key={p.id}>
                  <img src={p.url} alt={`올린 사진 ${i + 1}`} />
                  <button type="button" onClick={() => removePhoto(p.id)} aria-label={`사진 ${i + 1} 빼기`}>
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {photos.length < MAX_PHOTOS && (
            <label htmlFor="q-photo-input" className="q-option q-upload">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="q-check">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {photos.length ? `사진 더 올리기 (${photos.length}/${MAX_PHOTOS})` : "사진 올리기"}
            </label>
          )}
          <ErrorText />
          {photos.length > 0 ? (
            <button type="button" className="btn btn--primary q-wide" onClick={() => goNext("photos")}>
              사진 {photos.length}장으로 다음
            </button>
          ) : (
            <>
              <Option
                label="지금은 사진이 없어요"
                selected={answers.noPhoto}
                onClick={() => {
                  update({ noPhoto: true });
                  goNext("photos");
                }}
              />
              <p className="q-hint">사진이 없으면 접수 후 필요한 자료를 안내해요.</p>
            </>
          )}
          <Back />
        </>
      )}

      {phase === "size" && (
        <>
          <Question title="공간의 크기는 어느 정도인가요?" hint="대략적이어도 괜찮아요." />
          <label className="q-field">
            <span className="sr-only">대략적인 크기</span>
            <textarea
              className="q-input q-textarea"
              rows={3}
              maxLength={300}
              placeholder="예: 길이 약 3m, 나무 2그루"
              value={sizeDraft}
              onChange={(e) => setSizeDraft(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn--primary q-wide"
            disabled={!sizeDraft.trim()}
            onClick={() => {
              update({ size: sizeDraft.trim(), sizeUnknown: false });
              goNext("size");
            }}
          >
            이 크기로 다음
          </button>
          <Option
            label="아직 모르겠어요"
            selected={answers.sizeUnknown}
            onClick={() => {
              update({ size: "", sizeUnknown: true });
              goNext("size");
            }}
          />
          <Back />
        </>
      )}

      {phase === "wish" && (
        <>
          <Question title="어떤 모습이면 좋겠어요?" hint="원하는 모습을 편한 말로 적어주세요." />
          <p className="q-pick-label">
            <span className="q-pick-badge">여러 개 선택 가능</span>
            가까운 예시를 눌러 고르고, 더 적고 싶은 말은 아래에 적어주세요.
          </p>
          <div className="q-chips" role="group" aria-label="원하는 모습 예시">
            {WISH_EXAMPLES.map((w) => {
              const on = wishPicks.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  className={`q-chip${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  onClick={() => setWishPicks((p) => (on ? p.filter((x) => x !== w) : [...p, w]))}
                >
                  <span className="q-chip__mark" aria-hidden="true">
                    {on ? <CheckIcon /> : "+"}
                  </span>
                  {w}
                </button>
              );
            })}
          </div>
          <label className="q-field">
            <span className="sr-only">원하는 모습</span>
            <textarea
              className="q-input q-textarea"
              rows={4}
              maxLength={1000}
              placeholder="예: 비가 오면 현관 앞 흙을 밟게 돼요. 이 길에 디딤석을 놓고 싶어요."
              value={wishDraft}
              onChange={(e) => setWishDraft(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn--primary q-wide"
            disabled={!wishDraft.trim() && wishPicks.length === 0}
            onClick={() => {
              update({ wish: [...wishPicks, wishDraft.trim()].filter(Boolean).join("\n"), wishPicks });
              goNext("wish");
            }}
          >
            {wishPicks.length > 0 ? `${wishPicks.length}개 고르고 다음` : "이렇게 적고 다음"}
          </button>
          <Option
            label="상담하며 정할게요"
            selected={answers.wish === "상담하며 정할게요"}
            onClick={() => {
              update({ wish: "상담하며 정할게요", wishPicks: [] });
              goNext("wish");
            }}
          />
          <Back />
        </>
      )}

      {phase === "timing" && (
        <>
          <Question title="언제쯤 진행하고 싶으세요?" />
          <div className="q-options">
            {TIMINGS.map((t) => (
              <Option
                key={t}
                label={t}
                selected={answers.timing === t}
                onClick={() => {
                  update({ timing: t });
                  goNext("timing");
                }}
              />
            ))}
            <Option
              label="날짜 직접 선택"
              selected={timingPick || (!!answers.timing && !(TIMINGS as readonly string[]).includes(answers.timing))}
              onClick={() => setTimingPick(true)}
            />
          </div>
          {timingPick && (
            <div className="q-date">
              <label className="q-field">
                <span>희망 날짜</span>
                <input
                  type="date"
                  className="q-input"
                  min={new Date().toISOString().slice(0, 10)}
                  value={timingDate}
                  onChange={(e) => setTimingDate(e.target.value)}
                  autoFocus
                />
              </label>
              <button
                type="button"
                className="btn btn--primary q-wide"
                disabled={!timingDate}
                onClick={() => {
                  const [y, m, d] = timingDate.split("-").map(Number);
                  update({ timing: `${y}년 ${m}월 ${d}일 무렵` });
                  goNext("timing");
                }}
              >
                이 날짜로 다음
              </button>
            </div>
          )}
          <Back />
        </>
      )}

      {phase === "budget" && (
        <>
          <Question title="생각해둔 예산이 있나요?" hint="예산은 선택 사항이에요. 실제 금액은 견적에서 확인해요." />
          {!budgetOther ? (
            <div className="q-range" style={{ "--fill": `${(budgetIdx / (BUDGET_STEPS.length - 1)) * 100}%` } as React.CSSProperties}>
              <output className="q-range__value" htmlFor="budget-range">
                <span key={budgetIdx} className="q-range__num">
                  {BUDGET_STEPS[budgetIdx].toLocaleString("ko-KR")}
                </span>
                <span className="q-range__unit">만 원 {budgetIdx === BUDGET_STEPS.length - 1 ? "이상" : "안팎"}</span>
              </output>
              {/* 눈금 막대: 고른 금액까지 초록으로 켜짐 */}
              <span className="q-range__bars" aria-hidden="true">
                {BUDGET_STEPS.map((v, k) => (
                  <i key={v} className={k <= budgetIdx ? "is-on" : ""} style={{ "--h": `${BAR_H[k]}%` } as React.CSSProperties} />
                ))}
              </span>
              <input
                id="budget-range"
                type="range"
                className="q-range__input"
                min={0}
                max={BUDGET_STEPS.length - 1}
                step={1}
                value={budgetIdx}
                onChange={(e) => setBudgetIdx(Number(e.target.value))}
                aria-label="생각한 금액"
                aria-valuetext={budgetLabel(budgetIdx)}
              />
              <span className="q-range__ends" aria-hidden="true">
                <span>{BUDGET_STEPS[0]}만</span>
                <span>{BUDGET_STEPS[BUDGET_STEPS.length - 1].toLocaleString("ko-KR")}만+</span>
              </span>
            </div>
          ) : (
            <label className="q-field">
              <span className="sr-only">생각한 금액</span>
              <input
                className="q-input"
                maxLength={50}
                placeholder="예: 200만 원 안팎"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                autoFocus
              />
            </label>
          )}
          <button
            type="button"
            className="btn btn--primary q-wide"
            disabled={budgetOther && !budgetDraft.trim()}
            onClick={() => {
              update({ budget: budgetOther ? budgetDraft.trim() : budgetLabel(budgetIdx), budgetUndecided: false });
              goNext("budget");
            }}
          >
            이 금액으로 다음
          </button>
          <button type="button" className="q-link" onClick={() => setBudgetOther((v) => !v)}>
            {budgetOther ? "슬라이더로 고를게요" : "기타 · 금액 직접 입력"}
          </button>
          <Option
            label="아직 정하지 않았어요"
            selected={answers.budgetUndecided}
            onClick={() => {
              update({ budget: "", budgetUndecided: true });
              goNext("budget");
            }}
          />
          <Back />
        </>
      )}

      {phase === "visit" && (
        <>
          <Question title="정확한 견적을 위해 방문 실측이 필요해요." hint="접수 후 담당자가 일정을 맞춰 방문해 실측해요. 실측을 마쳐야 항목별 견적을 드릴 수 있어요." />
          <div className="q-visit" aria-hidden="true">
            <span className="q-visit__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17 17 3l4 4L7 21H3z" />
                <path d="m7 13 2 2M10 10l2 2M13 7l2 2" />
              </svg>
            </span>
            <span>
              <strong>방문 실측 <em className="q-req">*필수</em></strong>
              <span>작업할 곳의 크기와 바닥 상태를 직접 확인해요.</span>
            </span>
          </div>
          <p className="q-hint">방문할 때 어떻게 할까요?</p>
          <div className="q-options">
            {VISITS.map((t) => (
              <Option
                key={t}
                label={t}
                selected={answers.visit === t}
                onClick={() => {
                  update({ visit: t });
                  goNext("visit");
                }}
              />
            ))}
          </div>
          <Back />
        </>
      )}

      {phase === "email" && (
        <form
          className="q-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          <Question title="안내받을 이메일을 알려주세요." hint="접수 결과와 견적을 이곳으로 보내요." />
          <label className="q-field">
            <span className="sr-only">이메일 주소</span>
            <input
              type="email"
              className="q-input"
              autoComplete="email"
              inputMode="email"
              placeholder="이메일 주소"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              required
            />
          </label>
          <ErrorText />
          {!isSupabaseConfigured && (
            <p className="q-hint">미리보기 상태예요. 접수 설정을 마치면 확인 코드가 발송돼요.</p>
          )}
          <button type="submit" className="btn btn--primary q-wide" disabled={busy}>
            {busy ? "보내는 중…" : "확인 코드 받기"}
          </button>
          <p className="q-hint">이름과 휴대전화는 마지막 확인에서 입력해요.</p>
          <Back />
        </form>
      )}

      {phase === "verify" && (
        <form
          className="q-form"
          onSubmit={(e) => {
            e.preventDefault();
            verifyCode();
          }}
        >
          <Question title="이메일을 확인해주세요." hint={`${answers.email}로 받은 확인 코드를 입력해주세요.`} />
          <label className="q-field">
            <span className="sr-only">확인 코드</span>
            <input
              className="q-input q-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              placeholder="메일로 받은 확인 코드"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <ErrorText />
          {notice && (
            <p className="q-hint" role="status">
              {notice}
            </p>
          )}
          <button type="submit" className="btn btn--primary q-wide" disabled={busy}>
            {busy ? "확인 중…" : "확인"}
          </button>
          <button type="button" className="q-link" onClick={resendCode} disabled={resendIn > 0 || busy}>
            {resendIn > 0 ? `확인 메일 다시 받기 (${resendIn}초)` : "확인 메일 다시 받기"}
          </button>
          <p className="q-hint">메일이 보이지 않으면 스팸함을 확인해주세요.</p>
          <button type="button" className="q-back" onClick={() => setPhase("email")}>
            <BackIcon /> 이메일 다시 입력
          </button>
        </form>
      )}

      {phase === "review" && (
        <>
          <Question title="이렇게 요청할게요." hint="고칠 내용이 있으면 수정을 눌러주세요." />
          <dl className="q-review">
            {(
              [
                ["사는 지역", `${answers.region ?? ""} ${answers.district ?? ""}`, "district"],
                ["주거 형태", answers.housing, "housing"],
                ["작업", worksLabel, "works"],
                ["맡길 범위", answers.scope, "scope"],
                ["현장 사진", photos.length ? `${photos.length}장` : "사진 없음 (접수 후 안내)", "photos"],
                ["크기·수량", answers.sizeUnknown ? "아직 모르겠어요" : answers.size, "size"],
                ["원하는 모습", answers.wish, "wish"],
                ["희망 시기", answers.timing, "timing"],
                ["예산 · 선택", answers.budgetUndecided ? "아직 정하지 않았어요" : answers.budget, "budget"],
                ["방문 실측", answers.visit, "visit"],
                ["안내받을 이메일", answers.email, "email"],
              ] as [string, string | undefined, Step][]
            ).map(([label, value, step]) => (
              <div key={label} className="q-review__row">
                <dt>{label}</dt>
                <dd>{value || "아직 답하지 않았어요"}</dd>
                <button type="button" className="q-link" onClick={() => editFromReview(step)}>
                  수정<span className="sr-only"> {label}</span>
                </button>
              </div>
            ))}
          </dl>

          <fieldset className="q-optional">
            <legend>이름·휴대전화 <em className="q-req">*필수</em></legend>
            <p className="q-hint">방문 실측 일정을 문자·전화로 안내해요.</p>
            <label className="q-field">
              <span>이름</span>
              <input
                className="q-input"
                autoComplete="name"
                maxLength={40}
                required
                value={answers.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </label>
            <label className="q-field">
              <span>휴대전화</span>
              <input
                className="q-input"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                maxLength={20}
                placeholder="010-0000-0000"
                required
                value={answers.phone}
                onChange={(e) => update({ phone: formatPhone(e.target.value) })}
              />
            </label>
          </fieldset>

          <div className="q-consents">
            {(
              [
                ["privacy", "개인정보 수집·이용 동의", agreePrivacy, setAgreePrivacy, <PrivacyContent key="p" />],
                ["terms", "이용약관 확인", agreeTerms, setAgreeTerms, <TermsContent key="t" />],
              ] as const
            ).map(([id, label, checked, setChecked, content]) => {
              const open = openDoc === id;
              return (
                <div key={id} className="q-consent-item">
                  <div className="q-consent">
                    <label className="q-consent__label">
                      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
                      <span>
                        {label} <em className="q-req">*필수</em>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="q-link"
                      aria-expanded={open}
                      aria-controls={`q-doc-${id}`}
                      onClick={() => setOpenDoc(open ? null : id)}
                    >
                      {open ? "접기" : "내용 보기"}
                    </button>
                  </div>
                  {open && (
                    <div id={`q-doc-${id}`} className="q-doc">
                      <div className="q-doc__body legal" tabIndex={0} aria-label={`${label} 내용`}>
                        {content}
                      </div>
                      <button
                        type="button"
                        className="btn btn--secondary q-wide"
                        onClick={() => {
                          setChecked(true);
                          setOpenDoc(null);
                        }}
                      >
                        동의하고 닫기
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <ErrorText />
          <button type="button" className="btn btn--primary q-wide" onClick={submit} disabled={busy}>
            {busy ? "접수하는 중…" : "신청 접수하기"}
          </button>
          <Back />
        </>
      )}
      </div>
    </div>
  );
}
