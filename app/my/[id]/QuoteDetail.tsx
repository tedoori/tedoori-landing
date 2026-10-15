"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Callout, EmptyState, StatusBadge, type QuoteStatus } from "../../_components/ui";
import { QuoteApiError, quoteApi } from "../../../lib/quote-api";
import { useIdleSignOut } from "../../../lib/idle";

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

  return (
    <article className="my-detail" aria-labelledby="detail-title">
      <Link href="/my" className="my-back">
        ← 내 신청 목록
      </Link>

      <header className="my-detail__head">
        <div>
          <p className="my-eyebrow">견적 신청</p>
          <h1 id="detail-title" className="my-panel__title">
            {d.receipt_no || "접수번호 준비 중"}
          </h1>
          <p className="my-panel__text">
            {formatDateTime(d.created_at)} 신청
            {d.updated_at && d.updated_at !== d.created_at && ` · ${formatDateTime(d.updated_at)} 수정`}
          </p>
        </div>
        <StatusBadge status={d.status} />
      </header>

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

      <p className="my-note">진행 상태는 테두리가 확인하면서 바꿔요. 접수번호와 신청 이메일은 바꿀 수 없어요.</p>

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
