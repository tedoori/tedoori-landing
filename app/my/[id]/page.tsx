import type { Metadata } from "next";
import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { ToDashboard } from "./ToDashboard";
import "../my.css";

// 예전 주소(메일 버튼 등) → 내 신청 대시보드의 해당 신청으로
export const metadata: Metadata = {
  title: "내 신청 · 테두리",
  description: "이메일 인증 후 본인의 테두리 견적 신청을 확인합니다.",
  robots: { index: false },
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <div className="container my-page">
          <ToDashboard id={id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
