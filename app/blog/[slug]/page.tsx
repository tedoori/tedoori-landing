import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { JOURNAL_ARTICLES, getArticle } from "../../journal/data";
import "../../journal/journal.css";

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

  return (
    <>
      <SiteHeader />
      <main id="main" className="journal-page">
        <article className="journal-article">
          <header className="journal-article__hero">
            <div className="container journal-article__inner">
              <Link href="/blog" className="journal-back">← 블로그로 돌아가기</Link>
              <p className="journal-eyebrow">{article.category} · {article.readingTime}</p>
              <h1 className="title-l">{article.title}</h1>
              <p className="lead">{article.excerpt}</p>
            </div>
          </header>
          <div className="container journal-article__body">
            {article.sections.map((section) => (
              <section key={section.heading} className="journal-article__section">
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            <aside className="journal-article__cta">
              <strong>우리 집 마당도 상담해볼까요?</strong>
              <p>사진과 지금 불편한 점만 알려주면 전원주택 조경 상담을 시작할 수 있어요.</p>
              <Link href="/quote" className="btn btn--primary">테두리 조경견적 신청하기</Link>
            </aside>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
