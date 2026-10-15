import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { TermsContent } from "../_components/legal/TermsContent";

export const metadata: Metadata = {
  title: "조경견적 이용약관 | 테두리",
  description: "테두리 조경견적 서비스를 이용하는 고객을 위한 이용 조건과 안내 사항을 확인하세요.",
};

export default function TermsPage() {
  return (
    <LegalPage title="이용약관">
      <TermsContent />
    </LegalPage>
  );
}
