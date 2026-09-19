import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { generateCustomId } from "@/lib/utils";
import { cookies } from "next/headers";
import { isUserSystemExited } from "@/lib/userStatus";

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, password, sponsorCode } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email address is already registered" },
        { status: 400 }
      );
    }

    // Resolve sponsor if provided
    let sponsorId: string | null = null;
    if (sponsorCode && sponsorCode.trim()) {
      const code = sponsorCode.trim();
      const sponsor = await db.user.findFirst({
        where: {
          OR: [
            { customId: code },
            { referralCode: code },
            { email: code.toLowerCase() },
          ],
        },
      });

      if (sponsor) {
        // Check if sponsor has exited system under Single-Exit protocol
        const isSponsorExited = await isUserSystemExited(sponsor.id);
        if (isSponsorExited) {
          return NextResponse.json(
            { error: "This sponsor account has permanently exited the network under the Single-Exit protocol and can no longer sponsor or refer new members." },
            { status: 400 }
          );
        }

        sponsorId = sponsor.id;
      } else {
        return NextResponse.json(
          { error: "Invalid sponsor referral code. Please check and try again." },
          { status: 400 }
        );
      }
    }

    // Generate unique customId
    let customId = generateCustomId();
    while (await db.user.findUnique({ where: { customId } })) {
      customId = generateCustomId();
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        customId,
        referralCode: customId,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        passwordHash,
        sponsorId,
        status: "INACTIVE", // Account pending $10 activation
        currentTier: 0,
      },
    });

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      customId: user.customId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("sl_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        customId: user.customId,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to register account" },
      { status: 500 }
    );
  }
}
