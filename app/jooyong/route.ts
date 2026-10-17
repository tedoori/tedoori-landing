// 미래조경 견적서 앱 (/jooyong) — 사이트와 별개로 쓰는 독립 페이지 (기존 페이지·설정과 무관)
import html from "./page-html";

export const dynamic = "force-static";

export function GET() {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
