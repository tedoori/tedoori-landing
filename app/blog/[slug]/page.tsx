import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { JOURNAL_ARTICLES, getArticle } from "../../journal/data";
import "../blog.css";

export function generateStaticParams() {
  return JOURNAL_ARTICLES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return { title: `${article.title} | 테두리`, description: article.excerpt };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = JOURNAL_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <>
      <SiteHeader />
      <main id="main" className="bl">
        <article>
          <header className="bl-article__hero">
            <div className="container bl-article__inner">
              <Link href="/blog" className="bl-back">← 블로그로 돌아가기</Link>
              <span className="bl-meta">
                <em>{article.category}</em>
                {article.readingTime}
              </span>
              <h1>{article.title}</h1>
              <p className="lead">{article.excerpt}</p>
              <figure className="bl-article__cover">
                <img src={article.cover ?? "/service/garden-end-s.webp"} alt="" width={900} height={506} fetchPriority="high" />
              </figure>
            </div>
          </header>
          <div className="container bl-article__body">
            {article.sections.map((section) => (
              <section key={section.heading} className="bl-article__section">
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            <aside className="bl-cta">
              <div>
                <strong>우리 집 마당도 상담해볼까요?</strong>
                <p>사진과 지금 불편한 점만 알려주면 전원주택 조경 상담을 시작할 수 있어요.</p>
              </div>
              <Link href="/quote" className="btn btn--primary">테두리 조경견적 신청하기</Link>
            </aside>
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
