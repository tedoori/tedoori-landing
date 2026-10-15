import type { Metadata } from "next";
import { SiteFooter } from "../_components/SiteFooter";
import { SiteHeader } from "../_components/SiteHeader";
import "../quote/quote.css";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "문의하기 · 테두리" };

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
