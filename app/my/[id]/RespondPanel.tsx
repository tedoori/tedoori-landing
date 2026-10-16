"use client";

import { useState } from "react";
import { QuoteApiError, quoteApi } from "../../../lib/quote-api";

type Choice = "go" | "adjust" | "hold";
const OPTIONS: { k: Choice; title: string; desc: string }[] = [
  { k: "go", title: "진행할게요", desc: "이 견적으로 시공 일정을 잡아요" },
  { k: "adjust", title: "조정 상담", desc: "금액·범위를 같이 다시 봐요" },
  { k: "hold", title: "이번엔 보류", desc: "나중에 다시 연락할게요" },
];
const DONE: Record<Choice, string> = {
  go: "진행하기로 했어요. 담당자가 시공 일정을 정해 연락드려요.",
  adjust: "조정 상담을 요청했어요. 담당자가 곧 연락드려요.",
  hold: "보류했어요. 다시 진행하고 싶으면 카카오톡 채널 @테두리로 알려주세요.",
};

/** 견적서 아래: 진행 여부 고르기. 이미 답했으면 결과만 */
export function RespondPanel({ id, status, response, onDone }: { id: string; status: string; response: string | null; onDone: () => void }) {
  const [pick, setPick] = useState<Choice | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 담당자가 해피콜(전화)로 확인하고 상태만 바꾼 경우도 결과로 보여줌
  const byCall = !response && (status === "done" || status === "hold");
  const shown = (response ?? (status === "done" ? "go" : status === "hold" ? "hold" : null)) as Choice | null;
  if (shown && shown in DONE && status !== "quoted") {
    return (
      <section className={`resp resp--done is-${shown}`}>
        <p className="resp-kicker">{byCall ? "담당자와 통화로 정했어요" : "내 응답"}</p>
        <p className="resp-result">{DONE[shown]}</p>
      </section>
    );
  }
  if (status !== "quoted") return null;

  const send = async () => {
    if (!pick || busy) return;
    setBusy(true);
    setError("");
    try {
      await quoteApi(`/${encodeURIComponent(id)}/respond`, { method: "POST", body: JSON.stringify({ choice: pick, message }) });
      onDone();
    } catch (e) {
      setError(e instanceof QuoteApiError ? e.message : "보내지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="resp" aria-labelledby="resp-title">
      <p className="resp-kicker">견적을 확인하셨나요?</p>
      <h2 id="resp-title" className="resp-title">
        진행 여부를 알려주세요
      </h2>
      {response === "adjust" && <p className="resp-note">조정 상담을 요청하셨어요. 상담 후 다시 골라주시면 돼요.</p>}
      <div className="resp-options" role="radiogroup" aria-label="진행 여부">
        {OPTIONS.map((o) => (
          <button key={o.k} type="button" role="radio" aria-checked={pick === o.k} className={`resp-opt is-${o.k}${pick === o.k ? " is-on" : ""}`} onClick={() => setPick(o.k)}>
            <strong>{o.title}</strong>
            <span>{o.desc}</span>
          </button>
        ))}
      </div>
      {pick && (
        <textarea
          className="ui-input resp-msg"
          rows={2}
          maxLength={500}
          placeholder={pick === "go" ? "희망 시공 날짜가 있으면 적어주세요 (선택)" : "조정하고 싶은 부분이나 사유를 적어주세요 (선택)"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      )}
      {error && (
        <p className="my-error" role="alert">
          {error}
        </p>
      )}
      <div className="resp-actions">
        <button type="button" className="btn btn--primary" disabled={!pick || busy} onClick={() => void send()}>
          {busy ? "보내는 중…" : "응답 보내기"}
        </button>
      </div>
    </section>
  );
}
