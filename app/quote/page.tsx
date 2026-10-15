import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import { WORK_TYPES } from "@/lib/quote";
import { QuoteFlow } from "./QuoteFlow";
import "./quote.css";

export const metadata: Metadata = {
  title: "무료 견적 요청 · 테두리",
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
