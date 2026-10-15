import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./ds.css";
import "./_components/ui/ui.css";
import "./tailwind.css";

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
  metadataBase: new URL("https://tedoori-landing.vercel.app"),
  openGraph: {
    title: "테두리 · 전원주택 조경 견적",
    description:
      "정원 전체 말고, 필요한 곳부터 시작하는 서울·경기·인천 부분조경 무료 견적.",
    url: "https://tedoori-landing.vercel.app",
    siteName: "테두리",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/hero/final.webp",
        width: 1200,
        height: 630,
        alt: "테두리 부분조경 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "테두리 · 전원주택 조경 견적",
    description: "필요한 공간부터 시작하는 부분조경 무료 견적.",
    images: ["/hero/final.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#E7DFCF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
