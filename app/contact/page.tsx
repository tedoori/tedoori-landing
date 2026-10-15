import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import "../quote/quote.css";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "조경업체 문의 | 테두리",
  description: "전원주택 조경과 견적이 궁금한 분께 필요한 내용을 안내해요. 테두리에 편하게 문의를 남겨주세요.",
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
