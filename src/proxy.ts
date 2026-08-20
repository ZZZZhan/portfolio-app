import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Next.js 16 以 proxy 取代 middleware。
// 这里做"乐观重定向"：仅检查会话 cookie 是否存在（不做 DB/签名校验），
// 真正的鉴权由后端 NestJS 全局 AuthGuard 保证。
// 参考: https://better-auth.com/docs/integrations/next#nextjs-16-proxy
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // NOTE: 仅检查 cookie 存在性，不验证签名——非安全校验，仅用于乐观跳转。
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 命中除 api / 静态资源 / 登录注册外的所有页面路由
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|register).*)',
  ],
};
