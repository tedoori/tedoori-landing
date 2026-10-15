import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { JOURNAL_ARTICLES } from "./data";
import "./journal.css";

export const metadata: Metadata = {
  title: "전원주택 조경 정보 | 테두리",
  description: "전원주택 조경견적, 잔디·자갈·디딤석 선택과 마당 부분조경 정보를 테두리가 쉽게 안내해요.",
};

export default function JournalPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="journal-page">
        <section className="journal-hero" aria-labelledby="journal-title">
          <div className="container journal-hero__inner">
            <p className="journal-eyebrow">TEDOORI JOURNAL</p>
            <h1 id="journal-title" className="title-l">전원주택 조경,<br />필요한 것부터 알아봐요.</h1>
            <p className="lead">마당을 어디부터 바꿀지 막막할 때, 테두리 조경견적을 준비하는 데 필요한 정보를 모았어요.</p>
          </div>
        </section>
        <section className="section" aria-labelledby="journal-list-title">
          <div className="container journal-content">
            <div className="journal-section-head">
              <div>
                <p className="journal-eyebrow">GUIDE FOR YOUR YARD</p>
                <h2 id="journal-list-title" className="journal-title">조경을 시작하기 전에</h2>
              </div>
              <p className="journal-section-head__text">식재·잔디·자갈·판석·디딤석부터 견적 준비까지, 지금 필요한 글부터 읽어보세요.</p>
            </div>
            <div className="journal-grid">
              {JOURNAL_ARTICLES.map((article) => (
                <article key={article.slug} className="journal-card">
                  <Link href={`/journal/${article.slug}`} className="journal-card__link">
                    <span className="journal-card__category">{article.category}</span>
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                    <span className="journal-card__meta">{article.readingTime}<span aria-hidden="true"> · </span>읽어보기 →</span>
                  </Link>
                </article>
              ))}
            </div>
            <div className="journal-cta">
              <div>
                <strong>우리 집 마당에 맞는 조경을 상담해볼까요?</strong>
                <p>준비된 정보가 많지 않아도 괜찮아요. 사진 한 장부터 시작할 수 있어요.</p>
              </div>
              <Link href="/quote" className="btn btn--primary">무료 견적 시작하기</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
