import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";

export const metadata: Metadata = {
  title: "전원주택 조경 메뉴 | 테두리",
  description: "전원주택 조경 서비스와 견적 신청, 이용 안내를 한곳에서 확인하고 원하는 메뉴로 이동하세요.",
};

const MAIN = [
  ["/", "홈"],
  ["/service", "서비스 소개"],
  ["/guide", "이용 안내"],
  ["/quote", "무료 견적 신청"],
  ["/my", "내 신청"],
  ["/contact", "문의하기"],
];

const POLICY = [
  ["/terms", "이용약관"],
  ["/privacy", "개인정보 처리방침"],
];

function Arrow() {
  return (
    <svg className="menu-list__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MenuPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <nav className="container menu-page" aria-labelledby="menu-title">
          <h1 id="menu-title" className="title-l">
            어디로 갈까요?
          </h1>
          <ul className="menu-list">
            {MAIN.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={href === "/quote" ? "menu-list__link menu-list__link--cta" : "menu-list__link"}>
                  {label}
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
          <ul className="menu-list menu-list--small">
            {POLICY.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="menu-list__link">
                  {label}
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
