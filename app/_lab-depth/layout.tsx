import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공간 깊이 실험 · 테두리",
  description: "테두리 조경 이미지의 공간감 연출 실험 페이지입니다.",
  robots: { index: false, follow: false },
};

export default function LabDepthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
