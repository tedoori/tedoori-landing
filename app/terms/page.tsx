import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { TermsContent } from "../_components/legal/TermsContent";

export const metadata: Metadata = { title: "이용약관 · 테두리" };

export default function TermsPage() {
  return (
    <LegalPage title="이용약관">
      <TermsContent />
    </LegalPage>
  );
}
