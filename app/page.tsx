import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";
import { YardStory } from "./_components/yard/YardStory";
import { GardenWalk } from "./_components/home/GardenWalk";
import { RequestIntro } from "./_components/home/RequestIntro";
import { NoteExample } from "./_components/home/NoteExample";
import { MaterialShop } from "./_components/home/MaterialShop";
import { ScopeStack } from "./_components/home/ScopeStack";
import { StepsRail } from "./_components/home/StepsRail";
import { ReceiptCost } from "./_components/home/ReceiptCost";
import { Closing } from "./_components/home/Closing";
import { HomeMotion } from "./_components/home/HomeMotion";
import "./_components/home/motion.css";
import "./home.css";

// 문구는 피그마 Lo-Fi 와이어프레임(홈) 그대로

export const metadata: Metadata = {
  title: "전원주택 조경 플랫폼 | 테두리",
  description: "전원주택의 마당 조경이 필요한 분을 위한 조경 사이트예요. 필요한 곳부터 맞춤 견적을 받아보세요.",
};

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <SiteHeader floating />
      <div className="home-sky" aria-hidden="true">
        <span className="home-sky__glow home-sky__glow--a" />
        <span className="home-sky__glow home-sky__glow--b" />
      </div>

      <main id="main" className="home-flow">
        <YardStory />

        {/* 01 · 집에서 견적 요청 (Tara 오마주) */}
        <RequestIntro />

        {/* 02 · 대문을 열고 (Digital Original XR 오마주, 실사 영상) */}
        <GardenWalk />

        {/* 03 · 요청사항 작성 예시 (Applied Imagination 오마주 — 종이 메모) */}
        <NoteExample />

        {/* 04 · 작업 조합 (쇼핑하듯 자재를 골라 견적 바구니에 담음) */}
        <section className="section h-shop" aria-labelledby="compose-title">
          <div className="container">
            <MaterialShop />
          </div>
        </section>

        {/* 05 · 맡길 범위 (Mammut 오마주 — 쌓이는 카드) */}
        <section className="section h-scope" aria-labelledby="scope-title">
          <div className="container">
            <ScopeStack />
          </div>
        </section>

        {/* 06 · 신청부터 견적까지 (화면이 멈추고 가로로 넘어감) */}
        <section className="h-steps" aria-labelledby="steps-title">
          <StepsRail />
        </section>

        {/* 07 · 비용은 항목별로 (영수증 출력) */}
        <section className="h-cost2" aria-labelledby="cost-title">
          <ReceiptCost />
        </section>

        {/* 08 · 신청 전 확인 (숲색 카드 + 대화형 FAQ + 거대한 '테두리') */}
        <Closing />
      </main>

      <div className="home-rail" aria-hidden="true">
        <span className="home-rail__fill" />
      </div>
      <div className="home-dock">
        <Link href="/quote" className="btn btn--primary btn--block">
          무료 견적 시작하기
        </Link>
      </div>
      <HomeMotion />

      <SiteFooter />
    </>
  );
}
