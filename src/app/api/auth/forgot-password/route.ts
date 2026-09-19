import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { validateAndConsumeOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email, otpCode, newPassword } = await req.json();

    const cleanEmail = email ? email.toLowerCase().trim() : "";
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
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
