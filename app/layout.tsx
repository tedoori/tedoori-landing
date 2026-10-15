import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./ds.css";
import "./_components/ui/ui.css";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "테두리 · 전원주택 조경 견적",
  description:
    "정원 전체 말고, 필요한 곳부터. 서울·경기·인천 단독·전원주택의 식재·잔디·자갈·디딤석·화단 부분조경 무료 견적.",
};

export const viewport: Viewport = {
  themeColor: "#E7DFCF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>{children}</body>
    </html>
  );
}
