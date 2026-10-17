// 미래조경 견적서 앱 (/jooyong) — 사이트와 별개로 쓰는 독립 페이지
// public/jooyong/index.html 을 그대로 내려줌 (기존 페이지·설정과 무관)

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const r = await fetch(new URL("/jooyong/index.html", req.url), { cache: "no-store" });
  return new Response(r.body, {
    status: r.status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
