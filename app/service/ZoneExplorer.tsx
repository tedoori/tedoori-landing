"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { WORK_DESC } from "./works";

// 실사 정원 사진 위 표시점(비율). 연출용.
const ZONES = [
  {
    id: "entry",
    name: "현관·진입로",
    title: "들어오는 길과\n현관 옆부터.",
    body: "흙을 밟고 들어오는 길에는 디딤석을, 허전한 현관 옆에는 나무나 작은 화단을 더해요.",
    works: ["디딤석", "식재", "화단"],
    img: "/service/garden-end.webp",
    spots: [
      { work: "디딤석", x: 50, y: 74 },
      { work: "화단", x: 70, y: 52 },
      { work: "식재", x: 76, y: 26 },
    ],
  },
  {
    id: "yard",
    name: "마당 한편",
    title: "비어 있는\n마당 한쪽부터.",
    body: "맨흙이 드러난 자리는 잔디나 자갈로 정리하고, 눈이 가는 곳에 화단을 만들어요.",
    works: ["잔디", "자갈", "화단"],
    img: "/service/look-right.webp",
    spots: [
      { work: "잔디", x: 62, y: 70 },
      { work: "자갈", x: 70, y: 89 },
      { work: "화단", x: 56, y: 53 },
    ],
  },
  {
    id: "edge",
    name: "집의 경계",
    title: "담장과\n울타리를 따라.",
    body: "경계선을 따라 나무를 심거나 길게 화단을 두면 집의 윤곽이 또렷해져요.",
    works: ["식재", "화단"],
    img: "/service/look-left.webp",
    spots: [
      { work: "식재", x: 17, y: 26 },
      { work: "화단", x: 78, y: 62 },
    ],
  },
] as const;

type ZoneId = (typeof ZONES)[number]["id"];

/** 실사 정원 사진에서 공간을 고르면 그 공간 사진으로 천천히 다가가며 바뀜 */
export function ZoneExplorer() {
  const [zoneId, setZoneId] = useState<ZoneId>("entry");
  const zone = ZONES.find((z) => z.id === zoneId)!;
  // 사진 위 점을 누르면 그 작업 설명이 열림. 한 번도 안 눌렀으면 첫 점에 안내 말풍선
  const [spot, setSpot] = useState<string | null>(null);
  const media = useRef<HTMLDivElement>(null);
  // 말풍선이 사진 밖으로 나가면 안쪽으로 밀어 넣음
  useLayoutEffect(() => {
    const m = media.current;
    const t = m?.querySelector<HTMLElement>(".zx-tip");
    if (!m || !t) return;
    t.style.translate = "";
    const a = t.getBoundingClientRect();
    const b = m.getBoundingClientRect();
    const pad = 8;
    let dx = 0;
    let dy = 0;
    if (a.left < b.left + pad) dx = b.left + pad - a.left;
    else if (a.right > b.right - pad) dx = b.right - pad - a.right;
    if (a.top < b.top + pad) dy = b.top + pad - a.top;
    else if (a.bottom > b.bottom - pad) dy = b.bottom - pad - a.bottom;
    if (dx || dy) t.style.translate = `${dx}px ${dy}px`;
  }, [spot, zoneId]);
  const [touched, setTouched] = useState(false);
  const pick = (work: string) => {
    setTouched(true);
    setSpot(work);
  };
  const choose = (id: ZoneId) => {
    setZoneId(id);
    setSpot(null);
  };

  return (
    <div className="zx">
      <div className="zx-stage">
        <div className="zx-media" ref={media}>
        {ZONES.map((z) => (
          <img
            key={z.id}
            src={z.img}
            alt={z.id === zoneId ? `${z.name} 연출 사진` : ""}
            className={`zx-photo${z.id === zoneId ? " is-on" : ""}`}
            width={1800}
            height={1012}
          />
        ))}

        {zone.spots.map((sp, k) => (
          <div
            key={`${zone.id}-${sp.work}`}
            className={`zx-pin${spot === sp.work ? " is-open" : ""}${sp.x > 60 ? " is-left" : ""}${sp.x >= 35 && sp.x <= 60 ? " is-mid" : ""}${sp.y > 65 ? " is-low" : ""}`}
            style={{ left: `${sp.x}%`, top: `${sp.y}%`, "--k": k } as React.CSSProperties}
          >
            <button type="button" className="zx-pin__btn" aria-expanded={spot === sp.work} onClick={() => pick(sp.work)} onMouseEnter={() => pick(sp.work)}>
              <span className="zx-pin__ring" aria-hidden="true" />
              <span className="zx-pin__dot" aria-hidden="true" />
              <span className="sr-only">{sp.work} 설명 보기</span>
            </button>
            {spot === sp.work && (
              <span className="zx-tip" role="status">
                <b>{sp.work}</b>
                {WORK_DESC[sp.work]}
              </span>
            )}
            {!touched && k === 0 && (
              <span className="zx-hint" aria-hidden="true">
                점을 눌러보세요
              </span>
            )}
          </div>
        ))}
        </div>

        <div key={`${zone.id}-card`} className="zx-card" aria-live="polite">
          <p className="zx-card__zone">{zone.name}</p>
          <h3 className="zx-card__title">{zone.title}</h3>
          <p className="zx-card__body">{zone.body}</p>
          <p className="zx-card__works">
            <span>이 공간에 자주 하는 작업</span>
            {zone.works.map((w) => (
              <b key={w} className={spot === w ? "is-on" : ""}>
                {w}
              </b>
            ))}
          </p>
          <Link href={`/quote?work=${encodeURIComponent(zone.works.join(","))}`} className="btn btn--primary btn--m">
            {zone.name} 견적 요청
          </Link>
        </div>
      </div>

      <div className="zx-tabs" role="tablist" aria-label="공간 고르기">
        {ZONES.map((z, i) => (
          <button key={z.id} type="button" role="tab" aria-selected={z.id === zoneId} className={z.id === zoneId ? "is-on" : ""} onClick={() => choose(z.id)}>
            <span className="zx-tabs__no">{String(i + 1).padStart(2, "0")}</span>
            {z.name}
          </button>
        ))}
      </div>
      <p className="note zx-note">공간 연출 예시예요. 실제 시공 가능 여부는 현장 조건을 확인해 정해요.</p>
    </div>
  );
}
