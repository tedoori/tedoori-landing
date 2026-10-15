import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";
import { PrivacyContent } from "../_components/legal/PrivacyContent";

export const metadata: Metadata = {
  title: "조경견적 개인정보 처리방침 | 테두리",
  description: "테두리 조경견적 서비스 이용 시 수집되는 개인정보와 보호 기준을 확인하세요.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보 처리방침">
      <PrivacyContent />
    </LegalPage>
  );
}
