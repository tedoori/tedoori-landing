import { getPosts } from "../../lib/blog";

// 블로그 RSS: 네이버 서치어드바이저·구글에 제출하면 새 글을 더 빨리 가져감
export const revalidate = 3600;

const SITE = "https://tedoori.com";
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const posts = await getPosts();
  const items = posts
    .map((p) => {
      const url = `${SITE}/blog/${p.slug}`;
      const img = p.cover ? (p.cover.startsWith("/") ? SITE + p.cover : p.cover) : null;
      return `    <item>
      <title>${x(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <category>${x(p.category)}</category>
      <description>${x(p.excerpt)}</description>${p.publishedAt ? `\n      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ""}${img ? `\n      <enclosure url="${x(img)}" type="image/${img.endsWith(".webp") ? "webp" : "jpeg"}" length="0" />` : ""}
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>테두리 조경 블로그</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>전원주택 조경견적, 잔디·자갈·디딤석 선택, 시공 후 관리와 셀프 시공 꿀팁</description>
    <language>ko</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
