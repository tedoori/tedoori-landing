"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const TYPES = ["서비스", "자료 보완", "수정", "취소", "견적", "기타"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** prefill: 내 신청 안에서 열 때 접수번호·이메일·연락처를 미리 채움 */
export function ContactForm({ prefill }: { prefill?: { receiptNo?: string | null; email?: string | null; phone?: string | null; locked?: boolean } } = {}) {
  const [type, setType] = useState<string>("서비스");
  const [receiptNo, setReceiptNo] = useState(prefill?.receiptNo ?? "");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [agree, setAgree] = useState(false);
  const [openDoc, setOpenDoc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());

  // 접수 완료 화면에서 넘어오면 접수번호와 문의 유형을 미리 채움
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const r = q.get("receipt");
    const t = q.get("type");
    if (r) setReceiptNo(r.slice(0, 40));
    if (t && (TYPES as readonly string[]).includes(t)) setType(t);
  }, []);
  const trapRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return setError("문의 내용을 적어주세요.");
    if (!EMAIL_RE.test(email.trim())) return setError("답변받을 이메일 주소를 다시 확인해주세요.");
    if (!agree) return setError("개인정보 수집·이용에 동의해주세요.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          receiptNo: receiptNo.trim(),
          message: message.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: trapRef.current?.value ?? "",
          elapsed: Date.now() - startedAt.current,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch {
      setError("문의를 보내지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="q-shell q-done">
        <h1 className="q-title">문의를 받았습니다.</h1>
        <p className="lead">
          {email}로 답변드려요. 업체 확인이 필요한 내용은 시간이 조금 더 걸릴 수 있어요.
        </p>
        <p className="q-hint">문의 접수와 변경·취소 처리 완료는 달라요. 처리가 끝나면 메일로 따로 알려드려요.</p>
        <Link href="/" className="btn btn--secondary">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <form className="q-shell" onSubmit={submit} noValidate>
      <div className="q-question">
        <h1 className="q-title">무엇을 도와드릴까요?</h1>
        <p className="q-hint">신청 관련 문의라면 접수 메일에 바로 회신하셔도 돼요.</p>
      </div>

      <fieldset className="q-fieldset">
        <legend className="q-label">문의 유형</legend>
        <div className="q-grid q-grid--3">
          {TYPES.map((t) => (
            <button key={t} type="button" className="q-option" aria-pressed={type === t} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      {prefill?.locked ? (
        <dl className="q-locked">
          <div>
            <dt>접수번호</dt>
            <dd>{receiptNo || "—"}</dd>
          </div>
          <div>
            <dt>답변받을 이메일</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd>{phone || "—"}</dd>
          </div>
        </dl>
      ) : (
      <label className="q-field">
        <span className="q-label">관련 접수번호 · 선택</span>
        <input
          className="q-input"
          placeholder="예: TD-2610-0001"
          maxLength={20}
          value={receiptNo}
          onChange={(e) => setReceiptNo(e.target.value)}
        />
      </label>
      )}

      <label className="q-field">
        <span className="q-label">문의 내용 · 필수</span>
        <textarea
          className="q-input q-textarea"
          rows={6}
          maxLength={2000}
          placeholder="확인하거나 바꾸고 싶은 내용을 적어주세요."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>

      {!prefill?.locked && (
        <>
      <label className="q-field">
        <span className="q-label">이메일 · 필수</span>
        <input
          type="email"
          className="q-input"
          autoComplete="email"
          inputMode="email"
          placeholder="답변받을 이메일 (신청 문의라면 신청한 이메일)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className="q-field">
        <span className="q-label">연락처 · 선택</span>
        <input
          type="tel"
          className="q-input"
          autoComplete="tel"
          inputMode="tel"
          maxLength={20}
          placeholder="필요할 때 연락받을 번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
        </>
      )}

      {/* 자동 등록 프로그램 막기: 사람에게는 보이지 않는 칸 */}
      <input ref={trapRef} name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />

      <div className="q-consents">
        <div className="q-consent-item">
          <div className="q-consent">
            <label className="q-consent__label">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>개인정보 수집·이용 동의 · 필수</span>
            </label>
            <button
              type="button"
              className="q-link"
              aria-expanded={openDoc}
              aria-controls="contact-doc"
              onClick={() => setOpenDoc(!openDoc)}
            >
              {openDoc ? "접기" : "내용 보기"}
            </button>
          </div>
          {openDoc && (
            <div id="contact-doc" className="q-doc">
              <div className="q-doc__body legal" tabIndex={0}>
                <section>
                  <h2>수집 항목</h2>
                  <p>이메일(필수), 연락처·접수번호(선택), 문의 내용</p>
                </section>
                <section>
                  <h2>이용 목적</h2>
                  <p>문의 확인과 답변, 신청 관련 요청 처리</p>
                </section>
                <section>
                  <h2>보유 기간</h2>
                  <p>문의 처리가 끝난 뒤 개인정보 처리방침에서 정한 기간 동안 보관한 뒤 파기해요.</p>
                </section>
                <section>
                  <h2>동의 거부</h2>
                  <p>동의하지 않을 수 있지만, 그 경우 문의에 답변드릴 수 없어요.</p>
                </section>
              </div>
              <button
                type="button"
                className="btn btn--secondary q-wide"
                onClick={() => {
                  setAgree(true);
                  setOpenDoc(false);
                }}
              >
                동의하고 닫기
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="q-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary q-wide" disabled={busy}>
        {busy ? "보내는 중…" : "문의 보내기"}
      </button>
      <p className="q-hint">접수번호만으로는 신청 내용을 보여드리거나 바꾸지 않아요. 신청한 이메일로 확인해요.</p>
    </form>
  );
}
