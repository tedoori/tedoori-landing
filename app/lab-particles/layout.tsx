import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "정원 입자 실험 · 테두리",
  description: "테두리 조경 장면의 인터랙티브 입자 연출 실험 페이지입니다.",
  robots: { index: false, follow: false },
};

export default function LabParticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
