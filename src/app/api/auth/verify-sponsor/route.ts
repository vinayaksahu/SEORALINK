import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUserSystemExited } from "@/lib/userStatus";
import { canUserSponsor } from "@/lib/referralPolicy";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();

  if (!code) {
    return NextResponse.json({ sponsor: null });
  }

  const sponsor = await db.user.findFirst({
    where: {
      OR: [
        { customId: { equals: code, mode: "insensitive" } },
        { referralCode: { equals: code, mode: "insensitive" } },
        { email: { equals: code.toLowerCase(), mode: "insensitive" } },
      ],
      NOT: [
        { role: "SUPER_ROOT_ADMIN" },
        { customId: "SUPERROOT" },
      ],
    },
    select: {
      id: true,
      customId: true,
      fullName: true,
      role: true,
      status: true,
    },
  });

  if (!sponsor) {
    return NextResponse.json({
      sponsor: null,
      error: "Invalid sponsor referral code. Account not found.",
    });
  }

  const isExited = await isUserSystemExited(sponsor.id);
  if (isExited) {
    return NextResponse.json({
      sponsor: null,
      error: "This sponsor account has permanently exited the network under the Single-Exit protocol and can no longer sponsor new members.",
    });
  }

  const sponsorCheck = await canUserSponsor(sponsor);
  if (!sponsorCheck.allowed) {
    return NextResponse.json({
      sponsor: null,
      error: sponsorCheck.reason,
    });
  }

  return NextResponse.json({
    sponsor: {
      id: sponsor.id,
      customId: sponsor.customId,
      fullName: sponsor.fullName,
    },
  });
}
