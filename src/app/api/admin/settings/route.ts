import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const {
      usdtAddress,
      network,
      depositAddresses,
      distributionMode,
      otpSettings,
      requireActiveSponsor,
    } = await req.json();

    let primaryAddress = usdtAddress ? usdtAddress.trim() : "";

    if (Array.isArray(depositAddresses) && depositAddresses.length > 0) {
      const sanitizedAddresses = depositAddresses
        .filter((item: any) => item && typeof item.address === "string" && item.address.trim().length > 0)
        .map((item: any, idx: number) => ({
          id: item.id || `addr_${Date.now()}_${idx}`,
          address: item.address.trim(),
          label: item.label ? item.label.trim() : `Wallet ${idx + 1}`,
          network: item.network || "USDT_BEP20",
          isActive: item.isActive !== false,
          isPrimary: Boolean(item.isPrimary),
        }));

      if (sanitizedAddresses.length > 0) {
        // Find primary or default to first active
        const primaryItem = sanitizedAddresses.find((a: any) => a.isPrimary && a.isActive) ||
          sanitizedAddresses.find((a: any) => a.isActive) ||
          sanitizedAddresses[0];

        primaryAddress = primaryItem.address;

        await db.systemConfig.upsert({
          where: { key: "USDT_DEPOSIT_ADDRESSES" },
          update: { value: JSON.stringify(sanitizedAddresses) },
          create: {
            key: "USDT_DEPOSIT_ADDRESSES",
            value: JSON.stringify(sanitizedAddresses),
            description: "List of official USDT deposit wallet addresses for multi-user distribution",
          },
        });
      }
    }

    if (distributionMode) {
      await db.systemConfig.upsert({
        where: { key: "DEPOSIT_DISTRIBUTION_MODE" },
        update: { value: distributionMode },
        create: {
          key: "DEPOSIT_DISTRIBUTION_MODE",
          value: distributionMode,
          description: "Deposit address distribution mode: MULTI_USER or SINGLE",
        },
      });
    }

    if (primaryAddress) {
      await db.systemConfig.upsert({
        where: { key: "USDT_DEPOSIT_ADDRESS" },
        update: { value: primaryAddress },
        create: {
          key: "USDT_DEPOSIT_ADDRESS",
          value: primaryAddress,
          description: "Official USDT deposit wallet address for member fund top-up",
        },
      });
    }

    if (network) {
      await db.systemConfig.upsert({
        where: { key: "DEFAULT_NETWORK" },
        update: { value: network.trim() },
        create: {
          key: "DEFAULT_NETWORK",
          value: network.trim(),
          description: "Default deposit blockchain network",
        },
      });
    }

    if (otpSettings && typeof otpSettings === "object") {
      const keys = [
        { key: "OTP_ENABLED_REGISTRATION", val: otpSettings.REGISTRATION },
        { key: "OTP_ENABLED_FORGOT_PASSWORD", val: otpSettings.FORGOT_PASSWORD },
        { key: "OTP_ENABLED_WITHDRAWAL", val: otpSettings.WITHDRAWAL },
        { key: "OTP_ENABLED_PROFILE_UPDATE", val: otpSettings.PROFILE_UPDATE },
      ];

      for (const item of keys) {
        if (typeof item.val === "boolean") {
          await db.systemConfig.upsert({
            where: { key: item.key },
            update: { value: item.val ? "true" : "false" },
            create: {
              key: item.key,
              value: item.val ? "true" : "false",
              description: `Email OTP security toggle for ${item.key}`,
            },
          });
        }
      }
    }

    if (typeof requireActiveSponsor === "boolean") {
      await db.systemConfig.upsert({
        where: { key: "REQUIRE_ACTIVE_SPONSOR" },
        update: { value: requireActiveSponsor ? "true" : "false" },
        create: {
          key: "REQUIRE_ACTIVE_SPONSOR",
          value: requireActiveSponsor ? "true" : "false",
          description: "Policy: Require active account ($10 USDT) for referrals and sponsorship",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "System configuration updated successfully.",
    });
  } catch (error: any) {
    console.error("[Settings Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update configuration" },
      { status: 500 }
    );
  }
}
