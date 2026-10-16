"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BlogPost } from "../../lib/blog";

const FALLBACK_COVER = "/service/garden-end-s.webp";
// 분류는 고정 목록: 글이 아직 없는 분류도 미리 보여줌 (견적 준비 + 시공 후 관리 + 직접 시공 꿀팁)
export const BLOG_CATEGORIES = ["견적 안내", "자재 선택", "부분조경", "신청 준비", "관리 방법", "셀프 시공"] as const;
const PER_PAGE = 9;

/** 블로그 목록: 검색 + 분류 + 관리자가 고른 큰 글 1개 + 한 페이지 9개, 번호로 넘김 */
export function BlogList({ articles }: { articles: BlogPost[] }) {
  const [cat, setCat] = useState("전체");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // 글 페이지 경로(블로그 › 분류)에서 넘어오면 그 분류로 열기: /blog?cat=자재 선택
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("cat");
    if (c && (BLOG_CATEGORIES as readonly string[]).includes(c)) setCat(c);
  }, []);

  const query = q.trim().toLowerCase();
  const filtering = cat !== "전체" || !!query;
  // 큰 글: 관리자가 고른 글 (없으면 가장 최근 글). 검색·분류 중에는 목록에 섞어서 보여줌
  const featured = filtering ? null : (articles.find((a) => a.featured) ?? articles[0] ?? null);

  const list = useMemo(
    () =>
      articles.filter(
        (a) =>
          a !== featured &&
          (cat === "전체" || a.category === cat) &&
          (!query || `${a.title} ${a.excerpt} ${a.category}`.toLowerCase().includes(query)),
      ),
    [articles, featured, cat, query],
  );
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const go = (n: number) => {
    setPage(n);
    document.getElementById("blog-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* 히어로 하나: 제목·설명·검색, 아래 경계에 분류 탭 */}
      <section className="bl-hero" aria-labelledby="blog-title">
        <div className="container bl-hero__inner">
          <p className="bl-eyebrow">TEDOORI BLOG</p>
          <h1 id="blog-title" className="bl-display">전원주택 조경, 필요한 것부터 알아봐요.</h1>
          <p className="lead">마당을 어디부터 바꿀지 막막할 때,<br className="bl-br-m" /> 테두리 조경견적을 준비하는 데 필요한 정보를 모았어요.</p>
          <label className="bl-search">
            <span className="sr-only">블로그 글 검색</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input type="search" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="궁금한 내용을 검색해보세요" />
          </label>
          <div id="blog-tabs" className="bl-tabs" role="tablist" aria-label="분류">
            {["전체", ...BLOG_CATEGORIES].map((c) => (
              <button key={c} type="button" role="tab" className="bl-tab" aria-selected={cat === c} onClick={() => (setCat(c), setPage(1))}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bl-list" aria-label="블로그 글">
        <div className="container bl-content">
      {featured && cur === 1 && (
        <Link href={`/blog/${featured.slug}`} className="bl-feature">
          <img src={featured.cover ?? FALLBACK_COVER} alt="" width={900} height={560} />
          <span className="bl-feature__body">
            <span className="bl-meta">
              <em>{featured.category}</em>
              {featured.readingTime}
            </span>
            <strong>{featured.title}</strong>
            <span className="bl-excerpt">{featured.excerpt}</span>
            <span className="bl-more">읽어보기 →</span>
          </span>
        </Link>
      )}

      {shown.length > 0 ? (
        <ul className="bl-grid" key={`${cat}-${query}-${cur}`}>
          {shown.map((a, n) => (
            <li key={a.slug} style={{ "--n": n } as React.CSSProperties}>
              <Link href={`/blog/${a.slug}`} className="bl-card">
                <span className="bl-card__img">
                  <img src={a.cover ?? FALLBACK_COVER} alt="" width={900} height={560} loading="lazy" decoding="async" />
                </span>
                <span className="bl-meta">
                  <em>{a.category}</em>
                  {a.readingTime}
                </span>
                <strong>{a.title}</strong>
                <span className="bl-excerpt">{a.excerpt}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !featured && (
          <p className="bl-empty">
            {query ? `'${q.trim()}'에 맞는 글이 아직 없어요. 다른 단어로 찾아보세요.` : `${cat} 글을 준비하고 있어요. 곧 올라와요.`}
          </p>
        )
      )}

      {pages > 1 && (
        <nav className="bl-pages" aria-label="페이지">
          <button type="button" onClick={() => go(cur - 1)} disabled={cur === 1} aria-label="이전 페이지">
            ‹
          </button>
          {Array.from({ length: pages }, (_, n) => n + 1).map((n) => (
            <button key={n} type="button" aria-current={n === cur ? "page" : undefined} onClick={() => go(n)}>
              {n}
            </button>
          ))}
          <button type="button" onClick={() => go(cur + 1)} disabled={cur === pages} aria-label="다음 페이지">
            ›
          </button>
        </nav>
      )}
        </div>
      </section>
    </>
  );
}
