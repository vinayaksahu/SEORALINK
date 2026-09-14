import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "seoralink-default-jwt-secret-key-2026-auth";
const encodedKey = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sl_session")?.value;

  let session: any = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, encodedKey, {
        algorithms: ["HS256"],
      });
      session = payload;
    } catch {
      session = null;
    }
  }

  // 1. Protect /member routes
  if (pathname.startsWith("/member")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect /admin routes (except /adminlogin)
  if (pathname.startsWith("/admin") && pathname !== "/adminlogin") {
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      const adminLoginUrl = new URL("/adminlogin", request.url);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // 3. Prevent logged-in users from hitting /login or /register
  if (pathname === "/login" || pathname === "/register") {
    if (session) {
      return NextResponse.redirect(new URL("/member/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/login", "/register"],
};
