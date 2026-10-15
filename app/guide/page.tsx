import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { Checklist, CostTags, DayClock, DecideLine, LogoDraw, RouteMap } from "./GuideParts";
import "./guide.css";

export const metadata: Metadata = {
  title: "이용 안내 · 테두리",
  description: "신청은 집에서, 진행은 견적을 보고. 테두리 부분조경 견적의 신청부터 진행까지.",
};

// 문구는 와이어프레임 그대로, 연출은 섹션마다 다르게
export default function GuidePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="gd">
        {/* 사진 한 장을 찍는 순간(뷰파인더) + 노선도 */}
        <section className="gd-hero" aria-labelledby="guide-title">
          <div className="container gd-hero__grid">
            <div className="gd-hero__copy">
              <h1 id="guide-title" className="gd-display">
                신청은 집에서.
                <br />
                진행은 견적을 보고.
              </h1>
              <p className="lead gd-hero__lead">사진 한 장으로 이야기를 시작해요. 운영자가 요청을 읽고, 상담과 일정을 함께 정해요.</p>
            </div>
            <figure className="gd-shot" aria-hidden="true">
              <img src="/guide/hero-shot.webp" alt="" width={1600} height={900} fetchPriority="high" />
              <span className="gd-shot__frame">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="gd-shot__focus" />
              <span className="gd-shot__flash" />
            </figure>
          </div>
          <div className="container">
            <RouteMap />
            <p className="note">서울·경기·인천 · 견적 요청은 무료예요.</p>
          </div>
        </section>

        {/* 체크리스트 */}
        <section className="section gd-prep" aria-labelledby="prep-title">
          <div className="container gd-split">
            <div className="gd-head">
              <h2 id="prep-title" className="gd-title">
                사진 한 장과 이메일,
                <br />이 두 가지부터 준비해요.
              </h2>
              <p className="lead">작업할 곳이 보이는 사진을 찍고, 대략적인 크기를 떠올려 두면 충분해요.</p>
              <p className="note">예산과 이름, 휴대전화는 선택이에요. 상세주소는 지금 받지 않아요.</p>
            </div>
            <Checklist />
          </div>
        </section>

        {/* 24시간 */}
        <section className="section gd-review" aria-labelledby="review-title">
          <div className="container">
            <div className="gd-head gd-head--center">
              <h2 id="review-title" className="gd-title">
                첫 연락은 24시간 안에.
                <br />
                야간 접수는 다음 날.
              </h2>
              <p className="lead">운영자가 신청을 한 건씩 직접 읽어요. 사진만으로 부족하면 필요한 자료를 한 번에 요청해요.</p>
            </div>
            <DayClock />
          </div>
        </section>

        {/* 견적 구성 */}
        <section className="section gd-cost" aria-labelledby="cost-title">
          <div className="container">
            <div className="gd-head">
              <h2 id="cost-title" className="gd-title">
                자재비부터 시공비까지,
                <br />
                견적은 항목별로 보여요.
              </h2>
              <p className="lead">자재 확인 등으로 늦어지면 미리 연락드려요. 총액만 보지 않아도 돼요.</p>
            </div>
            <CostTags />
            <p className="note gd-after">제외 항목과 추가 비용 조건도 함께 확인해요.</p>
          </div>
        </section>

        {/* 결정 */}
        <section className="section gd-decide" aria-labelledby="decide-title">
          <div className="container">
            <div className="gd-head gd-head--center">
              <h2 id="decide-title" className="gd-title">
                견적을 보고 결정해요.
                <br />
                계약과 대금은 업체와 직접.
              </h2>
              <p className="lead">견적은 현장 실측 후에 나와요. 진행 상담 요청은 계약이나 결제 확정이 아니에요.</p>
            </div>
            <DecideLine />
          </div>
        </section>

        {/* 마무리: 테두리 로고가 그려짐 */}
        <section className="gd-cta" aria-labelledby="guide-cta">
          <div className="container gd-cta__inner">
            <LogoDraw />
            <h2 id="guide-cta" className="gd-display">
              정원 한 곳부터,
              <br />
              요청을 남겨보세요.
            </h2>
            <p className="lead">가능한 작업인지 먼저 확인하고, 견적을 받아본 뒤 결정해도 돼요.</p>
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
