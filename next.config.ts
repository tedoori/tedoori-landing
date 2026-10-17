import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 미래조경 견적서 앱 (public/jooyong/index.html)
  async rewrites() {
    return [{ source: "/jooyong", destination: "/jooyong/index.html" }];
  },
};

export default nextConfig;
