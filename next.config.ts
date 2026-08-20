import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 后端统一 /api 前缀（controller + better-auth 均为 /api/*），原样透传。
        // 含 better-auth 的 /api/auth/* 及业务 /api/portfolio/* 等。
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;