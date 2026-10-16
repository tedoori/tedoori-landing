import type { MetadataRoute } from "next";
import { getPosts } from "../lib/blog";

const SITE_URL = "https://tedoori.com";

// 블로그 글은 Supabase 공개 글 기준 (편집기로 새로 쓴 글도 자동으로 들어감). 1시간마다 새로 만듦
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    { url: SITE_URL, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/service`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/guide`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/blog`, priority: 0.8, changeFrequency: "weekly", lastModified: posts[0]?.publishedAt ?? undefined },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: p.publishedAt ?? undefined,
    })),
    { url: `${SITE_URL}/quote`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/terms`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${SITE_URL}/privacy`, priority: 0.2, changeFrequency: "yearly" },
  ];
}
