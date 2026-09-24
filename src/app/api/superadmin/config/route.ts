import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");

    const allConfigs = await db.systemConfig.findMany({
      orderBy: { key: "asc" },
    });

    const configMap: Record<string, string> = {};
    for (const c of allConfigs) {
      configMap[c.key] = c.value;
    }

    // Base standard keys
    const standardKeys = [
      "USDT_DEPOSIT_ADDRESS",
      "USDT_DEPOSIT_ADDRESSES",
      "DEPOSIT_DISTRIBUTION_MODE",
      "DEFAULT_NETWORK",
      "OTP_ENABLED_REGISTRATION",
      "OTP_ENABLED_FORGOT_PASSWORD",
      "OTP_ENABLED_WITHDRAWAL",
      "OTP_ENABLED_PROFILE_UPDATE",
      "REQUIRE_ACTIVE_SPONSOR",
    ];

    if (adminId && adminId !== "GLOBAL") {
      // Build effective config for this specific admin branch with global fallback
      const branchConfig: Record<string, string> = {};
      const customizedKeys: string[] = [];

      for (const baseKey of standardKeys) {
        const scopedKey = `${baseKey}_${adminId}`;
        if (configMap[scopedKey] !== undefined) {
          branchConfig[baseKey] = configMap[scopedKey];
          customizedKeys.push(baseKey);
        } else if (baseKey === "USDT_DEPOSIT_ADDRESS" && configMap[`ADMIN_DEPOSIT_ADDRESS_${adminId}`] !== undefined) {
          branchConfig[baseKey] = configMap[`ADMIN_DEPOSIT_ADDRESS_${adminId}`];
          customizedKeys.push(baseKey);
        } else {
          branchConfig[baseKey] = configMap[baseKey] || "";
        }
      }

      return NextResponse.json({
        success: true,
        adminId,
        configs: branchConfig,
        customizedKeys,
        rawConfigs: allConfigs,
      });
    }

    return NextResponse.json({
      success: true,
      adminId: "GLOBAL",
      configs: configMap,
      rawConfigs: allConfigs,
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

    const { configs, adminId } = await req.json();
    if (!configs || typeof configs !== "object") {
      return NextResponse.json({ error: "configs object is required." }, { status: 400 });
    }

    const isBranchScoped = Boolean(adminId && adminId !== "GLOBAL");

    const getCleanDescription = (key: string, targetAdmin?: string) => {
      const scopeNote = targetAdmin ? ` (Branch Admin ${targetAdmin})` : " (Global Platform Default)";
      switch (key) {
        case "OTP_ENABLED_REGISTRATION":
          return `System requirement: Email OTP verification for registration${scopeNote}`;
        case "OTP_ENABLED_FORGOT_PASSWORD":
          return `System requirement: Email OTP verification for password reset${scopeNote}`;
        case "OTP_ENABLED_WITHDRAWAL":
          return `System requirement: Email OTP verification for withdrawal requests${scopeNote}`;
        case "OTP_ENABLED_PROFILE_UPDATE":
          return `System requirement: Email OTP verification for profile updates${scopeNote}`;
        case "REQUIRE_ACTIVE_SPONSOR":
          return `Policy: Require members to have an active ($10 USDT) account before they can sponsor/refer new users${scopeNote}`;
        case "DEFAULT_NETWORK":
          return `Default deposit blockchain network${scopeNote}`;
        case "DEPOSIT_DISTRIBUTION_MODE":
          return `Deposit address distribution mode: MULTI_USER or SINGLE${scopeNote}`;
        case "USDT_DEPOSIT_ADDRESS":
        case "ADMIN_DEPOSIT_ADDRESS":
          return `Official USDT deposit wallet address for member fund top-up${scopeNote}`;
        case "USDT_DEPOSIT_ADDRESSES":
          return `List of official USDT deposit wallet addresses for multi-user distribution${scopeNote}`;
        default:
          return `System configuration for ${key}${scopeNote}`;
      }
    };

    for (const [key, value] of Object.entries(configs)) {
      if (typeof value === "string") {
        const targetKey = isBranchScoped
          ? (key.endsWith(`_${adminId}`) ? key : `${key}_${adminId}`)
          : key;

        await db.systemConfig.upsert({
          where: { key: targetKey },
          update: {
            value,
            description: getCleanDescription(key, isBranchScoped ? adminId : undefined),
          },
          create: {
            key: targetKey,
            value,
            description: getCleanDescription(key, isBranchScoped ? adminId : undefined),
          },
        });

        // Also sync ADMIN_DEPOSIT_ADDRESS_${adminId} if USDT_DEPOSIT_ADDRESS is updated
        if (isBranchScoped && key === "USDT_DEPOSIT_ADDRESS") {
          const adminAddrKey = `ADMIN_DEPOSIT_ADDRESS_${adminId}`;
          await db.systemConfig.upsert({
            where: { key: adminAddrKey },
            update: {
              value,
              description: getCleanDescription("ADMIN_DEPOSIT_ADDRESS", adminId),
            },
            create: {
              key: adminAddrKey,
              value,
              description: getCleanDescription("ADMIN_DEPOSIT_ADDRESS", adminId),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: isBranchScoped
        ? `Branch configurations for Admin ${adminId} saved live successfully without affecting other admins.`
        : "Global system configurations saved live successfully.",
    });
  } catch (error: any) {
    console.error("[SuperAdmin Config POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configurations." },
      { status: 500 }
    );
  }
}
