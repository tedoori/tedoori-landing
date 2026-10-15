import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { WORK_TYPES } from "@/lib/quote";
import { QuoteFlow } from "./QuoteFlow";
import "./quote.css";

export const metadata: Metadata = {
  title: "전원주택 조경견적 신청 | 테두리",
  description: "마당·화단·잔디·나무 조경이 필요한 분께 맞춤 견적을 안내해요. 필요한 공간부터 무료로 신청하세요.",
};

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ work?: string }> }) {
  const { work } = await searchParams;
  const initialWorks = (work ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter((w): w is (typeof WORK_TYPES)[number] => (WORK_TYPES as readonly string[]).includes(w));

  return (
    <>
      <SiteHeader />
      <main id="main" className="q-page">
        <QuoteFlow initialWorks={initialWorks} />
      </main>
      <SiteFooter />
    </>
  );
}
