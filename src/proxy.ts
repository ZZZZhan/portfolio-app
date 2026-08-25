import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Next.js 16 以 proxy 取代 middleware。
// 这里做"乐观重定向"：仅检查会话 cookie 是否存在（不做 DB/签名校验），
// 真正的鉴权由后端 NestJS 全局 AuthGuard 保证。
// 参考: https://better-auth.com/docs/integrations/next#nextjs-16-proxy
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/login/') || pathname.startsWith('/register/');

  // 已登录访问登录/注册页 → 踢回首页（此分支由单独的 matcher 覆盖，见 config）
  // 未登录访问受保护页 → 跳登录
  // NOTE: 仅检查 cookie 存在性，不验证签名——非安全校验，仅用于乐观跳转。
  if (sessionCookie) {
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 未登录：auth 页放行，其余由 matcher 已过滤，放行
  // 受保护页的未登录跳转由下面的 matcher 保证，此处兜底
  if (!sessionCookie && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 覆盖所有页面路由（含 login/register 以便已登录时踢回首页），排除 api 与静态资源
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
