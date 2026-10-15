"use client";

import { useEffect, useRef, useState } from "react";
import { MAT_CATS, MATERIALS, type MatCat } from "./materials";
import "./material-shop.css";

import { DioramaBuild } from "./DioramaBuild";

// 작업마다 대표 사진 (서비스 소개 작업 사진)
// 버튼 순서 = 디오라마 영상 순서
const BUILD: MatCat[] = ["잔디", "디딤석", "자갈", "화단", "식재"];

const THUMB: Record<MatCat, string> = {
  식재: "/service/work-plant.webp",
  잔디: "/service/work-lawn.webp",
  자갈: "/service/work-gravel.webp",
  디딤석: "/service/work-stone.webp",
  화단: "/service/work-bed.webp",
};

/**
 * 04 · 작업 조합 (디오라마 영상)
 * 가만히 두면 잔디 → 디딤석 → 자갈 → 화단 → 식재가 차례로 자동 진행되고, 직접 누르면 자동 진행이 멈춤
 */
export function MaterialShop() {
  const [on, setOn] = useState<MatCat[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [, setFine] = useState(false);
  const [seen, setSeen] = useState(false);
  const [auto, setAuto] = useState(true);

  // 화면 가까이 오면 3D 불러오기
  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setMount(true), { rootMargin: "60% 0px" });
    if (stage.current) io.observe(stage.current);
    // 화면에 보일 때만 자동 진행
    const vis = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.4 });
    if (stage.current) vis.observe(stage.current);
    return () => {
      io.disconnect();
      vis.disconnect();
    };
  }, []);

  // 자동 진행: 각 단계 영상이 다 재생될 시간 + 잠깐 머문 뒤 다음 단계, 끝나면 처음부터 다시
  useEffect(() => {
    if (!auto || !seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wait = on.length === 0 ? 1200 : on.length === BUILD.length ? 4000 : 3000;
    const t = window.setTimeout(() => setOn((p) => (p.length === BUILD.length ? [] : BUILD.slice(0, p.length + 1))), wait);
    return () => window.clearTimeout(t);
  }, [auto, seen, on]);

  // 영상 순서대로만 쌓임: 다음 단계만 누를 수 있고, 고른 단계를 다시 누르면 그 단계부터 뒤가 빠짐
  const toggle = (c: MatCat) => {
    // 직접 누르면 자동 진행은 멈춤
    setAuto(false);
    setOn((p) => {
      const i = BUILD.indexOf(c);
      if (p.includes(c)) return BUILD.slice(0, i);
      return i === p.length ? BUILD.slice(0, i + 1) : p;
    });
  };
  const works = MAT_CATS.filter((c) => on.includes(c));

  return (
    <div className="ms">
      <div className="ms-studio">
        <div className="ms-side">
          <div className="ms-head">
            <h2 id="compose-title" className="ms-title">
              식재도, 잔디도.
              <br />
              함께 바꿔보세요.
            </h2>
            <p className="lead">
              작업을 하나씩 더할 때마다
              <br />
              내 테두리가 어떻게 달라지는지 확인해보세요.
            </p>
          </div>

          <div className="ms-works" role="group" aria-label="작업 고르기">
            {BUILD.map((c, i) => {
              const sel = on.includes(c);
              const next = i === on.length;
              const locked = !sel && !next;
              return (
                <button
                  key={c}
                  type="button"
                  className={`ms-work${sel ? " is-on" : ""}${next ? " is-next" : ""}${locked ? " is-locked" : ""}`}
                  aria-pressed={sel}
                  aria-disabled={locked}
                  onClick={() => toggle(c)}
                >
                  <span className="ms-work__no" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <img src={THUMB[c]} alt="" width={160} height={90} loading="lazy" />
                  <span className="ms-work__text">
                    <strong>{c}</strong>
                    <span>
                      {MATERIALS.filter((m) => m.cat === c)
                        .map((m) => m.name)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="ms-work__mark" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none">
                      {sel ? (
                        <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      )}
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ms-actions">
            <button
              type="button"
              className="btn btn--ghost btn--m"
              onClick={() => {
                setAuto(false);
                setOn([]);
              }}
              disabled={!on.length}
            >
              선택 초기화
            </button>
          </div>
        </div>

        {/* 3D 무대 */}
        <div className="ms-stage" ref={stage}>
          {/* 자동 진행 중이면 표시, 멈췄으면 다시 자동으로 보기 */}
          <button
            type="button"
            className={`ms-auto${auto ? " is-on" : ""}`}
            onClick={() => {
              if (!auto && on.length === BUILD.length) setOn([]);
              setAuto((a) => !a);
            }}
          >
            <span className="ms-auto__dot" aria-hidden="true" />
            {auto ? "자동 재생 중" : "자동으로 보기"}
          </button>
          <div className="ms-stage__head" aria-hidden="true">
            <span />
            <span>
              {on.length} / {MAT_CATS.length}
            </span>
          </div>
          <div className="ms-canvas" aria-label={works.length ? `고른 작업: ${works.join(", ")}` : "아직 아무 작업도 고르지 않은 빈 흙 마당"} role="img">
            {mount && <DioramaBuild on={on} />}
          </div>
          <div className="ms-stage__chips" aria-hidden="true">
            {works.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>
      </div>

      <p className="note ms-demo">연출 예시예요. 실제 적용은 현장 조건을 확인해요.</p>
    </div>
  );
}
