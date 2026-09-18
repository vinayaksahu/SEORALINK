import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("sl_admin_session")?.value;

  if (adminToken) {
    const verifiedAdmin = await verifySessionToken(adminToken);
    if (verifiedAdmin && (verifiedAdmin.role === "ADMIN" || verifiedAdmin.role === "SUPER_ADMIN")) {
      const isProduction = process.env.NODE_ENV === "production";
      // Restore Admin session
      cookieStore.set("sl_session", adminToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  // Remove impersonation cookies
  cookieStore.delete("sl_admin_session");
  cookieStore.delete("sl_impersonating");

  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    return NextResponse.json({
      success: true,
      message: "Returned to Admin Console",
      redirectUrl: "/admin/users",
    });
  }

  const url = new URL(req.url);
  return NextResponse.redirect(`${url.origin}/admin/users`, { status: 303 });
}

export async function GET(req: Request) {
  return POST(req);
}
