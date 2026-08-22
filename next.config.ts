import type { NextConfig } from 'next';

// 后端地址。本地开发默认连 localhost:3001；线上（Render）通过环境变量覆盖，
// 避免把地址写死在代码里导致本地与部署互相打架。
const backendURL = process.env.BACKEND_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 后端统一 /api 前缀（controller + better-auth 均为 /api/*），原样透传。
        // 含 better-auth 的 /api/auth/* 及业务 /api/portfolio/* 等。
        source: '/api/:path*',
        destination: `${backendURL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
