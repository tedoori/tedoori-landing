"use client";

import { useEffect, useRef, useState } from "react";
import { QuoteApiError, quoteApi } from "../../../lib/quote-api";

// 다음(카카오) 우편번호 서비스: 키 없이 무료로 쓰는 주소 검색
const POSTCODE_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
type Postcode = new (o: { oncomplete: (d: { roadAddress: string; jibunAddress: string; buildingName: string }) => void; width: string; height: string }) => {
  embed: (el: HTMLElement) => void;
};
declare global {
  interface Window {
    daum?: { Postcode: Postcode };
  }
}

const loadPostcode = () =>
  new Promise<void>((resolve, reject) => {
    if (window.daum?.Postcode) return resolve();
    const s = document.createElement("script");
    s.src = POSTCODE_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });

type Props = {
  id: string;
  address: string | null;
  detail: string | null;
  memo: string | null;
  onSaved: () => void;
  intro?: string;
};

/** 실측 방문 주소: 일정을 정하는 동안 고객이 직접 입력 */
export function AddressCard({ id, address, detail, memo, onSaved, intro }: Props) {
  const [editing, setEditing] = useState(!address);
  const [addr, setAddr] = useState(address ?? "");
  const [det, setDet] = useState(detail ?? "");
  const [note, setNote] = useState(memo ?? "");
  const [searching, setSearching] = useState(false);
  const [agree, setAgree] = useState(Boolean(address));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const detRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searching || !box.current) return;
    let alive = true;
    loadPostcode()
      .then(() => {
        if (!alive || !box.current || !window.daum) return;
        box.current.innerHTML = "";
        new window.daum.Postcode({
          width: "100%",
          height: "100%",
          oncomplete: (d) => {
            setAddr(`${d.roadAddress || d.jibunAddress}${d.buildingName ? ` (${d.buildingName})` : ""}`);
            setSearching(false);
            setTimeout(() => detRef.current?.focus(), 50);
          },
        }).embed(box.current);
      })
      .catch(() => {
        setError("주소 검색을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        setSearching(false);
      });
    return () => {
      alive = false;
    };
  }, [searching]);

  const save = async () => {
    if (busy) return;
    if (!addr) return setError("주소 검색으로 주소를 골라주세요.");
    if (!agree) return setError("방문 주소 수집·이용에 동의해주세요.");
    setBusy(true);
    setError("");
    try {
      await quoteApi(`/${encodeURIComponent(id)}/address`, { method: "PUT", body: JSON.stringify({ address: addr, detail: det, memo: note, agree }) });
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e instanceof QuoteApiError ? e.message : "저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (!editing && address) {
    return (
      <section className="addr addr--done" aria-labelledby="addr-title">
        <div className="addr-head">
          <p className="addr-kicker">방문 주소</p>
          <button type="button" className="addr-edit" onClick={() => setEditing(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
            주소 변경
          </button>
        </div>
        <div className="addr-show">
          <span className="addr-pin" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
          </span>
          <div>
            <h2 id="addr-title" className="addr-value">
              {address}
            </h2>
            {detail && <p className="addr-detail">{detail}</p>}
            {memo && (
              <p className="addr-memo">
                <span>메모</span> {memo}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="addr" aria-labelledby="addr-title">
      <p className="addr-kicker">실측 방문 준비</p>
      <h2 id="addr-title" className="addr-title">
        방문 주소를 알려주세요
      </h2>
      <p className="addr-desc">{intro ?? "담당자가 실측하러 갈 주소예요."}</p>

      <div className="addr-field">
        <span className="addr-label">
          주소 <em className="q-req">*필수</em>
        </span>
        <button type="button" className={`addr-search${addr ? " has-value" : " is-empty"}`} onClick={() => setSearching(true)}>
          {addr || "도로명·건물명·지번으로 주소 검색"}
          <span aria-hidden="true">{addr ? "다시 검색" : "검색"}</span>
        </button>
      </div>
      {searching && (
        <div className="addr-popup">
          <div className="addr-popup__bar">
            <span>주소 검색</span>
            <button type="button" className="q-link" onClick={() => setSearching(false)}>
              닫기
            </button>
          </div>
          <div ref={box} className="addr-popup__box" />
        </div>
      )}

      <label className="addr-field">
        <span className="addr-label">상세 주소</span>
        <input ref={detRef} className="ui-input" value={det} maxLength={100} placeholder="동·호수 (단독주택이면 비워도 돼요)" onChange={(e) => setDet(e.target.value)} />
      </label>
      <label className="addr-field">
        <span className="addr-label">방문 메모</span>
        <textarea
          className="ui-input"
          rows={2}
          value={note}
          maxLength={300}
          placeholder="예: 대문 비밀번호, 주차 가능 위치, 반려견 있음"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <label className="addr-agree">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          <strong>
            방문 주소 수집·이용 동의 <em className="q-req">*필수</em>
          </strong>
          <small>테두리 담당자가 실측 방문과 견적 안내에만 쓰고, 신청 처리가 끝나고 1년 뒤 지워요.</small>
        </span>
      </label>

      {error && (
        <p className="my-error" role="alert">
          {error}
        </p>
      )}
      <div className="addr-actions">
        {address && (
          <button type="button" className="btn btn--secondary" onClick={() => setEditing(false)} disabled={busy}>
            취소
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={busy}>
          {busy ? "저장하는 중…" : "주소 저장"}
        </button>
      </div>
    </section>
  );
}
