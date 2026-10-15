import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import "./design.css";
import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "디자인 시스템 · 테두리",
  description: "테두리 서비스 화면의 디자인 시스템과 UI 구성 요소를 확인합니다.",
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="section section--subtle">
        <div className="container">
          <Showcase />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
