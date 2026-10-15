import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";

export const metadata: Metadata = { title: "내 신청 · 테두리" };

export default function MyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <div className="container stack my-page" style={{ gap: 18 }}>
          <h1 className="title-l">
            신청 내용은
            <br />
            접수 메일에서 확인해요.
          </h1>
          <p className="lead">
            신청할 때 쓴 이메일로 접수번호와 신청 내용을 보내드렸어요. 진행 안내와 견적도 같은 이메일로 전해드려요.
          </p>
          <ul className="scope-list">
            <li className="scope-row">
              <p className="scope-row__name">메일이 안 보이면</p>
              <p className="scope-row__items">
                받은편지함과 스팸함에서 ‘테두리’ 또는 ‘견적 신청이 접수됐어요’로 찾아보세요.
              </p>
            </li>
            <li className="scope-row">
              <p className="scope-row__name">수정·취소하려면</p>
              <p className="scope-row__items">접수 메일에 회신하거나 문의하기로 알려주세요.</p>
            </li>
            <li className="scope-row">
              <p className="scope-row__name">본인 확인</p>
              <p className="scope-row__items">
                접수번호만으로는 신청 내용을 보여드리거나 바꾸지 않아요. 신청한 이메일로 확인해요.
              </p>
            </li>
          </ul>
          <div className="btn-row btn-row--start">
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
