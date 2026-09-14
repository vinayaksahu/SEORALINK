import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();

  if (!code) {
    return NextResponse.json({ sponsor: null });
  }

  const sponsor = await db.user.findFirst({
    where: {
      OR: [
        { customId: code },
        { referralCode: code },
        { email: code.toLowerCase() },
      ],
    },
    select: {
      id: true,
      customId: true,
      fullName: true,
    },
  });

  return NextResponse.json({ sponsor });
}
