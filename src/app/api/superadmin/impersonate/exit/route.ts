import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const superToken = cookieStore.get("sl_super_session")?.value;

  if (superToken) {
    const verifiedSuper = await verifySessionToken(superToken);
    if (verifiedSuper && verifiedSuper.role === "SUPER_ROOT_ADMIN") {
      const isProduction = process.env.NODE_ENV === "production";
      // Restore Super Root Admin session
      cookieStore.set("sl_session", superToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  }

  // Clear impersonation marker
  cookieStore.delete("sl_super_session");

  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    return NextResponse.json({
      success: true,
      message: "Returned to Super Root Commander Console",
      redirectUrl: "/superrootadmin",
    });
  }

  const url = new URL(req.url);
  return NextResponse.redirect(`${url.origin}/superrootadmin`, { status: 303 });
}

export async function GET(req: Request) {
  return POST(req);
}
