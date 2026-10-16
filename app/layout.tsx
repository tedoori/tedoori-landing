import type { Metadata, Viewport } from "next";
// 화면에 쓰인 글자 묶음만 내려받는 분할 폰트 (통째 2MB 대신 페이지당 수십 KB)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import "./ds.css";
import "./_components/ui/ui.css";
import "./tailwind.css";

export const metadata: Metadata = {
  title: "테두리 · 전원주택 조경 견적",
  description:
    "정원 전체 말고, 필요한 곳부터. 서울·경기·인천 단독·전원주택의 식재·잔디·자갈·디딤석·화단 부분조경 무료 견적.",
  verification: {
    google: "RvtzZL7m6LZlrh5BUFiYQQWOl5F8yKoiAyeehc8Rflg",
    other: {
      "naver-site-verification": "d538490d2d87b3dd4c00bd1d0d5f8bf42423060f",
    },
  },
  metadataBase: new URL("https://tedoori.com"),
  alternates: { types: { "application/rss+xml": [{ url: "/rss.xml", title: "테두리 조경 블로그" }] } },
  openGraph: {
    title: "테두리 · 전원주택 조경 견적",
    description:
      "정원 전체 말고, 필요한 곳부터 시작하는 서울·경기·인천 부분조경 무료 견적.",
    url: "https://tedoori.com",
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
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
