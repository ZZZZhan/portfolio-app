import type { NextConfig } from 'next';

// 后端地址。本地开发默认连 localhost:3001；线上通过环境变量覆盖。
// 生产环境未配置 BACKEND_URL 时显式告警，避免静默指向 localhost 导致白屏。
if (process.env.NODE_ENV === 'production' && !process.env.BACKEND_URL) {
  console.warn('[next.config] BACKEND_URL 未配置，生产环境将回落到 http://localhost:3001，可能导致线上白屏');
}
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
