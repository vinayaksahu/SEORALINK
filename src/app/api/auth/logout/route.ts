import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "seoralink-default-jwt-secret-key-2026-auth";
const encodedKey = new TextEncoder().encode(secretKey);

async function checkIsAdmin(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload.role === "ADMIN" || payload.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_session")?.value;
  const isAdmin = await checkIsAdmin(token);

  cookieStore.delete("sl_session");

  const url = new URL(req.url);
  const redirectParam = url.searchParams.get("redirect");
  const referer = req.headers.get("referer") || "";

  let target = "/login";
  if (isAdmin || redirectParam === "/adminlogin" || referer.includes("/admin")) {
    target = "/adminlogin";
  } else if (redirectParam) {
    target = redirectParam;
  }

  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
      redirectUrl: target,
    });
  }

  return NextResponse.redirect(`${url.origin}${target}`, { status: 303 });
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sl_session")?.value;
  const isAdmin = await checkIsAdmin(token);

  cookieStore.delete("sl_session");

  const url = new URL(req.url);
  const redirectParam = url.searchParams.get("redirect");
  const referer = req.headers.get("referer") || "";

  let target = "/login";
  if (isAdmin || redirectParam === "/adminlogin" || referer.includes("/admin")) {
    target = "/adminlogin";
  } else if (redirectParam) {
    target = redirectParam;
  }

  return NextResponse.redirect(`${url.origin}${target}`, { status: 303 });
}
