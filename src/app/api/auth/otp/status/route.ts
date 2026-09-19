import { NextResponse } from "next/server";
import { getAllOtpSettings } from "@/lib/otp";

export async function GET() {
  try {
    const settings = await getAllOtpSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      settings: {
        REGISTRATION: true,
        FORGOT_PASSWORD: true,
        WITHDRAWAL: true,
        PROFILE_UPDATE: true,
      },
    });
  }
}
