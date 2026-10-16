"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "../../../lib/supabase";

const day = (v: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(new Date(v));

/** 완료 보고: 업체·담당자가 남긴 말 + 작업 완료 사진 */
export function CompletionCard({ note, photos, at, careSlugs }: { note: string | null; photos: { path: string; url: string | null }[]; at: string | null; careSlugs?: string[] | null }) {
  const shown = photos.filter((p) => p.url);
  return (
    <section className="done-card" aria-labelledby="done-title">
      <header className="done-card__head">
        <span className="done-card__badge" aria-hidden="true">
          ✓
        </span>
        <div>
          <p className="done-card__kicker">완료 보고{at ? ` · ${day(at)}` : ""}</p>
          <h2 id="done-title" className="done-card__title">
            새 정원이 완성됐어요
          </h2>
        </div>
      </header>
      {shown.length > 0 && (
        <ul className={`done-card__photos is-${Math.min(shown.length, 3)}`}>
          {shown.map((p, i) => (
            <li key={p.path}>
              <a href={p.url!} target="_blank" rel="noopener noreferrer">
                <img src={p.url!} alt={`작업 완료 사진 ${i + 1}`} loading="lazy" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {note && (
        <div className="done-card__note">
          <p className="done-card__from">담당자가 남긴 말</p>
          <p>{note}</p>
        </div>
      )}
      <CareLinks slugs={careSlugs ?? []} />
    </section>
  );
}

type Care = { slug: string; title: string; category: string; cover_url: string | null };

/** 완료 뒤 관리법: 관리자가 고른 글(고른 순서). 안 골랐으면 관리 방법 → 셀프 시공 최신 3개, 둘 다 없으면 보이지 않음 */
function CareLinks({ slugs }: { slugs: string[] }) {
  const [posts, setPosts] = useState<Care[]>([]);
  const key = slugs.join(",");
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const base = sb.from("blog_posts").select("slug, title, category, cover_url").eq("published", true);
    // 안 골랐으면: 관리 방법 글 먼저, 모자라면 셀프 시공 글로 채워 최신순 3개
    const query = key ? base.in("slug", key.split(",")) : base.in("category", ["관리 방법", "셀프 시공"]).order("published_at", { ascending: false }).limit(6);
    void query.then(({ data }) => {
      const rows = (data ?? []) as Care[];
      setPosts(
        key
          ? key.split(",").map((v) => rows.find((r) => r.slug === v)).filter((r): r is Care => !!r)
          : [...rows.filter((r) => r.category === "관리 방법"), ...rows.filter((r) => r.category !== "관리 방법")].slice(0, 3),
      );
    });
  }, [key]);
  if (!posts.length) return null;
  return (
    <div className="care">
      <p className="care__title">새 정원, 이렇게 관리해요</p>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="care__link" target="_blank">
              <span className="care__icon" aria-hidden="true">
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" />
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
                    <path d="M5 19 13 11" />
                  </svg>
                )}
              </span>
              <span className="care__txt">
                <small>{p.category} · 테두리 블로그</small>
                <strong>{p.title}</strong>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
