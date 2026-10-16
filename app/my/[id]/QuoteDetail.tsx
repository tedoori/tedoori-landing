"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Callout, EmptyState, StatusBadge, type QuoteStatus } from "../../_components/ui";
import { QuoteApiError, quoteApi } from "../../../lib/quote-api";
import { useIdleSignOut } from "../../../lib/idle";
import { EstimateCard, estimateGrand, type Estimate } from "./EstimateCard";
import { VisitCard } from "./VisitCard";
import { AddressCard } from "./AddressCard";

export type QuoteDetailData = {
  id: string;
  receipt_no: string | null;
  email: string;
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
  name: string | null;
  phone: string | null;
  status: QuoteStatus;
  visit_at: string | null;
  visit_note: string | null;
  visit_address: string | null;
  visit_address_detail: string | null;
  visit_memo: string | null;
  estimate: Estimate | null;
  created_at: string;
  updated_at: string;
  photos: { path: string; url: string | null }[];
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; data: QuoteDetailData }
  | { kind: "auth" }
  | { kind: "missing" }
  | { kind: "error"; message: string };

const formatDateTime = (v: string) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(v));

const formatVisit = (v: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(v));

// 방문 주소는 끝나지 않은 신청이면 언제든 미리 넣을 수 있음
const ADDRESS_OPEN = ["received", "checking", "visit", "needs"];
const STEPS = ["접수", "확인", "실측", "견적", "결정"];
const STEP_OF: Record<string, number> = { received: 0, checking: 1, needs: 1, visit: 2, quoted: 3, done: 4, hold: 4, canceled: 0 };
type Tab = "home" | "request" | "visit" | "estimate";
const TABS: [Tab, string][] = [
  ["home", "홈"],
  ["request", "신청 내용"],
  ["visit", "방문 일정"],
  ["estimate", "견적서"],
];

/** 대시보드 맨 위 '지금 할 일' */
function nextAction(d: QuoteDetailData): { title: string; desc: string; cta?: string; tab?: Tab } | null {
  if (d.status === "quoted" && d.estimate)
    return { title: "견적서가 도착했어요", desc: "항목별 금액을 확인하고 진행 여부를 알려주세요.", cta: "견적서 보기", tab: "estimate" };
  if (d.status === "visit" && d.visit_at)
    return { title: `${formatVisit(d.visit_at)} 실측 방문 예정이에요`, desc: "담당자가 방문해 크기와 바닥 상태를 확인해요.", cta: "방문 일정 보기", tab: "visit" };
  if (d.status === "needs") return { title: "보완이 필요해요", desc: "안내 메일을 확인하고 신청서를 수정하거나 사진을 추가해주세요." };
  if (d.status === "done") return { title: "진행이 확정됐어요", desc: "업체 연결과 일정 안내를 따로 연락드려요." };
  if (d.status === "received" || d.status === "checking")
    return { title: "신청을 확인하고 있어요", desc: "24시간 안에 담당자가 전화나 문자로 연락드려요." };
  return null;
}

/** 등록 때 요청사항 맨 앞 줄에 붙인 "방문: …" 을 따로 꺼냄 */
export function splitWish(wish: string | null) {
  const lines = (wish ?? "").split("\n");
  const visit = lines[0]?.startsWith("방문: ") ? lines.shift()!.slice(4) : "";
  return { visit, wish: lines.join("\n").trim() };
}

export function QuoteDetail({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  // 상세를 띄워 둔 채 1시간이 지나면 자동 로그아웃 → 이메일 확인 화면
  useIdleSignOut(useCallback(() => setState({ kind: "auth" }), []));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (TABS.some(([k]) => k === h)) setTab(h as Tab);
  }, []);

  // 삭제: 확인 창에서 한 번 더 눌러야 실행. 실패하면 신청은 그대로 두고 이유를 보여줌
  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await quoteApi(`/${encodeURIComponent(id)}`, { method: "DELETE" });
      const receipt = state.kind === "ready" ? state.data.receipt_no ?? "" : "";
      router.replace(`/my?deleted=${encodeURIComponent(receipt)}`);
    } catch (e) {
      if (e instanceof QuoteApiError && e.status === 404) return router.replace("/my");
      setDeleteError(e instanceof QuoteApiError ? e.message : "삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !deleting && setConfirmOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, deleting]);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", data: await quoteApi<QuoteDetailData>(`/${encodeURIComponent(id)}`) });
    } catch (e) {
      if (e instanceof QuoteApiError && e.status === 401) setState({ kind: "auth" });
      else if (e instanceof QuoteApiError && e.status === 404) setState({ kind: "missing" });
      else setState({ kind: "error", message: e instanceof QuoteApiError ? e.message : "신청 내용을 불러오지 못했어요." });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === "loading")
    return (
      <div className="my-detail" aria-busy="true">
        <p className="my-loading" role="status">신청 내용을 불러오는 중이에요…</p>
        <div className="my-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    );

  if (state.kind === "auth")
    return (
      <div className="my-detail">
        <EmptyState
          icon="info"
          title="이메일 확인이 필요해요."
          desc="신청 이메일로 확인 코드를 받은 뒤 신청 내용을 볼 수 있어요."
          action={
            <Link href="/my" className="btn btn--primary">
              이메일 확인하러 가기
            </Link>
          }
        />
      </div>
    );

  // 없는 주소와 다른 사람의 신청을 구분하지 않음 (존재 여부가 드러나지 않게)
  if (state.kind === "missing")
    return (
      <div className="my-detail">
        <EmptyState
          icon="search"
          title="신청을 찾을 수 없어요."
          desc="주소가 바뀌었거나 삭제된 신청이에요. 내 신청 목록에서 다시 확인해주세요."
          action={
            <Link href="/my" className="btn btn--primary">
              내 신청 목록으로
            </Link>
          }
        />
      </div>
    );

  if (state.kind === "error")
    return (
      <div className="my-detail">
        <Callout tone="danger" title="불러오지 못했어요">
          {state.message}
        </Callout>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={() => void load()}>
            다시 시도
          </button>
          <Link href="/my" className="btn btn--secondary">
            내 신청 목록으로
          </Link>
        </div>
      </div>
    );

  const d = state.data;
  const { visit, wish } = splitWish(d.wish);
  const rows: [string, string][] = [
    ["지역", `${d.region} ${d.district}`],
    ["주거 형태", d.housing],
    ["필요한 작업", d.works_unknown ? "상담하며 정할게요" : d.works.join(" · ")],
    ["맡길 범위", d.scope],
    ["크기·수량", d.size_note || "아직 모르겠어요"],
    ["희망 시기", d.timing],
    ["예산", d.budget || "정하지 않았어요"],
    ["방문 실측", visit || "—"],
  ];

  const canAddress = ADDRESS_OPEN.includes(d.status);
  const stepNow = STEP_OF[d.status] ?? 0;
  const goTab = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "home" ? window.location.pathname : `#${t}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const visitText = d.visit_at ? formatVisit(d.visit_at) : null;
  const next = nextAction(d);

  return (
    <article className="dash" aria-labelledby="detail-title">
      <header className="dash-head">
        <div>
          <p className="my-eyebrow">내 견적 신청</p>
          <h1 id="detail-title" className="dash-title">
            {d.receipt_no || "접수번호 준비 중"}
          </h1>
          <p className="my-panel__text">
            {d.region} {d.district} · {d.works_unknown ? "작업 상담" : d.works.join(" · ")} · {formatDateTime(d.created_at)} 신청
          </p>
        </div>
        <StatusBadge status={d.status} />
      </header>

      <ol className={`dash-steps${d.status === "canceled" ? " is-canceled" : ""}`} aria-label="진행 단계">
        {STEPS.map((s, i) => (
          <li key={s} className={i < stepNow ? "is-done" : i === stepNow ? "is-now" : ""} aria-current={i === stepNow ? "step" : undefined}>
            <span className="dash-steps__dot" aria-hidden="true">
              {i < stepNow ? "✓" : i + 1}
            </span>
            <span className="dash-steps__label">{s}</span>
          </li>
        ))}
      </ol>

      <div className="dash-body">
        <nav className="dash-nav" aria-label="내 신청 메뉴">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" className={tab === k ? "is-on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => goTab(k)}>
              {label}
              {k === "estimate" && d.estimate && <i className="dash-nav__dot" aria-label="견적서 도착" />}
            </button>
          ))}
          <Link href={`/my/${d.id}/edit`} className="dash-nav__link">
            신청서 수정
          </Link>
          <Link href="/my?list=1" className="dash-nav__sub">
            다른 신청 보기
          </Link>
        </nav>

        <div className="dash-main">
          {tab === "home" && (
            <>
              {next && (
                <section className="dash-next" aria-label="지금 할 일">
                  <p className="dash-next__kicker">지금 할 일</p>
                  <h2 className="dash-next__title">{next.title}</h2>
                  <p className="dash-next__desc">{next.desc}</p>
                  {next.tab && (
                    <button type="button" className="btn btn--primary" onClick={() => goTab(next.tab!)}>
                      {next.cta}
                    </button>
                  )}
                </section>
              )}

              {canAddress && (
                <AddressCard
                  id={d.id}
                  address={d.visit_address}
                  detail={d.visit_address_detail}
                  memo={d.visit_memo}
                  onSaved={() => void load()}
                  intro="상세 주소를 미리 입력해 두시면 실측 일정을 더 빨리 잡을 수 있어요."
                />
              )}

              <div className="dash-tiles">
                <button type="button" className="dash-tile" onClick={() => goTab("request")}>
                  <span className="dash-tile__k">신청 내용</span>
                  <strong>{d.works_unknown ? "상담하며 정할게요" : d.works.join(" · ")}</strong>
                  <span className="dash-tile__v">
                    {d.housing} · {d.timing} · 사진 {d.photos.length}장
                  </span>
                  <span className="dash-tile__go" aria-hidden="true">→</span>
                </button>
                <button type="button" className={`dash-tile${visitText ? " is-visit" : ""}`} onClick={() => goTab("visit")}>
                  <span className="dash-tile__k">방문 일정</span>
                  <strong>{visitText ?? "일정 조율 중"}</strong>
                  <span className="dash-tile__v">{d.visit_address ? `${d.visit_address} ${d.visit_address_detail ?? ""}` : "방문 주소 미입력"}</span>
                  <span className="dash-tile__go" aria-hidden="true">→</span>
                </button>
                <button type="button" className={`dash-tile${d.estimate ? " is-estimate" : ""}`} onClick={() => goTab("estimate")}>
                  <span className="dash-tile__k">견적서</span>
                  <strong>{d.estimate ? `${estimateGrand(d.estimate).toLocaleString("ko-KR")}원` : "실측 후 도착해요"}</strong>
                  <span className="dash-tile__v">{d.estimate ? "부가세 포함 · 항목별 견적 보기" : "자재비·배송비·시공비를 나눠 보내드려요"}</span>
                  <span className="dash-tile__go" aria-hidden="true">→</span>
                </button>
                <Link href={`/my/${d.id}/edit`} className="dash-tile">
                  <span className="dash-tile__k">신청서 수정</span>
                  <strong>내용·사진 고치기</strong>
                  <span className="dash-tile__v">작업, 크기, 희망 시기, 사진을 바꿀 수 있어요</span>
                  <span className="dash-tile__go" aria-hidden="true">→</span>
                </Link>
              </div>
            </>
          )}

          {tab === "visit" && (
            <>
              {d.visit_at ? (
                <VisitCard at={d.visit_at} note={d.visit_note} />
              ) : (
                <EmptyState icon="info" title="실측 일정을 조율하고 있어요." desc="담당자가 전화나 문자로 연락드려 방문 날짜를 정해요. 정해지면 메일로도 알려드려요." />
              )}
              {canAddress ? (
                <AddressCard id={d.id} address={d.visit_address} detail={d.visit_address_detail} memo={d.visit_memo} onSaved={() => void load()} />
              ) : (
                d.visit_address && (
                  <section className="addr addr--done">
                    <p className="addr-kicker">방문 주소</p>
                    <p className="addr-value">
                      {d.visit_address} {d.visit_address_detail}
                    </p>
                  </section>
                )
              )}
            </>
          )}

          {tab === "estimate" &&
            (d.estimate ? (
              <EstimateCard estimate={d.estimate} receiptNo={d.receipt_no} customer={d.name} />
            ) : (
              <EmptyState icon="info" title="견적서는 실측 후에 도착해요." desc="현장을 확인한 뒤 자재비·배송비·시공비를 나눈 견적서를 보내드려요. 도착하면 메일로 알려드려요." />
            ))}

          {tab === "request" && (
            <>
          <section className="my-card" aria-labelledby="detail-req">
            <h2 id="detail-req" className="my-card__title">
              신청 내용
            </h2>
            <dl className="my-dl">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div>
                <dt>요청사항</dt>
                <dd className="my-dl__pre">{wish || "적지 않았어요"}</dd>
              </div>
            </dl>
          </section>

          <section className="my-card" aria-labelledby="detail-photos">
            <h2 id="detail-photos" className="my-card__title">
              현장 사진 <small>{d.photos.length}장</small>
            </h2>
            {d.photos.length === 0 ? (
              <EmptyState icon="photo" title="올린 사진이 없어요." desc="수정하기에서 현장 사진을 추가할 수 있어요." />
            ) : (
              <ul className="my-photos">
                {d.photos.map((p, i) =>
                  p.url ? (
                    <li key={p.path}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer">
                        <img src={p.url} alt={`현장 사진 ${i + 1}`} loading="lazy" />
                      </a>
                    </li>
                  ) : (
                    <li key={p.path} className="my-photos__missing">
                      사진을 불러오지 못했어요
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>

          <section className="my-card" aria-labelledby="detail-contact">
            <h2 id="detail-contact" className="my-card__title">
              연락처
            </h2>
            <dl className="my-dl">
              <div>
                <dt>이름</dt>
                <dd>{d.name || "—"}</dd>
              </div>
              <div>
                <dt>휴대전화</dt>
                <dd>{d.phone || "—"}</dd>
              </div>
              <div>
                <dt>이메일</dt>
                <dd>{d.email}</dd>
              </div>
            </dl>
          </section>


          <div className="my-detail__actions">
            <button
              type="button"
              className="btn btn--secondary my-danger"
              onClick={() => {
                setDeleteError("");
                setConfirmOpen(true);
              }}
            >
              삭제하기
            </button>
            <Link href={`/my/${d.id}/edit`} className="btn btn--primary">
              수정하기
            </Link>
          </div>

            </>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div className="ui-dim" onClick={() => !deleting && setConfirmOpen(false)}>
          <div
            className="ui-dialog my-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-title">신청을 삭제할까요?</h2>
            <p id="delete-desc">
              {d.receipt_no} 신청 내용과 올린 사진 {d.photos.length}장이 모두 지워지고, 되돌릴 수 없어요. 진행 중인 견적 상담도 함께 취소돼요.
            </p>
            {deleteError && (
              <p className="my-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="ui-dialog__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setConfirmOpen(false)} disabled={deleting} autoFocus>
                취소
              </button>
              <button type="button" className="btn btn--primary my-danger--solid" onClick={() => void remove()} disabled={deleting}>
                {deleting ? "삭제하는 중…" : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
