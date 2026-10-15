import type { Metadata } from "next";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { QuoteDetail } from "./QuoteDetail";
import "../my.css";

// 신청 상세는 본인 인증 뒤에만 보이므로 검색 노출 안 함
export const metadata: Metadata = { title: "신청 상세 · 테두리", robots: { index: false } };

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <div className="container my-page">
          <QuoteDetail id={id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
