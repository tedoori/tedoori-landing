import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { PrivacyContent } from "../_components/legal/PrivacyContent";

export const metadata: Metadata = { title: "개인정보 처리방침 · 테두리" };

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보 처리방침">
      <PrivacyContent />
    </LegalPage>
  );
}
