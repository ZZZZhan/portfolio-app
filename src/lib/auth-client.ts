// 前端 better-auth 客户端
// baseURL 走 Next rewrite（/api/* → localhost:3001），后端 better-auth 挂在 /api/auth
import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

// 服务端与客户端分离，无法自动从 auth 实例推断，故手动声明自定义用户字段。
// 需与后端 src/lib/auth.ts 的 user.additionalFields 保持一致。
export const authClient = createAuthClient({
  // baseURL 保持相对路径隐式值（better-auth 默认为当前 origin + /api/auth），
  // 通过 next.config rewrites 代理到后端 NestJS。显式传 "/api/auth" 会在 SSR 预渲染时
  // 触发 Invalid URL，故保持默认；如需显式可使用绝对 URL：
  // baseURL: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth` : undefined,
  plugins: [
    inferAdditionalFields({
      user: {
        // 行情更新模式：AFTER_CLOSE（盘后）/ REALTIME（实时）
        marketUpdateMode: { type: 'string', required: false },
        // 微信推送 SendKey（Server酱）；未填则不推送
        sendkey: { type: 'string', required: false },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;
