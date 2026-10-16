"use client";

import { Nanum_Pen_Script } from "next/font/google";
import { Fragment } from "react";
import { useAutoPlay } from "./useAutoPlay";
import "./note-example.css";

const pen = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap", preload: false });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

// [ ] 안은 형광펜(메모) · 밑줄(포스트잇). 첫 세트는 와이어프레임 문구, 둘째·셋째는 예시(검토 필요)
const SETS = [
  {
    memo: "비가 오면 [현관 앞 흙]을 밟게 돼요. 이 길에 [디딤석]을 놓고 싶어요.",
    check: "[작업 위치]와 [길의 크기], [기존 바닥 상태]를 살펴봐요. 필요한 정보가 더 있으면 한 번에 요청해요.",
  },
  {
    memo: "마당 한쪽이 [비만 오면 질척거려요]. 이 자리에 [잔디]를 깔고 싶어요.",
    check: "[깔 면적]과 [물 빠짐], [해가 드는 시간]을 확인해요.",
  },
  {
    memo: "현관 옆이 [허전해 보여요]. [작은 화단]과 [나무 한두 그루]를 두고 싶어요.",
    check: "[화단 크기]와 [원하는 꽃], [나무 높이]를 확인해요.",
  },
];

/** "[강조]" 표시를 형광펜/밑줄로 바꿔 그림. k: 강조마다 쓸 CSS 변수 이름 */
function Marked({ text, tag, vars }: { text: string; tag: "mark" | "u"; vars: string[] }) {
  let n = 0;
  return (
    <>
      {text.split(/(\[[^\]]+\])/).map((part, i) => {
        if (!part.startsWith("[")) return <Fragment key={i}>{part}</Fragment>;
        const v = vars[Math.min(n++, vars.length - 1)];
        const style = { "--k": `var(${v}, 1)` } as React.CSSProperties;
        return tag === "mark" ? (
          <mark key={i} className="ne-hl" style={style}>
            {part.slice(1, -1)}
          </mark>
        ) : (
          <u key={i} style={style}>
            {part.slice(1, -1)}
          </u>
        );
      })}
    </>
  );
}

/**
 * 03 · 요청사항 작성 예시 (Applied Imagination 오마주 — 종이 소품)
 * 메모 3장이 차례로 떨어지고 → 중요한 말에 형광펜 → "확인할 부분" 포스트잇이 붙으며 밑줄
 */
export function NoteExample() {
  // 화면에 들어오면 4초 남짓 동안 자동으로: 메모가 차례로 떨어지고 형광펜·포스트잇·밑줄
  const track = useAutoPlay<HTMLDivElement>(4200, (p) => {
    const el = track.current;
    if (!el) return;
    const set = (k: string, v: number) => el.style.setProperty(k, v.toFixed(4));
    set("--head", seg(p, 0, 0.06));
    SETS.forEach((_, i) => {
      const o = 0.04 + i * 0.3;
      set(`--d${i}`, seg(p, o, o + 0.07)); // 메모 떨어짐
      set(`--a${i}`, seg(p, o + 0.08, o + 0.13)); // 형광펜 1
      set(`--b${i}`, seg(p, o + 0.13, o + 0.17)); // 형광펜 2
      set(`--s${i}`, seg(p, o + 0.17, o + 0.21)); // 포스트잇
      set(`--x${i}`, seg(p, o + 0.21, o + 0.23)); // 밑줄 1~3
      set(`--y${i}`, seg(p, o + 0.23, o + 0.25));
      set(`--z${i}`, seg(p, o + 0.25, o + 0.27));
    });
  });

  return (
    <section className="ne" aria-labelledby="example-title">
      <div className="ne-track" ref={track}>
        <div className="ne-stage container">
          <div className="ne-head">
            <h2 id="example-title" className="ne-title">
              “현관으로 들어가는 길만
              <br />
              손보고 싶어요.”
            </h2>
            <p className="lead">자재 이름 대신, 바라는 모습을 적어주세요.</p>
          </div>

          <div className="ne-desk">
            {SETS.map((s, i) => (
              <div key={i} className={`ne-set ne-set--${i}`} style={{ "--d": `var(--d${i}, 1)`, "--s": `var(--s${i}, 1)`, "--nx": i < SETS.length - 1 ? `var(--d${i + 1}, 0)` : "0" } as React.CSSProperties}>
                <article className={`ne-paper ${pen.className}`}>
                  <span className="ne-tape" aria-hidden="true" />
                  <p className="ne-paper__label">내가 바꾸고 싶은 부분</p>
                  <p className="ne-paper__text">
                    <Marked text={s.memo} tag="mark" vars={[`--a${i}`, `--b${i}`]} />
                  </p>
                </article>
                <article className="ne-postit">
                  <p className="ne-postit__label">견적 전에 확인할 부분</p>
                  <p className="ne-postit__text">
                    <Marked text={s.check} tag="u" vars={[`--x${i}`, `--y${i}`, `--z${i}`]} />
                  </p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
