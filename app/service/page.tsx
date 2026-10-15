import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { EtcSticker, PrepFan, ScopePicker, WorkPanels } from "./ServiceParts";
import { ZoneExplorer } from "./ZoneExplorer";
import "./service.css";

export const metadata: Metadata = {
  title: "서비스 소개 · 테두리",
  description: "식재·잔디·자갈·디딤석·화단. 서울·경기·인천 단독·전원주택의 필요한 곳부터 하는 부분조경.",
};

// 문구는 와이어프레임 그대로, 연출은 섹션마다 다르게
export default function ServicePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="sv">
        {/* 공간 고르기: 실사 정원 사진 위에서 */}
        <section className="sv-hero" aria-labelledby="service-title">
          <div className="container">
            <div className="sv-hero__head">
              <h1 id="service-title" className="sv-display">
                우리 집,
                <br />
                어디부터 바꿔볼까요?
              </h1>
              <p className="lead">
                정원 전체를 고치지 않아도 돼요.
                <br />
                바꾸고 싶은 곳부터 눌러보세요.
              </p>
            </div>
            <ZoneExplorer />
          </div>
        </section>

        {/* 작업 종류: 사진 패널이 하나씩 펼쳐짐 */}
        <section className="sv-works" aria-labelledby="works-title">
          <WorkPanels />
        </section>

        {/* 범위: 자재 → 배송 → 시공 막대 */}
        <section className="section sv-scope" aria-labelledby="scope-title">
          <div className="container sv-scope__grid">
            <div className="sv-scope__head">
              <h2 id="scope-title" className="sv-title">
                자재만 받을까요,
                <br />
                시공까지 맡길까요?
              </h2>
              <p className="lead">견적에 넣을 범위를 직접 정해요. 직접 가꾸고 싶은 부분은 남겨도 돼요.</p>
              <p className="note">자재·배송·시공의 최종 포함 범위와 비용은 견적서에서 확인해요.</p>
            </div>
            <ScopePicker />
          </div>
        </section>

        {/* 준비할 것: 쌓인 카드가 펼쳐짐 */}
        <section className="sv-prep" aria-labelledby="prep-title">
          <PrepFan />
        </section>

        {/* 시설물: 스티커 */}
        <section className="section sv-etc" aria-labelledby="etc-title">
          <div className="container">
            <EtcSticker />
          </div>
        </section>

        {/* 마무리: 실사 정원 사진 배경 */}
        <section className="sv-cta" aria-labelledby="service-cta">
          <img className="sv-cta__bg" src="/service/look-right.webp" alt="" width={1800} height={1012} loading="lazy" />
          <div className="container sv-cta__inner">
            <h2 id="service-cta" className="sv-display">
              수도권 부분조경,
              <br />
              기본 견적은 무료예요.
            </h2>
            <p className="lead">서울·경기·인천 단독·전원주택이라면 지금 요청할 수 있어요.</p>
            <Link href="/quote" className="btn btn--primary btn--l btn--glow">
              무료 견적 시작하기
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
