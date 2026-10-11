import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/admin/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";
  const isAuthApi = pathname.startsWith("/api/auth");

  if (!isAdmin || isLogin || isAuthApi) {
    return NextResponse.next();
  }

  if (!request.auth) {
    const url = new URL("/admin/login", request.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
