import { NextResponse } from "next/server";
import { getAllOtpSettings, OtpPurpose } from "@/lib/otp";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const purpose = searchParams.get("purpose") as OtpPurpose | null;

    const settings = await getAllOtpSettings();

    let enabled = true;
    if (purpose && purpose in settings) {
      enabled = settings[purpose];
    }

    return NextResponse.json({ success: true, enabled, settings });
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
