"use client";

import Link from "next/link";
import { useState } from "react";
import type { JournalArticle } from "../journal/data";

const FALLBACK_COVER = "/service/garden-end-s.webp";

/** 블로그 목록: 분류 고르기 + 맨 앞 글 크게 + 나머지 카드 */
export function BlogList({ articles }: { articles: JournalArticle[] }) {
  const cats = ["전체", ...new Set(articles.map((a) => a.category))];
  const [cat, setCat] = useState("전체");
  const list = cat === "전체" ? articles : articles.filter((a) => a.category === cat);
  const [first, ...rest] = list;

  return (
    <>
      <div className="bl-cats" role="group" aria-label="분류">
        {cats.map((c) => (
          <button key={c} type="button" className="bl-cat" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {first && (
        <Link href={`/blog/${first.slug}`} className="bl-feature" key={`f-${cat}`}>
          <img src={first.cover ?? FALLBACK_COVER} alt="" width={900} height={560} />
          <span className="bl-feature__body">
            <span className="bl-meta">
              <em>{first.category}</em>
              {first.readingTime}
            </span>
            <strong>{first.title}</strong>
            <span className="bl-excerpt">{first.excerpt}</span>
            <span className="bl-more">읽어보기 →</span>
          </span>
        </Link>
      )}

      {rest.length > 0 && (
        <ul className="bl-grid" key={`g-${cat}`}>
          {rest.map((a, n) => (
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
      )}
    </>
  );
}
