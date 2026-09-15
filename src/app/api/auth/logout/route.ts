import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("sl_session");

  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  }

  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("sl_session");

  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
