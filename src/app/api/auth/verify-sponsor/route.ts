import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUserSystemExited } from "@/lib/userStatus";

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

  if (!sponsor) {
    return NextResponse.json({ sponsor: null });
  }

  const isExited = await isUserSystemExited(sponsor.id);
  if (isExited) {
    return NextResponse.json({
      sponsor: null,
      error: "This sponsor account has permanently exited the network under the Single-Exit protocol and can no longer sponsor new members.",
    });
  }

  return NextResponse.json({ sponsor });
}
