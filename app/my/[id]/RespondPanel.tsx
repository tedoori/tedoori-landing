"use client";

import { useState } from "react";
import { QuoteApiError, quoteApi } from "../../../lib/quote-api";

type Choice = "go" | "adjust" | "hold";
const OPTIONS: { k: Choice; title: string; desc: string }[] = [
  { k: "go", title: "진행할게요", desc: "이 견적으로 시공 일정을 잡아요" },
  { k: "adjust", title: "조정 상담", desc: "금액·범위를 같이 다시 봐요" },
  { k: "hold", title: "이번엔 보류", desc: "조금 더 생각해볼게요" },
];

// 고른 응답마다 이어지는 질문 (여러 개 고를 수 있음, 선택 사항)
const FOLLOW: Record<Choice, { q: string; chips: string[]; placeholder: string }> = {
  go: {
    q: "언제쯤 시공하면 좋을까요?",
    chips: ["날짜를 정해둘게요", "2주 안에", "이번 달 안에", "다음 달", "상담하면서 정할게요"],
    placeholder: "피하고 싶은 요일이나 시간대가 있으면 적어주세요 (선택)",
  },
  adjust: {
    q: "어떤 부분을 다시 보고 싶으세요?",
    chips: ["금액", "작업 범위", "자재", "일정", "기타"],
    placeholder: "고민되는 부분을 편하게 적어주세요 (선택)",
  },
  hold: {
    q: "보류하시는 이유를 알려주시면 다음에 더 잘 도와드릴게요",
    chips: ["예산", "시기", "다른 곳과 비교 중", "가족과 상의 중", "기타"],
    placeholder: "남기고 싶은 말이 있으면 적어주세요 (선택)",
  },
};

const DONE: Record<Choice, { title: string; body: string }> = {
  go: {
    title: "함께하게 되어 기뻐요",
    body: "남겨주신 일정을 바탕으로 담당자가 시공 날짜를 맞춰 하루 안에 연락드릴게요. 정원이 바뀌는 날까지 꼼꼼히 챙길게요.",
  },
  adjust: {
    title: "말씀해주셔서 고마워요",
    body: "고민되는 부분을 살펴보고 담당자가 다시 연락드릴게요. 지금 견적서는 그대로 남아 있으니 편하게 비교해보세요.",
  },
  hold: {
    title: "괜찮아요, 천천히 생각해보세요",
    body: "견적서는 유효기간까지 여기 남아 있어요. 마음이 정해지면 언제든 카카오톡 채널 @테두리로 이야기해주세요.",
  },
};

// 담당자 통화로 정한 경우 안내
const CALL: Record<Choice, string> = {
  go: "통화로 나눈 일정에 맞춰 시공을 준비하고 있어요. 날짜가 정해지면 방문 일정에서 바로 확인할 수 있어요.",
  adjust: "통화로 나눈 내용을 반영해 견적을 다시 살펴보고 있어요.",
  hold: "통화로 말씀해주신 대로 잠시 보류해둘게요. 언제든 카카오톡 채널 @테두리로 다시 이야기해주세요.",
};

/** 견적서 아래: 진행 여부 고르기. 이미 답했으면 결과만 */
type Parts = { material: number; delivery: number; labor: number };
const PART_LABEL: [keyof Parts, string, string][] = [
  ["material", "자재", "자재비"],
  ["delivery", "배송", "배송비"],
  ["labor", "시공", "시공비·추가 비용"],
];

export function RespondPanel({ id, status, response, parts, onDone }: { id: string; status: string; response: string | null; parts: Parts; onDone: () => void }) {
  // 진행 범위: 견적서에 금액이 있는 묶음만, 처음엔 모두 선택
  const available = PART_LABEL.filter(([k]) => parts[k] > 0);
  const [scope, setScope] = useState<(keyof Parts)[]>(available.map(([k]) => k));
  const [pick, setPick] = useState<Choice | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Choice | null>(null);

  // 담당자가 해피콜(전화)로 확인하고 상태만 바꾼 경우도 결과로 보여줌
  const byCall = !response && !sent && (status === "done" || status === "completed" || status === "hold");
  const shown = (sent ?? (status !== "quoted" ? (response ?? (status === "done" || status === "completed" ? "go" : status === "hold" ? "hold" : null)) : null)) as Choice | null;
  if (shown && shown in DONE) {
    return (
      <section className={`resp resp--done is-${shown}`}>
        <p className="resp-kicker">{byCall ? "담당자와 통화로 정했어요" : "보내주신 응답"}</p>
        <p className="resp-title">{DONE[shown].title}</p>
        <p className="resp-result">{byCall ? CALL[shown] : DONE[shown].body}</p>
      </section>
    );
  }
  if (status !== "quoted") return null;

  const choose = (k: Choice) => {
    setPick(k);
    setChips([]);
    setDate("");
    setError("");
  };
  const toggleChip = (c: string) => setChips((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const wantsDate = pick === "go" && chips.includes("날짜를 정해둘게요");
  const hasLabor = scope.includes("labor");
  const scopeTotal = scope.reduce((a, k) => a + parts[k], 0);
  const toggleScope = (k: keyof Parts) => setScope((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const send = async () => {
    if (!pick || busy) return;
    if (pick === "go" && scope.length === 0) return setError("진행할 범위를 하나 이상 골라주세요.");
    if (wantsDate && !date) return setError("희망 날짜를 골라주세요.");
    if (chips.includes("기타") && !message.trim()) return setError("기타 내용을 메모에 적어주세요.");
    setBusy(true);
    setError("");
    const lines = [
      pick === "go" ? `진행 범위: ${PART_LABEL.filter(([k]) => scope.includes(k)).map(([, l]) => l).join("·")} (${scopeTotal.toLocaleString("ko-KR")}원, 부가세 포함)` : "",
      chips.length ? `${pick === "go" ? "희망 시기" : pick === "adjust" ? "조정할 부분" : "보류 이유"}: ${chips.filter((c) => c !== "날짜를 정해둘게요").concat(wantsDate ? [`희망일 ${date}`] : []).join(", ")}` : "",
      message.trim(),
    ].filter(Boolean);
    try {
      await quoteApi(`/${encodeURIComponent(id)}/respond`, { method: "POST", body: JSON.stringify({ choice: pick, message: lines.join("\n"), scope: pick === "go" ? scope : undefined }) });
      setSent(pick);
      onDone();
    } catch (e) {
      setError(e instanceof QuoteApiError ? e.message : "보내지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const f = pick ? FOLLOW[pick] : null;

  return (
    <section className="resp" aria-labelledby="resp-title">
      <p className="resp-kicker">견적을 확인하셨나요?</p>
      <h2 id="resp-title" className="resp-title">
        진행 여부를 알려주세요
      </h2>
      {response === "adjust" && <p className="resp-note">조정 상담을 요청하셨어요. 상담 후 다시 골라주시면 돼요.</p>}
      <div className="resp-options" role="radiogroup" aria-label="진행 여부">
        {OPTIONS.map((o) => (
          <button key={o.k} type="button" role="radio" aria-checked={pick === o.k} className={`resp-opt is-${o.k}${pick === o.k ? " is-on" : ""}`} onClick={() => choose(o.k)}>
            <strong>{o.title}</strong>
            <span>{o.desc}</span>
          </button>
        ))}
      </div>

      {f && (
        <div className="resp-follow">
          {pick === "go" && available.length > 1 && (
            <>
              <p className="resp-q">어디까지 맡기실 건가요?</p>
              <div className="resp-scope">
                {available.map(([k, l, sub]) => (
                  <button key={k} type="button" className={scope.includes(k) ? "is-on" : ""} aria-pressed={scope.includes(k)} onClick={() => toggleScope(k)}>
                    <span className="resp-scope__check" aria-hidden="true">
                      {scope.includes(k) ? "✓" : ""}
                    </span>
                    <span>
                      <strong>{l}</strong>
                      <small>
                        {sub} {parts[k].toLocaleString("ko-KR")}원
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              <p className="resp-sum">
                선택한 범위 합계 <strong>{scopeTotal.toLocaleString("ko-KR")}원</strong> <small>부가세 포함 · 범위를 바꾸면 담당자가 확인 후 견적을 다시 맞춰드려요</small>
              </p>
            </>
          )}
          <p className="resp-q">{pick === "go" ? (hasLabor ? "언제쯤 시공하면 좋을까요?" : "언제쯤 받으면 좋을까요?") : f.q}</p>
          <div className="resp-chips">
            {f.chips.map((c) => (
              <button key={c} type="button" className={chips.includes(c) ? "is-on" : ""} aria-pressed={chips.includes(c)} onClick={() => toggleChip(c)}>
                {c}
              </button>
            ))}
          </div>
          {wantsDate && (
            <label className="resp-date">
              <span>{hasLabor ? "희망 시공일" : "희망 수령일"}</span>
              <input type="date" className="ui-input" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          )}
          <label className="resp-memo">
            <span>
              전달하고 싶은 메모 {chips.includes("기타") ? <em className="q-req">*기타 내용을 적어주세요</em> : <small>선택</small>}
            </span>
            <textarea
              className="ui-input resp-msg"
              rows={3}
              maxLength={400}
              placeholder={chips.includes("기타") ? "기타로 고른 내용을 자세히 적어주세요" : f.placeholder.replace(" (선택)", "")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
        </div>
      )}

      {error && (
        <p className="my-error" role="alert">
          {error}
        </p>
      )}
      <div className="resp-actions">
        <button type="button" className="btn btn--primary" disabled={!pick || busy} onClick={() => void send()}>
          {busy ? "보내는 중…" : pick === "go" ? "진행 요청 보내기" : pick === "adjust" ? "조정 상담 요청하기" : pick === "hold" ? "보류로 남기기" : "응답 보내기"}
        </button>
      </div>
    </section>
  );
}
