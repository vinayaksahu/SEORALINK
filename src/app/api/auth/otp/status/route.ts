import { NextResponse } from "next/server";
import { getAllOtpSettings, OtpPurpose } from "@/lib/otp";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const purpose = searchParams.get("purpose") as OtpPurpose | null;
    const queryAdminId = searchParams.get("adminId");
    const sponsorCode = searchParams.get("sponsorCode");

    let resolvedAdminId = queryAdminId || null;

    if (!resolvedAdminId) {
      const session = await getSession();
      if (session) {
        if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
          resolvedAdminId = session.userId;
        } else if (session.adminId) {
          resolvedAdminId = session.adminId;
        }
      } else if (sponsorCode) {
        const sp = await db.user.findFirst({
          where: {
            OR: [
              { customId: { equals: sponsorCode.trim(), mode: "insensitive" } },
              { referralCode: { equals: sponsorCode.trim(), mode: "insensitive" } },
            ],
          },
          select: { id: true, role: true, adminId: true },
        });
        if (sp) {
          resolvedAdminId = (sp.role === "ADMIN" || sp.role === "SUPER_ADMIN") ? sp.id : sp.adminId;
        }
      }
    }

    const settings = await getAllOtpSettings(resolvedAdminId);

    let enabled = true;
    if (purpose && purpose in settings) {
      enabled = settings[purpose];
    }

    return NextResponse.json({ success: true, enabled, settings, adminId: resolvedAdminId });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      enabled: true,
      settings: {
        REGISTRATION: true,
        FORGOT_PASSWORD: true,
        WITHDRAWAL: true,
        PROFILE_UPDATE: true,
      },
    });
  }
}
