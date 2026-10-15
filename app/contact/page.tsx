import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import "../quote/quote.css";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "문의하기 · 테두리",
  description: "테두리 부분조경 서비스와 견적 신청에 대해 궁금한 점을 남겨주세요.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="q-page">
        <ContactForm />
      </main>
      <SiteFooter />
    </>
  );
}
