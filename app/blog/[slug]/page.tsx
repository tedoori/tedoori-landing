import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { getPosts } from "../../../lib/blog";
import "../blog.css";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getPosts()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = (await getPosts()).find((a) => a.slug === slug);
  if (!article) return {};
  return { title: `${article.title} | 테두리`, description: article.excerpt };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const JOURNAL_ARTICLES = await getPosts();
  const article = JOURNAL_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  // 네이버 블로그처럼 글 아래 이전 글·다음 글 + 목록
  const idx = JOURNAL_ARTICLES.findIndex((a) => a.slug === article.slug);
  const prev = JOURNAL_ARTICLES[idx + 1];
  const next = JOURNAL_ARTICLES[idx - 1];
  const related = JOURNAL_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <>
      <SiteHeader />
      <main id="main" className="bl">
        <article>
          <header className="bl-article__hero">
            <div className="container bl-article__inner">
              <nav className="bl-crumb" aria-label="경로">
                <Link href="/blog">블로그</Link>
                <span aria-hidden="true">›</span>
                <Link href={`/blog?cat=${encodeURIComponent(article.category)}`}>{article.category}</Link>
                <span className="bl-crumb__time">{article.readingTime}</span>
              </nav>
              <h1>{article.title}</h1>
              <p className="lead">{article.excerpt}</p>
              <figure className="bl-article__cover">
                <img src={article.cover ?? "/service/garden-end-s.webp"} alt="" width={900} height={506} fetchPriority="high" />
              </figure>
            </div>
          </header>
          <div className="container bl-article__body">
            <div className="bl-prose" dangerouslySetInnerHTML={{ __html: article.html }} />
            <aside className="bl-cta">
              <div>
                <strong>우리 집 마당도 상담해볼까요?</strong>
                <p>사진과 지금 불편한 점만 알려주면 전원주택 조경 상담을 시작할 수 있어요.</p>
              </div>
              <Link href="/quote" className="btn btn--primary">테두리 조경견적 신청하기</Link>
            </aside>
            <nav className="bl-postnav" aria-label="다른 글">
              <ul>
                {[
                  ["이전 글", prev],
                  ["다음 글", next],
                ].map(([label, a]) => (
                  <li key={label as string}>
                    <span className="bl-postnav__label">{label as string}</span>
                    {a && typeof a !== "string" ? (
                      <Link href={`/blog/${a.slug}`}>
                        <strong>{a.title}</strong>
                        <span className="bl-postnav__cat">{a.category}</span>
                      </Link>
                    ) : (
                      <span className="bl-postnav__none">{label === "이전 글" ? "첫 글이에요" : "가장 최근 글이에요"}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="bl-postnav__actions">
                <Link href="/blog" className="bl-listbtn">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                  목록
                </Link>
                <Link href={`/blog?cat=${encodeURIComponent(article.category)}`} className="bl-catmore">
                  {article.category} 글 더 보기 ›
                </Link>
              </div>
            </nav>
            {related.length > 0 && (
              <nav className="bl-related" aria-labelledby="related-title">
                <h2 id="related-title">함께 읽으면 좋은 글</h2>
                <ul>
                  {related.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/blog/${a.slug}`} className="bl-card">
                        <span className="bl-card__img">
                          <img src={a.cover ?? "/service/garden-end-s.webp"} alt="" width={900} height={560} loading="lazy" decoding="async" />
                        </span>
                        <span className="bl-meta"><em>{a.category}</em>{a.readingTime}</span>
                        <strong>{a.title}</strong>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
