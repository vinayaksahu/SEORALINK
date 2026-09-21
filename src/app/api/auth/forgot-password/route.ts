import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { validateAndConsumeOtp } from "@/lib/otp";
import { getClientIp, checkRateLimitAsync, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // IP rate limit: max 5 reset attempts per 5 minutes
    const ipLimit = await checkRateLimitAsync(`forgot:ip:${clientIp}`, {
      maxRequests: 5,
      windowSeconds: 300,
    });
    if (!ipLimit.success) {
      return rateLimitResponse(
        ipLimit.resetInSeconds,
        `Too many password reset requests from this network. Please wait ${Math.ceil(ipLimit.resetInSeconds / 60)} minutes.`
      );
    }

    const { email, otpCode, newPassword } = await req.json();

    const cleanEmail = email ? email.toLowerCase().trim() : "";
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    // Email rate limit: max 3 reset attempts per 5 minutes
    const emailLimit = await checkRateLimitAsync(`forgot:email:${cleanEmail}`, {
      maxRequests: 3,
      windowSeconds: 300,
    });
    if (!emailLimit.success) {
      return rateLimitResponse(
        emailLimit.resetInSeconds,
        `Too many password reset requests for this email. Please wait ${Math.ceil(emailLimit.resetInSeconds / 60)} minutes.`
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long for account security" },
        { status: 400 }
      );
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasDigit) {
      return NextResponse.json(
        { error: "New password must contain both letters and numbers for account security" },
        { status: 400 }
      );
    }

    // 1. Verify user exists
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found matching this email address" },
        { status: 404 }
      );
    }

    // 2. Validate and consume OTP (if enabled in Admin Settings)
    const otpValidation = await validateAndConsumeOtp({
      email: cleanEmail,
      code: otpCode,
      purpose: "FORGOT_PASSWORD",
    });

    if (!otpValidation.success) {
      return NextResponse.json(
        { error: otpValidation.error || "Invalid or expired password reset verification code." },
        { status: 400 }
      );
    }

    // 3. Hash new password and update user record
    const passwordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully! You may now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("[Forgot Password Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
