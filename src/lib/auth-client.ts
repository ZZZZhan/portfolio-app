// 前端 better-auth 客户端
// baseURL 走 Next rewrite（/api/* → localhost:3001），后端 better-auth 挂在 /api/auth
import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

// 服务端与客户端分离，无法自动从 auth 实例推断，故手动声明自定义用户字段。
// 需与后端 src/lib/auth.ts 的 user.additionalFields 保持一致。
export const authClient = createAuthClient({
  // 默认 baseURL 为 /api/auth（相对当前 origin），
  // 再由 next.config 的 rewrite 代理到后端 NestJS (localhost:3001)。
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
