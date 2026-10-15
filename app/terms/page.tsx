import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { TermsContent } from "../_components/legal/TermsContent";

export const metadata: Metadata = {
  title: "이용약관 · 테두리",
  description: "테두리 부분조경 견적 서비스 이용약관을 안내합니다.",
};

export default function TermsPage() {
  return (
    <LegalPage title="이용약관">
      <TermsContent />
    </LegalPage>
  );
}
