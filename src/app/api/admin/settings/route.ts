import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAllOtpSettings } from "@/lib/otp";
import { isRequireActiveSponsorEnabled } from "@/lib/referralPolicy";
import { getBranchSystemConfig } from "@/lib/adminBranchConfig";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieves isolated system settings for the calling Admin branch
 * (or specified adminId if SuperRootAdmin)
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const url = new URL(req.url);
    const queryAdminId = url.searchParams.get("adminId");
    const targetRef = session.role === "SUPER_ROOT_ADMIN" && queryAdminId ? queryAdminId : session.userId;

    const adminUser = await db.user.findFirst({
      where: {
        OR: [
          { id: targetRef },
          { customId: { equals: targetRef, mode: "insensitive" } },
        ],
      },
      select: { id: true, customId: true, fullName: true, usdtAddress: true, usdtNetwork: true },
    });

    const [
      branchAddressConfig,
      branchAddressesListConfig,
      branchDistributionConfig,
      branchNetworkConfig,
    ] = await Promise.all([
      getBranchSystemConfig("USDT_DEPOSIT_ADDRESS", targetRef),
      getBranchSystemConfig("USDT_DEPOSIT_ADDRESSES", targetRef),
      getBranchSystemConfig("DEPOSIT_DISTRIBUTION_MODE", targetRef),
      getBranchSystemConfig("DEFAULT_NETWORK", targetRef),
    ]);

    const usdtAddress =
      branchAddressConfig.value ||
      adminUser?.usdtAddress ||
      "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001";

    let depositAddresses = [];
    try {
      const rawList = branchAddressesListConfig?.value;
      if (rawList) {
        depositAddresses = JSON.parse(rawList);
      }
    } catch {
      depositAddresses = [];
    }

    if (!Array.isArray(depositAddresses) || depositAddresses.length === 0) {
      depositAddresses = [
        {
          id: "addr_1",
          address: usdtAddress,
          label: `${adminUser?.fullName || "Branch"} Hot Wallet 1`,
          network: branchNetworkConfig?.value || adminUser?.usdtNetwork || "USDT_BEP20",
          isActive: true,
          isPrimary: true,
        },
      ];
    }

    const distributionMode = branchDistributionConfig?.value || "SINGLE";
    const network = branchNetworkConfig?.value || adminUser?.usdtNetwork || "USDT_BEP20";
    const otpSettings = await getAllOtpSettings(targetRef);
    const requireActiveSponsor = await isRequireActiveSponsorEnabled(targetRef);

    return NextResponse.json({
      success: true,
      adminId: adminUser?.id || targetRef,
      adminCustomId: adminUser?.customId,
      adminFullName: adminUser?.fullName,
      settings: {
        usdtAddress,
        depositAddresses,
        distributionMode,
        network,
        otpSettings,
        requireActiveSponsor,
      },
    });
  } catch (error: any) {
    console.error("[Admin Settings GET Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to load branch settings" },
      { status: 500 }
    );
  }
}

/**
 * POST: Saves isolated branch settings strictly for calling Admin
 * (or specified adminId if SuperRootAdmin)
 * Never affects other admins or parallel branches.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const body = await req.json();
    const {
      adminId: requestedAdminId,
      usdtAddress,
      network,
      depositAddresses,
      distributionMode,
      otpSettings,
      requireActiveSponsor,
    } = body;

    // Strict multi-tenant isolation: sub-admins can only configure their own branch
    const targetAdminId =
      session.role === "SUPER_ROOT_ADMIN" && requestedAdminId ? requestedAdminId : session.userId;

    const targetAdmin = await db.user.findFirst({
      where: {
        OR: [
          { id: targetAdminId },
          { customId: { equals: targetAdminId, mode: "insensitive" } },
        ],
      },
      select: { id: true, customId: true, fullName: true, usdtAddress: true, usdtNetwork: true },
    });

    if (!targetAdmin) {
      return NextResponse.json({ error: "Target admin branch not found" }, { status: 404 });
    }

    const adminIds = [targetAdmin.id, targetAdmin.customId];
    let primaryAddress = usdtAddress ? usdtAddress.trim() : "";

    // 1. Process and save branch-isolated deposit addresses
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
        const primaryItem =
          sanitizedAddresses.find((a: any) => a.isPrimary && a.isActive) ||
          sanitizedAddresses.find((a: any) => a.isActive) ||
          sanitizedAddresses[0];

        primaryAddress = primaryItem.address;

        for (const aId of adminIds) {
          await db.systemConfig.upsert({
            where: { key: `USDT_DEPOSIT_ADDRESSES_${aId}` },
            update: { value: JSON.stringify(sanitizedAddresses) },
            create: {
              key: `USDT_DEPOSIT_ADDRESSES_${aId}`,
              value: JSON.stringify(sanitizedAddresses),
              description: `Deposit addresses list for admin branch ${targetAdmin.customId}`,
            },
          });
        }
      }
    }

    // 2. Branch distribution mode
    if (distributionMode) {
      for (const aId of adminIds) {
        await db.systemConfig.upsert({
          where: { key: `DEPOSIT_DISTRIBUTION_MODE_${aId}` },
          update: { value: distributionMode },
          create: {
            key: `DEPOSIT_DISTRIBUTION_MODE_${aId}`,
            value: distributionMode,
            description: `Deposit distribution mode for admin branch ${targetAdmin.customId}`,
          },
        });
      }
    }

    // 3. Primary branch deposit vault
    if (primaryAddress) {
      for (const aId of adminIds) {
        await Promise.all([
          db.systemConfig.upsert({
            where: { key: `USDT_DEPOSIT_ADDRESS_${aId}` },
            update: { value: primaryAddress },
            create: {
              key: `USDT_DEPOSIT_ADDRESS_${aId}`,
              value: primaryAddress,
              description: `Primary USDT address for admin branch ${targetAdmin.customId}`,
            },
          }),
          db.systemConfig.upsert({
            where: { key: `ADMIN_DEPOSIT_ADDRESS_${aId}` },
            update: { value: primaryAddress },
            create: {
              key: `ADMIN_DEPOSIT_ADDRESS_${aId}`,
              value: primaryAddress,
              description: `Primary USDT address for admin branch ${targetAdmin.customId}`,
            },
          }),
        ]);
      }
      await db.user.update({
        where: { id: targetAdmin.id },
        data: { usdtAddress: primaryAddress },
      });
    }

    // 4. Branch blockchain network
    if (network) {
      for (const aId of adminIds) {
        await db.systemConfig.upsert({
          where: { key: `DEFAULT_NETWORK_${aId}` },
          update: { value: network.trim() },
          create: {
            key: `DEFAULT_NETWORK_${aId}`,
            value: network.trim(),
            description: `Deposit network for admin branch ${targetAdmin.customId}`,
          },
        });
      }
      await db.user.update({
        where: { id: targetAdmin.id },
        data: { usdtNetwork: network.trim() },
      });
    }

    // 5. Branch-isolated OTP settings
    if (otpSettings && typeof otpSettings === "object") {
      for (const aId of adminIds) {
        const keys = [
          { key: `OTP_ENABLED_REGISTRATION_${aId}`, val: otpSettings.REGISTRATION },
          { key: `OTP_ENABLED_FORGOT_PASSWORD_${aId}`, val: otpSettings.FORGOT_PASSWORD },
          { key: `OTP_ENABLED_WITHDRAWAL_${aId}`, val: otpSettings.WITHDRAWAL },
          { key: `OTP_ENABLED_PROFILE_UPDATE_${aId}`, val: otpSettings.PROFILE_UPDATE },
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
    }

    // 6. Branch-isolated Require Active Sponsor Policy
    if (typeof requireActiveSponsor === "boolean") {
      for (const aId of adminIds) {
        await db.systemConfig.upsert({
          where: { key: `REQUIRE_ACTIVE_SPONSOR_${aId}` },
          update: { value: requireActiveSponsor ? "true" : "false" },
          create: {
            key: `REQUIRE_ACTIVE_SPONSOR_${aId}`,
            value: requireActiveSponsor ? "true" : "false",
            description: `Require active sponsor policy for admin branch ${targetAdmin.customId}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Configuration for branch ${targetAdmin.fullName} (${targetAdmin.customId}) saved successfully without affecting other admins.`,
    });
  } catch (error: any) {
    console.error("[Settings Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update configuration" },
      { status: 500 }
    );
  }
}
