import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/my/"],
    },
    sitemap: "https://tedoori.com/sitemap.xml",
  };
}
