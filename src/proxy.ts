import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "seoralink-default-jwt-secret-key-2026-auth";
const encodedKey = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
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
      const adminToken = request.cookies.get("sl_admin_session")?.value;
      if (adminToken) {
        try {
          const { payload: adminPayload } = await jwtVerify(adminToken, encodedKey, {
            algorithms: ["HS256"],
          });
          if (adminPayload && (adminPayload.role === "ADMIN" || adminPayload.role === "SUPER_ADMIN")) {
            const response = NextResponse.redirect(request.nextUrl);
            response.cookies.set("sl_session", adminToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
            response.cookies.delete("sl_admin_session");
            response.cookies.delete("sl_impersonating");
            return response;
          }
        } catch {
          // Token invalid, continue to redirect
        }
      }

      const adminLoginUrl = new URL("/adminlogin", request.url);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // 3. Prevent logged-in users from hitting /login or /register
  if (pathname === "/login" || pathname === "/register") {
    if (session) {
      if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/member/dashboard", request.url));
    }
  }

  // 4. Prevent logged-in admins from hitting /adminlogin (redirect directly to /admin)
  if (pathname === "/adminlogin") {
    if (session && (session.role === "ADMIN" || session.role === "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/login", "/register", "/adminlogin"],
};
