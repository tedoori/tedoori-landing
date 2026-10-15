import type { Metadata } from "next";
import { SiteFooter } from "../../../_components/SiteFooter";
import { SiteHeader } from "../../../_components/SiteHeader";
import { QuoteEdit } from "./QuoteEdit";
import "../../my.css";

export const metadata: Metadata = { title: "신청 수정 · 테두리", robots: { index: false } };

export default async function QuoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main" className="section">
        <div className="container my-page">
          <QuoteEdit id={id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
