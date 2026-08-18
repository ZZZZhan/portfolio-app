import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*", // 代理到 NestJS 后端
      },
    ];
  },
};

export default nextConfig;