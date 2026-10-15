import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { MyApplications } from "./MyApplications";
import "./my.css";

export const metadata: Metadata = {
  title: "조경견적 신청내역 확인 | 테두리",
  description: "테두리에 조경견적을 신청한 고객이 이메일 인증으로 진행 상태와 신청 내역을 확인할 수 있어요.",
};

export default function MyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <div className="container stack my-page" style={{ gap: 18 }}>
          <h1 className="title-l">신청 내용은<br />안전하게 확인해요.</h1>
          <p className="lead">신청 이메일로 확인 코드를 받은 뒤, 내 견적 신청 목록을 확인할 수 있어요.</p>
          <MyApplications />
          <div className="btn-row">
            <Link href="/contact" className="btn btn--secondary">
              신청 이메일을 찾기 어려워요
            </Link>
            <Link href="/quote" className="btn btn--primary">
              새 견적 신청하기
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
