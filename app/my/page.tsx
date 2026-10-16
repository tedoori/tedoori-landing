import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { MyApplications } from "./MyApplications";
import "./my.css";
import "./dash.css";
import "../quote/quote.css";

export const metadata: Metadata = {
  title: "조경견적 신청내역 확인 | 테두리",
  description: "테두리에 조경견적을 신청한 고객이 이메일 인증으로 진행 상태와 신청 내역을 확인할 수 있어요.",
};

export default function MyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <div className="container my-page">
          <MyApplications />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
