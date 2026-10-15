"use client";

import { useRef, useState } from "react";
import { useAutoPlay } from "./useAutoPlay";
import { Button } from "../ui";
import "./closing.css";

const FAQ = [
  {
    q: "무엇을 바꿀지 정확히 모르겠어요.",
    a: "현재 상태와 원하는 모습을 적어주세요. 필요한 작업은 테두리가 함께 정리해드려요.",
  },
  {
    q: "견적 요청에 비용이 드나요?",
    a: "집주인의 견적 요청은 무료예요. 견적을 확인한 뒤 진행 여부를 결정하시면 돼요.",
  },
  {
    q: "어느 지역에서 이용할 수 있나요?",
    a: "현재 서울·경기·인천 지역의 부분조경 요청을 받고 있어요.",
  },
  {
    q: "사진이나 정확한 크기가 없어도 되나요?",
    a: "네. 알고 있는 내용부터 신청하고, 견적에 필요한 정보는 확인 과정에서 보완할 수 있어요.",
  },
  {
    q: "자재만 요청할 수도 있나요?",
    a: "가능해요. 자재만, 자재와 배송, 시공 포함 중 필요한 범위를 골라 요청해주세요.",
  },
  {
    q: "신청 내용을 바꾸거나 취소하려면요?",
    a: "접수 메일에 회신하거나 문의하기로 알려주세요.",
  },
];

type Msg = { who: "me" | "bot" | "typing"; text: string; id: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * 08 · 마무리 (Mammut·DO XR 오마주)
 * 숲색 카드가 커지며 화면을 채우고, FAQ는 대화 말풍선
 */
export function Closing() {
  // 화면에 들어오면 숲색 카드가 한 번 부드럽게 커지며 화면을 채움 (스크롤로 조작하지 않음)
  const sec = useAutoPlay<HTMLElement>(1100, (p) => {
    sec.current?.style.setProperty("--enter", (1 - Math.pow(1 - p, 3)).toFixed(4));
  }, 0.15);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [asked, setAsked] = useState<number[]>([]);
  const nextId = useRef(0);


  const ask = (i: number) => {
    if (asked.includes(i)) return;
    setAsked((a) => [...a, i]);
    const me = { who: "me" as const, text: FAQ[i].q, id: nextId.current++ };
    const typing = { who: "typing" as const, text: "", id: nextId.current++ };
    setMsgs((m) => [...m, me, typing]);
    window.setTimeout(() => {
      setMsgs((m) => m.map((x) => (x.id === typing.id ? { who: "bot", text: FAQ[i].a, id: x.id } : x)));
    }, 900);
  };

  return (
    <section ref={sec} className="cl" aria-labelledby="closing-title">
      <div className="cl-card">
        <img className="cl-bg" src="/dio/final.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <div className="cl-inner container">
          <div className="cl-head">
            <h2 id="closing-title" className="cl-title">
              준비된 정보부터
              <br />
              무료 견적을 시작하세요.
            </h2>
            <p className="cl-lead">결정은 견적을 본 뒤에 해도 돼요.</p>
            <div className="cl-cta">
              <Button href="/quote" size="l" className="btn--glow">
                무료 견적 시작하기
              </Button>
            </div>
          </div>

          <div className="cl-chat">
            <div className="cl-chat__log" aria-live="polite">
              {msgs.map((m) =>
                m.who === "typing" ? (
                  <p key={m.id} className="cl-msg cl-msg--bot cl-msg--typing" aria-label="답변 입력 중">
                    <span />
                    <span />
                    <span />
                  </p>
                ) : (
                  <p key={m.id} className={`cl-msg cl-msg--${m.who}`}>
                    {m.who === "bot" && <img src="/figma/logo-mark.svg" alt="" className="cl-avatar" />}
                    {m.text}
                  </p>
                ),
              )}
            </div>
            <div className="cl-chat__ask">
              {FAQ.map((f, i) => (
                <button key={f.q} type="button" className="cl-q" onClick={() => ask(i)} disabled={asked.includes(i)}>
                  {f.q}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
