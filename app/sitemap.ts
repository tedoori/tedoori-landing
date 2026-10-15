import type { MetadataRoute } from "next";

const SITE_URL = "https://tedoori.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/service`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/guide`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/quote`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${SITE_URL}/my`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/menu`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${SITE_URL}/terms`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${SITE_URL}/privacy`, priority: 0.2, changeFrequency: "yearly" },
  ];
}
