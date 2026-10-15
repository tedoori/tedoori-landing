"use client";

import { useEffect, useRef, useState } from "react";
import { YARD_STEPS } from "../yard/steps";
import "./garden-walk.css";

type Work = "디딤석" | "자갈" | "잔디" | "화단" | "식재";
const RATE = 1.5;
const ORDER: Work[] = ["디딤석", "자갈", "잔디", "화단", "식재"];
// 설명은 히어로 단계 문구 그대로
const BODY = Object.fromEntries(YARD_STEPS.map((s) => [s.id, s.body])) as Record<string, string>;

// 영상 진행(0~1) 기준 자막 구간 — 영상: 대문이 열림 → 무릎 높이로 디딤석을 따라감 → 자갈·잔디·화단 → 하늘로 올라가 전체 배치
function captionAt(q: number): number {
  if (q < 0.26) return -1;
  if (q < 0.46) return 0;
  if (q < 0.56) return 1;
  if (q < 0.62) return 2;
  if (q < 0.84) return 3;
  if (q < 0.97) return 4;
  return -1;
}

/**
 * 02 · 대문을 열고 (실사 영상)
 * Supaste처럼: 겹 액자 프레임 안에서 화면에 들어오면 자동 재생(반복), 나가면 멈춤. 스크롤로 넘기지 않음.
 */
export function GardenWalk() {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [cap, setCap] = useState(-1);
  const [reached, setReached] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [shown, setShown] = useState(false);
  const [load, setLoad] = useState(false);
  const userPaused = useRef(false);
  const inView = useRef(false);

  useEffect(() => {
    const el = box.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // 가까워지면 영상 불러오기, 절반 이상 보이면 재생
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setLoad(true), { rootMargin: "100% 0px" });
    const view = new IntersectionObserver(
      ([e]) => {
        const v = video.current;
        if (!v) return;
        inView.current = e.isIntersecting;
        if (e.isIntersecting) setShown(true);
        if (e.isIntersecting && !reduce && !userPaused.current) v.play().catch(() => {});
        if (!e.isIntersecting) v.pause();
      },
      { threshold: 0.5 },
    );
    near.observe(el);
    view.observe(el);
    return () => {
      near.disconnect();
      view.disconnect();
    };
  }, []);

  // 나중에 붙인 <source>를 브라우저가 읽도록
  useEffect(() => {
    if (load) video.current?.load();
  }, [load]);

  const onTime = () => {
    const v = video.current;
    if (!v || !v.duration) return;
    const c = captionAt(v.currentTime / v.duration);
    setCap(c);
    // 처음으로 돌아가면 진행 점도 다시 시작
    setReached((r) => (c === -1 && v.currentTime < 1 ? -1 : Math.max(r, c)));
  };

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const work = cap >= 0 ? ORDER[cap] : null;

  return (
    <section className="gw" aria-labelledby="reason-title">
      <div className="container">
        <div className="gw-copy">
          <h2 id="reason-title" className="title-l">
            대문을 열고,
            <br />
            달라진 집을 마주하는 순간.
          </h2>
          <p className="lead">
            마당 전부가 아닌,
            <br />
            매일 눈에 들어오는 한곳부터.
          </p>
        </div>

        <div className={`gw-shell${shown ? " is-in" : ""}`}>
        <div className="gw-frame" ref={box}>
          <video
            ref={video}
            className="gw-video"
            poster="/walk/poster.webp"
            muted
            loop
            playsInline
            preload={load ? "auto" : "none"}
            onLoadedMetadata={(e) => {
              // 원본보다 빠르게 (답답하지 않게)
              e.currentTarget.defaultPlaybackRate = RATE;
              e.currentTarget.playbackRate = RATE;
            }}
            onCanPlay={(e) => {
              // 파일이 준비되는 순간 화면 안이면 재생
              const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              if (inView.current && !reduce && !userPaused.current) e.currentTarget.play().catch(() => {});
            }}
            onTimeUpdate={onTime}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            aria-label="대문이 열리고 디딤석을 따라 들어가 자갈·잔디·화단을 가까이 본 뒤 정원 전체를 위에서 보는 영상"
          >
            {load && <source src="/walk/story.mp4" type="video/mp4" />}
            {load && <source src="/walk/story.webm" type="video/webm" />}
          </video>
          <div className="gw-cap" aria-live="polite">
            {work && (
              <div key={work} className="gw-cap__in">
                <span className="gw-cap__idx">
                  {String(cap + 1).padStart(2, "0")} / {String(ORDER.length).padStart(2, "0")}
                </span>
                <strong>{work}</strong>
                <p>{BODY[work]}</p>
              </div>
            )}
          </div>
          <div className="gw-dots" aria-hidden="true">
            {ORDER.map((w, i) => (
              <span key={w} className={i <= reached ? "is-on" : ""} />
            ))}
          </div>
          <button type="button" className="gw-play" onClick={toggle} aria-label={playing ? "일시정지" : "재생"}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
              </svg>
            )}
          </button>
        </div>
        </div>

        <p className="note gw-note">공간 연출 이미지입니다. 실제 작업은 현장 조건을 확인해 정해요.</p>
      </div>
    </section>
  );
}
