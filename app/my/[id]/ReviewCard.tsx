"use client";

import { useState } from "react";
import { QuoteApiError, quoteApi } from "../../../lib/quote-api";

export type Review = { rating: number; body: string; allow_public: boolean; created_at: string };

const LABEL = ["", "아쉬웠어요", "조금 아쉬웠어요", "괜찮았어요", "좋았어요", "아주 만족해요"];

/** 시공이 끝난 신청: 후기 남기기 / 남긴 후기 보기 */
export function ReviewCard({ id, review, onDone }: { id: string; review: Review | null; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [allowPublic, setAllowPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (review) {
    return (
      <section className="rv rv--done" aria-labelledby="rv-title">
        <p className="rv-kicker">남겨주신 후기</p>
        <p className="rv-stars is-static" aria-label={`별점 ${review.rating}점`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= review.rating ? "is-on" : ""} aria-hidden="true">
              ★
            </span>
          ))}
        </p>
        <h2 id="rv-title" className="rv-body">
          {review.body}
        </h2>
        <p className="rv-meta">{review.allow_public ? "사이트 공개에 동의하셨어요 · 확인 후 소개될 수 있어요" : "테두리 안에서만 참고할게요"}</p>
      </section>
    );
  }

  const send = async () => {
    if (busy) return;
    if (!rating) return setError("별점을 골라주세요.");
    if (body.trim().length < 5) return setError("후기를 5자 이상 적어주세요.");
    setBusy(true);
    setError("");
    try {
      await quoteApi(`/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify({ rating, body, allowPublic }) });
      onDone();
    } catch (e) {
      setError(e instanceof QuoteApiError ? e.message : "보내지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const shown = hover || rating;
  return (
    <section className="rv" aria-labelledby="rv-title">
      <p className="rv-kicker">테두리가 완료됐어요</p>
      <h2 id="rv-title" className="rv-title">
        새 정원은 마음에 드세요?
      </h2>
      <p className="rv-desc">짧게 남겨주시는 한마디가 다음 정원을 더 잘 만드는 데 큰 힘이 돼요.</p>

      <div className="rv-stars" role="radiogroup" aria-label="별점" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n}점`}
            className={n <= shown ? "is-on" : ""}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
        <span className="rv-stars__label">{shown ? LABEL[shown] : "별을 눌러 골라주세요"}</span>
      </div>

      <textarea
        className="ui-input rv-text"
        rows={4}
        maxLength={1000}
        placeholder="어떤 점이 좋았는지, 아쉬웠던 점은 없었는지 편하게 적어주세요."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <label className="rv-public">
        <input type="checkbox" checked={allowPublic} onChange={(e) => setAllowPublic(e.target.checked)} />
        <span>
          <strong>사이트 후기에 소개해도 괜찮아요</strong>
          <small>이름은 가리고 지역·작업만 함께 보여드려요. 체크를 빼면 테두리 안에서만 참고해요.</small>
        </span>
      </label>

      {error && (
        <p className="my-error" role="alert">
          {error}
        </p>
      )}
      <div className="rv-actions">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void send()}>
          {busy ? "보내는 중…" : "후기 남기기"}
        </button>
      </div>
    </section>
  );
}
