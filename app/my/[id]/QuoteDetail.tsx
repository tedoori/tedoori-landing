"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Callout, EmptyState, StatusBadge, type QuoteStatus } from "../../_components/ui";
import { QuoteApiError, quoteApi } from "../../../lib/quote-api";
import { EstimateCard, HelpStrip, estimateGrand, estimateParts, type Estimate } from "./EstimateCard";
import { BUILD_COPY, VisitCard, type BuildKind } from "./VisitCard";
import { AddressCard } from "./AddressCard";
import { RespondPanel } from "./RespondPanel";
import { ReviewCard, type Review } from "./ReviewCard";
import { CompletionCard } from "./CompletionCard";

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
  customer_response: string | null;
  build_at: string | null;
  build_note: string | null;
  build_scope: string[] | null;
  completed_at?: string | null;
  completion_note?: string | null;
  completion_photos?: { path: string; url: string | null }[];
  estimate: Estimate | null;
  review?: Review | null;
  created_at: string;
  updated_at: string;
  photos: { path: string; url: string | null }[];
};

/** 목록 API 한 줄 */
export type ListRow = {
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

const formatDate = (v: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(v));
const formatDateTime = (v: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(v));
const formatVisit = (v: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(v));
const worksText = (r: { works: string[]; works_unknown: boolean }) => (r.works_unknown ? "작업 상담" : r.works.join(" · "));

/** 등록 때 요청사항 맨 앞 줄에 붙인 "방문: …" 을 따로 꺼냄 */
export function splitWish(wish: string | null) {
  const lines = (wish ?? "").split("\n");
  const visit = lines[0]?.startsWith("방문: ") ? lines.shift()!.slice(4) : "";
  return { visit, wish: lines.join("\n").trim() };
}

// 방문 주소는 끝나지 않은 신청이면 언제든 미리 넣을 수 있음
const ADDRESS_OPEN = ["received", "checking", "visit", "needs"];
const ACTIVE = ["received", "checking", "visit", "needs", "quoted"];
const STEPS = ["접수", "확인", "실측", "견적", "결정", "완료"];
const STEP_OF: Record<string, number> = { received: 0, checking: 1, needs: 1, visit: 2, quoted: 3, done: 4, hold: 4, completed: 5, canceled: 0 };

const canReview = (x: { status: string; build_at: string | null }) => x.status === "completed";

type Tab = "home" | "list" | "visit" | "estimate";

/** 메뉴 아이콘 (선 아이콘) */
const ICON: Record<Tab | "edit" | "plus" | "out", string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  visit: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  estimate: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  plus: "M12 5v14M5 12h14",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};
const Icon = ({ k }: { k: keyof typeof ICON }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICON[k]} />
  </svg>
);

function Steps({ status }: { status: QuoteStatus }) {
  const now = STEP_OF[status] ?? 0;
  return (
    <ol className={`dash-steps${status === "canceled" ? " is-canceled" : ""}`} aria-label="진행 단계">
      {STEPS.map((s, i) => (
        <li key={s} className={i < now ? "is-done" : i === now ? "is-now" : ""} aria-current={i === now ? "step" : undefined}>
          <span className="dash-steps__dot" aria-hidden="true">
            {i < now ? "✓" : i + 1}
          </span>
          <span className="dash-steps__label">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/** 진행 범위 → 일정 종류. 고객이 고른 범위 > 신청 때 고른 '맡길 범위' > 견적서에 시공비가 있는지 */
function buildKindOf(d: QuoteDetailData): BuildKind {
  const s = d.build_scope;
  if (s?.length) return s.includes("labor") ? "labor" : s.includes("delivery") ? "delivery" : "material";
  if (d.scope === "자재만") return "material";
  if (d.scope === "배송까지") return "delivery";
  if (d.scope === "시공까지") return "labor";
  const labor = d.estimate ? d.estimate.items.reduce((a, i) => a + i.labor_cost, 0) : 1;
  return labor > 0 ? "labor" : "delivery";
}

/** 지금 할 일 한 줄 */
function nextAction(d: QuoteDetailData): { title: string; desc: string; cta?: string; tab?: Tab } {
  if (d.status === "quoted" && d.estimate)
    return { title: "견적서가 도착했어요", desc: "항목별 금액을 확인하고 진행 여부를 알려주세요.", cta: "견적서 보기", tab: "estimate" };
  if (d.status === "visit" && d.visit_at)
    return { title: `${formatVisit(d.visit_at)} 실측 방문`, desc: "담당자가 방문해 크기와 바닥 상태를 확인해요.", cta: "방문 일정 보기", tab: "visit" };
  if (d.status === "needs") return { title: "보완이 필요해요", desc: "안내 메일을 확인하고 신청서를 수정하거나 사진을 추가해주세요." };
  if (canReview(d) && !d.review) return { title: "테두리가 완료됐어요", desc: "새 정원은 마음에 드세요? 짧은 후기를 남겨주세요." };
  if (d.status === "done")
    return d.build_at
      ? { title: `${formatVisit(d.build_at)} ${BUILD_COPY[buildKindOf(d)].label.replace(" 일정", "")} 예정`, desc: BUILD_COPY[buildKindOf(d)].ready, cta: "일정 보기", tab: "visit" }
      : { title: "진행이 확정됐어요", desc: BUILD_COPY[buildKindOf(d)].waiting, cta: "일정 보기", tab: "visit" };
  if (d.status === "completed" && !d.review) return { title: "테두리가 완료됐어요", desc: "완료 사진을 확인하고 짧은 후기를 남겨주세요." };
  if (d.status === "completed") return { title: "테두리가 완료됐어요", desc: "남겨주신 후기 고마워요. 관리법이 궁금하면 언제든 물어보세요.", cta: "완료 보고 보기", tab: "visit" };
  if (d.status === "hold") return { title: "보류 중이에요", desc: "다시 진행하고 싶으면 카카오톡 채널 @테두리로 알려주세요." };
  if (d.status === "canceled") return { title: "취소된 신청이에요", desc: "새로 필요하면 새 견적을 신청해주세요." };
  return { title: "신청을 확인하고 있어요", desc: "24시간 안에 담당자가 전화나 문자로 연락드려요." };
}

type Props = {
  email: string;
  rows: ListRow[];
  total: number;
  initialId?: string | null;
  onLogout: () => void;
  onListChange: () => Promise<void> | void;
};

/** 내 신청 대시보드: 홈 · 신청 내역 · 방문 일정 · 견적서 */
export function MyDashboard({ email, rows, total, initialId, onLogout, onListChange }: Props) {
  const [tab, setTab] = useState<Tab>("home");
  const [openId, setOpenId] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(initialId && rows.some((r) => r.id === initialId) ? initialId : (rows[0]?.id ?? null));
  const [d, setD] = useState<QuoteDetailData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // 주소창 #list, #visit, #estimate 로 바로 열기 (메일 버튼 등)
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h === "list" || h === "visit" || h === "estimate") setTab(h);
  }, []);

  const cache = useRef<Record<string, QuoteDetailData>>({});
  // 같은 신청을 홈·탭이 동시에 부르면 한 번만 요청
  const inflight = useRef<Record<string, Promise<QuoteDetailData>>>({});
  const fetchDetail = useCallback((id: string) => {
    inflight.current[id] ??= quoteApi<QuoteDetailData>(`/${encodeURIComponent(id)}`).finally(() => delete inflight.current[id]);
    return inflight.current[id];
  }, []);
  const latestId = rows[0]?.id ?? null;
  const [h, setH] = useState<QuoteDetailData | null>(null);
  const loadHome = useCallback(async () => {
    if (!latestId) return;
    try {
      const fresh = await fetchDetail(latestId);
      cache.current[fresh.id] = fresh;
      setH(fresh);
    } catch {
      /* 홈 요약은 실패해도 다른 탭은 그대로 */
    }
  }, [latestId, fetchDetail]);
  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const load = useCallback(async () => {
    if (!selId) return;
    setLoadError("");
    if (cache.current[selId]) setD(cache.current[selId]);
    try {
      const fresh = await fetchDetail(selId);
      cache.current[fresh.id] = fresh;
      setD(fresh);
    } catch (e) {
      setLoadError(e instanceof QuoteApiError ? e.message : "신청 내용을 불러오지 못했어요.");
    }
  }, [selId, fetchDetail]);

  useEffect(() => {
    void load();
  }, [load]);

  const goTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    if (selId) url.searchParams.set("id", selId);
    url.hash = t === "home" ? "" : t;
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const pick = (id: string, t: Tab = "list") => {
    setSelId(id);
    if (t === "list") setOpenId(id);
    goTab(t);
  };

  const remove = async () => {
    if (deleting || !d) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await quoteApi(`/${encodeURIComponent(d.id)}`, { method: "DELETE" });
      setConfirmOpen(false);
      setD(null);
      setSelId(rows.find((r) => r.id !== d.id)?.id ?? null);
      await onListChange();
      setTab("home");
    } catch (e) {
      setDeleteError(e instanceof QuoteApiError ? e.message : "삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !deleting && setConfirmOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, deleting]);

  const counts = {
    active: rows.filter((r) => ACTIVE.includes(r.status)).length,
    quoted: rows.filter((r) => r.status === "quoted").length,
    // 견적서를 받은 신청 (견적 도착 뒤 진행 확정·보류 포함)
    // 시공까지 끝난 신청
    finished: rows.filter((r) => r.status === "completed").length,
    estimates: rows.filter((r) => ["quoted", "done", "completed", "hold"].includes(r.status)).length,
  };
  const name = h?.name ?? d?.name;
  const canAddress = d ? ADDRESS_OPEN.includes(d.status) : false;
  const menu: [Tab, string, number | null][] = [
    ["home", "홈", null],
    ["list", "신청 내역", total],
    ["visit", "방문 일정", null],
    ["estimate", "견적서", counts.estimates || null],
  ];

  return (
    <div className="dash">
      {/* 왼쪽: 프로필 + 메뉴 */}
      <aside className="dash-side">
        <div className="dash-me">
          <span className="dash-me__avatar" aria-hidden="true">
            {(name || email).slice(0, 1).toUpperCase()}
          </span>
          <span className="dash-me__text">
            <strong>{name ? `${name} 님` : "내 신청"}</strong>
            <small>{email}</small>
          </span>
        </div>
        <nav className="dash-nav" aria-label="내 신청 메뉴">
          {menu.map(([k, label, n]) => (
            <button key={k} type="button" className={tab === k ? "is-on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => goTab(k)}>
              <Icon k={k} />
              <span>{label}</span>
              {n !== null && <em className="dash-nav__count">{n}</em>}
              {k === "estimate" && counts.quoted > 0 && <i className="dash-nav__dot" aria-label="견적서 도착" />}
            </button>
          ))}
        </nav>
        <div className="dash-side__foot">
          <Link href="/quote" className="dash-side__new">
            <Icon k="plus" /> 새 견적 신청
          </Link>
          <button type="button" className="dash-side__out" onClick={onLogout}>
            <Icon k="out" /> 로그아웃
          </button>
        </div>
      </aside>

      <div className="dash-main">
        {total === 0 && (
          <EmptyState
            icon="info"
            title="아직 접수한 신청이 없어요."
            desc="필요한 공간부터 무료 견적을 신청해보세요."
            action={
              <Link href="/quote" className="btn btn--primary">
                새 견적 신청하기
              </Link>
            }
          />
        )}

        {loadError && (
          <Callout tone="danger" title="불러오지 못했어요">
            {loadError}
          </Callout>
        )}

        {total > 0 && (tab === "home" ? !h : !d) && !loadError && (
          <div className="my-skeleton" aria-busy="true" aria-label="불러오는 중">
            <span />
            <span />
            <span />
          </div>
        )}

        {/* ---------- 홈 ---------- */}
        {h && tab === "home" && (
          <>
            <header className="dash-hello">
              <p className="my-eyebrow">MY TEDOORI</p>
              <h1 className="dash-hello__title">{name ? `${name} 님, 안녕하세요` : "안녕하세요"}</h1>
            </header>

            <div className="dash-stats">
              <button type="button" onClick={() => goTab("list")}>
                <span>전체 신청</span>
                <strong>{total}</strong>
              </button>
              <button type="button" onClick={() => goTab("list")}>
                <span>진행 중</span>
                <strong>{counts.active}</strong>
              </button>
              <button type="button" onClick={() => goTab("estimate")}>
                <span>견적 도착</span>
                <strong className={counts.quoted ? "is-hot" : ""}>{counts.quoted}</strong>
              </button>
              <button type="button" onClick={() => goTab("list")}>
                <span>완료</span>
                <strong>{counts.finished}</strong>
              </button>
            </div>

            {h.status === "completed" && <CompletionCard note={h.completion_note ?? null} photos={h.completion_photos ?? []} at={h.completed_at ?? null} />}
            {/* 시공이 끝났으면 후기 요청을 맨 위에 */}
            {canReview(h) && (
              <div className={h.review ? "" : "rv-spot"}>
                <ReviewCard id={h.id} review={h.review ?? null} onDone={() => (void loadHome(), void load())} />
              </div>
            )}

            {rows.length > 1 && (
              <section className="dash-all" aria-label="전체 신청 현황">
                <p className="dash-all__head">
                  전체 신청 현황 <small>최신순</small>
                </p>
                <ul>
                  {rows.slice(0, 2).map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => pick(r.id)}>
                        <span className="dash-all__txt">
                          <strong>{worksText(r)}</strong>
                          <small>
                            {r.receipt_no} · {formatDate(r.created_at)}
                          </small>
                        </span>
                        <StatusBadge status={r.status} />
                      </button>
                    </li>
                  ))}
                </ul>
                {rows.length > 2 && (
                  <button type="button" className="dash-all__more" onClick={() => goTab("list")}>
                    신청 {rows.length - 2}건 더 보기 <span aria-hidden="true">→</span>
                  </button>
                )}
              </section>
            )}

            <section className="dash-focus" aria-labelledby="focus-title">
              <div className="dash-focus__top">
                <div>
                  <p className="dash-focus__no">
                    <span className="dash-focus__tag">가장 최근 신청</span> {h.receipt_no}
                  </p>
                  <h2 id="focus-title" className="dash-focus__title">
                    {worksText(h)}
                  </h2>
                  <p className="dash-focus__meta">
                    {h.region} {h.district} · {h.housing} · {formatDate(h.created_at)} 신청
                  </p>
                </div>
                <StatusBadge status={h.status} />
              </div>
              <Steps status={h.status} />
              {(() => {
                const n = nextAction(h);
                return (
                  <div className="dash-focus__next">
                    <div>
                      <strong>{n.title}</strong>
                      <span>{n.desc}</span>
                    </div>
                    {n.tab && (
                      <button type="button" className="btn btn--primary" onClick={() => pick(h.id, n.tab!)}>
                        {n.cta}
                      </button>
                    )}
                  </div>
                );
              })()}
            </section>

            {ADDRESS_OPEN.includes(h.status) && !h.visit_address && (
              <AddressCard
                id={h.id}
                address={h.visit_address}
                detail={h.visit_address_detail}
                memo={h.visit_memo}
                onSaved={() => (void loadHome(), void load())}
                intro="상세 주소를 미리 입력해 두시면 실측 일정을 더 빨리 잡을 수 있어요."
              />
            )}

            <div className="dash-widgets">
              <button type="button" className={`dash-widget${h.visit_at ? " is-visit" : ""}`} onClick={() => pick(h.id, "visit")}>
                <span className="dash-widget__k">
                  <Icon k="visit" /> 방문 일정
                </span>
                <strong>{h.visit_at ? formatVisit(h.visit_at) : "일정 조율 중"}</strong>
                <span className="dash-widget__v">
                  {h.visit_address ? `${h.visit_address} ${h.visit_address_detail ?? ""}` : "방문 주소를 아직 입력하지 않았어요"}
                </span>
              </button>
              <button type="button" className={`dash-widget${h.estimate ? " is-estimate" : ""}`} onClick={() => pick(h.id, "estimate")}>
                <span className="dash-widget__k">
                  <Icon k="estimate" /> 견적서
                </span>
                <strong>{h.estimate ? `${estimateGrand(h.estimate).toLocaleString("ko-KR")}원` : "실측 후 도착해요"}</strong>
                <span className="dash-widget__v">{h.estimate ? "부가세 포함 · 항목별 견적 보기" : "자재비·배송비·시공비를 나눠 보내드려요"}</span>
              </button>
              <button type="button" className="dash-widget" onClick={() => goTab("list")}>
                <span className="dash-widget__k">
                  <Icon k="list" /> 신청 내역
                </span>
                <strong>{total}건</strong>
                <span className="dash-widget__v">신청 내용·사진·연락처 확인</span>
              </button>
              <button type="button" className="dash-widget" onClick={() => goTab("list")}>
                <span className="dash-widget__k">
                  <Icon k="edit" /> 신청서 수정
                </span>
                <strong>내용·사진 고치기</strong>
                <span className="dash-widget__v">신청 내역에서 고칠 신청을 골라요</span>
              </button>
            </div>
          </>
        )}

        {/* ---------- 신청 내역 ---------- */}
        {tab === "list" && total > 0 && (
          <>
            <header className="dash-tabhead dash-tabhead--row">
              <h1 className="dash-tabhead__title">신청 내역</h1>
              <p className="dash-tabhead__count">
                총 <strong>{total}</strong>건
              </p>
            </header>
            <ul className="dash-list">
              {rows.map((r) => {
                const open = openId === r.id;
                return (
                <li key={r.id} className={`dash-acc${open ? " is-open" : ""}`}>
                <div className={`dash-row${open ? " is-on" : ""}`}>
                  <button
                    type="button"
                    className="dash-row__pick"
                    aria-expanded={open}
                    onClick={() => {
                      if (open) return setOpenId(null);
                      setSelId(r.id);
                      setOpenId(r.id);
                    }}
                  >
                    <span className="dash-row__main">
                      <strong>{worksText(r)}</strong>
                      <span>
                        {r.receipt_no} · {r.region} {r.district} · {formatDate(r.created_at)}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                    <span className="dash-row__chev" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                  <Link href={`/my/${r.id}/edit`} className="addr-edit dash-row__edit">
                    <Icon k="edit" /> 수정
                  </Link>
                </div>
                {open &&
                  (d && d.id === r.id ? (
                    <RequestDetail d={d} onDelete={() => (setDeleteError(""), setConfirmOpen(true))} onGo={(t) => pick(r.id, t)} />
                  ) : (
                    <p className="dash-acc__loading" role="status">
                      불러오는 중…
                    </p>
                  ))}
                </li>
                );
              })}
            </ul>
          </>
        )}

        {/* ---------- 방문 일정 ---------- */}
        {d && tab === "visit" && (
          <>
            <TabHead title={d.status === "done" || d.status === "completed" ? `${BUILD_COPY[buildKindOf(d)].label.replace(" 일정", "")}·방문 일정` : "방문 일정"} rows={rows} selId={selId} onPick={(id) => pick(id, "visit")} />
            {d.status === "completed" && <CompletionCard note={d.completion_note ?? null} photos={d.completion_photos ?? []} at={d.completed_at ?? null} />}
            {(d.status === "done" || d.status === "completed") && <VisitCard kind="build" buildKind={buildKindOf(d)} at={d.build_at} note={d.build_note} />}
            {canReview(d) && <ReviewCard id={d.id} review={d.review ?? null} onDone={() => (void load(), void loadHome())} />}
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
            <VisitCard at={d.visit_at} note={d.visit_note} address={canAddress ? undefined : d.visit_address} detail={d.visit_address_detail} memo={canAddress ? undefined : d.visit_memo} />
          </>
        )}

        {/* ---------- 견적서 ---------- */}
        {d && tab === "estimate" && (
          <>
            <TabHead title="견적서" rows={rows} selId={selId} onPick={(id) => pick(id, "estimate")} />
            {d.estimate ? (
              <>
                <EstimateCard estimate={d.estimate} receiptNo={d.receipt_no} customer={d.name} />
                <RespondPanel id={d.id} status={d.status} response={d.customer_response} parts={estimateParts(d.estimate)} onDone={() => (void load(), void onListChange(), void loadHome())} />
                <HelpStrip />
              </>
            ) : (
              <EmptyState icon="info" title="견적서는 실측 후에 도착해요." desc="현장을 확인한 뒤 자재비·배송비·시공비를 나눈 견적서를 보내드려요. 도착하면 메일로 알려드려요." />
            )}
          </>
        )}
      </div>

      {confirmOpen && d && (
        <div className="ui-dim" onClick={() => !deleting && setConfirmOpen(false)}>
          <div className="ui-dialog my-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}

/** 탭 머리말: 제목 + 어떤 신청을 보고 있는지 (여러 건이면 골라 바꾸기) */
function TabHead({ title, rows, selId, onPick }: { title: string; rows: ListRow[]; selId: string | null; onPick: (id: string) => void }) {
  const cur = rows.find((r) => r.id === selId);
  return (
    <header className="dash-tabhead">
      <h1 className="dash-tabhead__title">{title}</h1>
      {rows.length > 1 ? (
        <div className="dash-pick" role="group" aria-label="신청 고르기">
          {rows.map((r) => (
            <button key={r.id} type="button" className={r.id === selId ? "is-on" : ""} aria-pressed={r.id === selId} onClick={() => onPick(r.id)}>
              <strong>{worksText(r)}</strong>
              <span>{r.receipt_no}</span>
            </button>
          ))}
        </div>
      ) : (
        cur && (
          <p className="dash-tabhead__sub">
            {cur.receipt_no} · {worksText(cur)}
          </p>
        )
      )}
    </header>
  );
}

/** 신청 내역에서 고른 신청의 자세한 내용 */
function RequestDetail({ d, onDelete, onGo }: { d: QuoteDetailData; onDelete: () => void; onGo: (t: Tab) => void }) {
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
  return (
    <section className="dash-detail" aria-labelledby="detail-title">
      <div className="dash-detail__head">
        <div>
          <p className="dash-focus__no">{d.receipt_no}</p>
          <h2 id="detail-title" className="dash-focus__title">
            신청 내용
          </h2>
          <p className="dash-focus__meta">
            {formatDateTime(d.created_at)} 신청
            {d.updated_at && d.updated_at !== d.created_at && ` · ${formatDateTime(d.updated_at)} 수정`}
          </p>
        </div>
        <StatusBadge status={d.status} />
      </div>

      {d.status === "visit" && (
        <button type="button" className="dash-go dash-go--visit" onClick={() => onGo("visit")}>
          <Icon k="visit" />
          <span>
            <strong>실측 방문 {d.visit_at ? formatVisit(d.visit_at) : "일정 조율 중"}</strong>
            <small>방문 일정 바로가기</small>
          </span>
          <b aria-hidden="true">→</b>
        </button>
      )}
      {d.status === "quoted" && d.estimate && (
        <button type="button" className="dash-go dash-go--estimate" onClick={() => onGo("estimate")}>
          <Icon k="estimate" />
          <span>
            <strong>견적서가 도착했어요 · {estimateGrand(d.estimate).toLocaleString("ko-KR")}원</strong>
            <small>견적서 바로가기</small>
          </span>
          <b aria-hidden="true">→</b>
        </button>
      )}

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

      <div>
        <h3 className="dash-sub">
          현장 사진 <small>{d.photos.length}장</small>
        </h3>
        {d.photos.length === 0 ? (
          <p className="dash-muted">올린 사진이 없어요. 신청서 수정에서 추가할 수 있어요.</p>
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
      </div>

      <div>
        <h3 className="dash-sub">연락처</h3>
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
      </div>

      <div className="dash-actions">
        <button type="button" className="btn btn--secondary my-danger" onClick={onDelete}>
          삭제하기
        </button>
        <Link href={`/my/${d.id}/edit`} className="btn btn--primary">
          수정하기
        </Link>
      </div>
    </section>
  );
}
