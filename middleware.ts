import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 路由保护中间件：
 * - 未登录访问页面跳转 /login
 * - 已登录访问 /login、/register 跳转首页
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && !isAuthPage) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 除 API 和静态资源外的所有页面
  matcher: ["/", "/trips/:path*", "/locations/:path*", "/login", "/register"],
};
