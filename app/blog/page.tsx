import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { JOURNAL_ARTICLES } from "../journal/data";
import { BlogList } from "./BlogList";
import "./blog.css";

export const metadata: Metadata = {
  title: "전원주택 조경 블로그 | 테두리",
  description: "전원주택 조경견적, 잔디·자갈·디딤석 선택과 마당 부분조경 정보를 테두리가 쉽게 안내해요.",
};

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bl">
        <BlogList articles={JOURNAL_ARTICLES} />
        <div className="container">
          <div className="bl-cta">
            <div>
              <strong>우리 집 마당에 맞는 조경을 상담해볼까요?</strong>
              <p>준비된 정보가 많지 않아도 괜찮아요. 사진 한 장부터 시작할 수 있어요.</p>
            </div>
            <Link href="/quote" className="btn btn--primary">
              무료 견적 시작하기
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
