import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { getPosts } from "../../lib/blog";
import { BlogList } from "./BlogList";
import "./blog.css";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "전원주택 조경 블로그 | 테두리",
  description: "전원주택 조경견적, 잔디·자갈·디딤석 선택과 마당 부분조경 정보를 테두리가 쉽게 안내해요.",
};

// 관리자가 글을 저장하면 바로 새로 만들고(revalidatePath), 그 밖에는 1분마다 확인
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <SiteHeader />
      <main id="main" className="bl">
        <BlogList articles={posts} />
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
