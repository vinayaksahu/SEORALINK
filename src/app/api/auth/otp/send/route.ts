import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAndSendOtp, OtpPurpose, isOtpFeatureEnabled } from "@/lib/otp";
import { getClientIp, checkRateLimitAsync, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // IP Rate Limit: max 6 OTP dispatches per 2 minutes (120s)
    const ipLimit = await checkRateLimitAsync(`otp:ip:${clientIp}`, {
      maxRequests: 6,
      windowSeconds: 120,
    });
    if (!ipLimit.success) {
      return rateLimitResponse(
        ipLimit.resetInSeconds,
        `Too many verification codes requested from this network. Please wait ${ipLimit.resetInSeconds} seconds.`
      );
    }

    const body = await req.json();
    const { purpose, email } = body as { purpose: OtpPurpose; email?: string };

    if (!purpose) {
      return NextResponse.json({ error: "OTP purpose is required" }, { status: 400 });
    }

    const validPurposes: OtpPurpose[] = [
      "REGISTRATION",
      "FORGOT_PASSWORD",
      "WITHDRAWAL",
      "PROFILE_UPDATE",
    ];

    if (!validPurposes.includes(purpose)) {
      return NextResponse.json({ error: "Invalid OTP purpose" }, { status: 400 });
    }

    // Check if feature is enabled
    const isEnabled = await isOtpFeatureEnabled(purpose);
    if (!isEnabled) {
      return NextResponse.json({
        success: true,
        bypassed: true,
        message: "OTP verification is currently bypassed by system policy.",
      });
    }

    let targetEmail = email ? email.toLowerCase().trim() : "";
    let recipientName = "Member";

    // For Authenticated Actions (WITHDRAWAL, PROFILE_UPDATE)
    if (purpose === "WITHDRAWAL" || purpose === "PROFILE_UPDATE") {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { email: true, fullName: true },
      });

      if (!user || !user.email) {
        return NextResponse.json({ error: "User account email not found" }, { status: 404 });
      }

      targetEmail = user.email;
      recipientName = user.fullName;
    }

    // For Public Actions (REGISTRATION, FORGOT_PASSWORD)
    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required to receive verification code" },
        { status: 400 }
      );
    }

    // Additional validations for FORGOT_PASSWORD
    if (purpose === "FORGOT_PASSWORD") {
      const user = await db.user.findUnique({
        where: { email: targetEmail },
        select: { fullName: true },
      });

      if (!user) {
        // Return success message to prevent email enumeration, but don't send OTP
        return NextResponse.json({
          success: true,
          message: `If an account exists for ${targetEmail}, a verification code has been dispatched.`,
        });
      }
      recipientName = user.fullName;
    }

    // Additional validations for REGISTRATION
    if (purpose === "REGISTRATION") {
      const existing = await db.user.findUnique({
        where: { email: targetEmail },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This email address is already registered in the network." },
          { status: 400 }
        );
      }
      if (body.fullName) {
        recipientName = body.fullName;
      }
    }

    // Email rate limit: max 3 OTP requests per 2 minutes
    const emailLimit = await checkRateLimitAsync(`otp:email:${targetEmail}`, {
      maxRequests: 3,
      windowSeconds: 120,
    });
    if (!emailLimit.success) {
      return rateLimitResponse(
        emailLimit.resetInSeconds,
        `Too many verification codes requested for this email. Please wait ${emailLimit.resetInSeconds} seconds before requesting a new code.`
      );
    }

    const result = await generateAndSendOtp({
      email: targetEmail,
      purpose,
      recipientName,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[Send OTP Route Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch verification code" },
      { status: 500 }
    );
  }
}
