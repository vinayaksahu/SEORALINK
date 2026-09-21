import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const configs = await db.systemConfig.findMany({
      orderBy: { key: "asc" },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    return NextResponse.json({
      success: true,
      configs: configMap,
      rawConfigs: configs,
    });
  } catch (error: any) {
    console.error("[SuperAdmin Config GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load configurations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const { configs } = await req.json();
    if (!configs || typeof configs !== "object") {
      return NextResponse.json({ error: "configs object is required." }, { status: 400 });
    }

    const getCleanDescription = (key: string) => {
      switch (key) {
        case "OTP_ENABLED_REGISTRATION":
          return "System requirement: Email OTP verification for registration";
        case "OTP_ENABLED_FORGOT_PASSWORD":
          return "System requirement: Email OTP verification for password reset";
        case "OTP_ENABLED_WITHDRAWAL":
          return "System requirement: Email OTP verification for withdrawal requests";
        case "OTP_ENABLED_PROFILE_UPDATE":
          return "System requirement: Email OTP verification for profile updates";
        case "REQUIRE_ACTIVE_SPONSOR":
          return "Policy: Require members to have an active ($10 USDT) account before they can sponsor/refer new users";
        case "DEFAULT_NETWORK":
          return "Default deposit blockchain network";
        case "DEPOSIT_DISTRIBUTION_MODE":
          return "Deposit address distribution mode: MULTI_USER or SINGLE";
        case "USDT_DEPOSIT_ADDRESS":
          return "Official USDT deposit wallet address for member fund top-up";
        case "USDT_DEPOSIT_ADDRESSES":
          return "List of official USDT deposit wallet addresses for multi-user distribution";
        default:
          return `System configuration for ${key}`;
      }
    };

    for (const [key, value] of Object.entries(configs)) {
      if (typeof value === "string") {
        await db.systemConfig.upsert({
          where: { key },
          update: {
            value,
            description: getCleanDescription(key),
          },
          create: {
            key,
            value,
            description: getCleanDescription(key),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Global system configurations saved live successfully.",
    });
  } catch (error: any) {
    console.error("[SuperAdmin Config POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configurations." },
      { status: 500 }
    );
  }
}
