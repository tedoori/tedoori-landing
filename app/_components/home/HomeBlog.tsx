"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./home-blog.css";

type Post = { slug: string; title: string; category: string; excerpt: string; cover?: string; readingTime: string };

/**
 * 08 · 조경 블로그 (최근 글 3개)
 * 화면에 들어오면 사진이 아래에서 위로 열리듯 차례로 드러남 (다른 섹션과 겹치지 않는 연출)
 */
export function HomeBlog({ posts }: { posts: Post[] }) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0, rootMargin: "0px 0px -20% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (!posts.length) return null;

  return (
    <section ref={ref} className={`hb${on ? " is-on" : ""}`} aria-labelledby="home-blog-title">
      <div className="container hb-inner">
        <div className="hb-head">
          <div>
            <p className="hb-eyebrow">TEDOORI BLOG</p>
            <h2 id="home-blog-title" className="hb-title">
              전원주택 조경,
              <br />
              필요한 것부터 알아봐요.
            </h2>
          </div>
          <Link href="/blog" className="hb-more">
            블로그 더 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul className="hb-list">
          {posts.slice(0, 3).map((p, n) => (
            <li key={p.slug} style={{ "--n": n } as React.CSSProperties}>
              <Link href={`/blog/${p.slug}`} className="hb-card">
                <span className="hb-card__img">
                  <img src={p.cover ?? "/service/garden-end-s.webp"} alt="" width={900} height={560} loading="lazy" decoding="async" />
                </span>
                <span className="hb-meta">
                  <em>{p.category}</em>
                  {p.readingTime}
                </span>
                <strong>{p.title}</strong>
                <span className="hb-excerpt">{p.excerpt}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
