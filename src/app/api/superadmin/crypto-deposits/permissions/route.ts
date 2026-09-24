import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/auditLogger";
import {
  ALL_DEPOSIT_PERMISSIONS,
  getDepositProcessingMode,
  serializeBlockchainData,
} from "@/lib/blockchain/config";

export const dynamic = "force-dynamic";

/**
 * GET: Lists all sub-admins with their branch deposit mode, dedicated vaults, and granular permissions
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json({ error: "Restricted to SuperRootAdmin" }, { status: 403 });
    }

    const admins = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        depositMode: true,
        usdtAddress: true,
        teamPrefix: true,
        createdAt: true,
        _count: {
          select: {
            teamMembers: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch all deposit permissions
    const permissions = await db.adminDepositPermission.findMany();
    const permMap = new Map<string, string[]>();
    for (const p of permissions) {
      if (!permMap.has(p.adminId)) {
        permMap.set(p.adminId, []);
      }
      permMap.get(p.adminId)!.push(p.permission);
    }

    // Fetch dedicated vault configs
    const vaultConfigs = await db.systemConfig.findMany({
      where: {
        key: { startsWith: "ADMIN_DEPOSIT_" },
      },
    });
    const configMap = new Map<string, string>();
    for (const c of vaultConfigs) {
      configMap.set(c.key, c.value);
    }

    // Build enriched admin branch list
    const enrichedAdmins = await Promise.all(
      admins.map(async (adm) => {
        const dedicatedAddress =
          configMap.get(`ADMIN_DEPOSIT_ADDRESS_${adm.id}`) || adm.usdtAddress || "";
        const dedicatedQr = configMap.get(`ADMIN_DEPOSIT_QR_${adm.id}`) || "";
        const activePerms = permMap.get(adm.id) || [];
        const effectiveMode = await getDepositProcessingMode(adm.id);

        const pendingDepositsCount = await db.depositRequest.count({
          where: {
            user: { adminId: adm.id },
            status: { in: ["PENDING", "PENDING_REVIEW", "CONFIRMING"] },
          },
        });

        return {
          id: adm.id,
          customId: adm.customId,
          fullName: adm.fullName,
          email: adm.email,
          role: adm.role,
          status: adm.status,
          teamPrefix: adm.teamPrefix || adm.customId,
          depositMode: adm.depositMode || "GLOBAL",
          effectiveMode,
          dedicatedVaultAddress: dedicatedAddress,
          dedicatedVaultQr: dedicatedQr,
          activePermissions: activePerms,
          totalMembers: adm._count.teamMembers,
          pendingDepositsCount,
        };
      })
    );

    return NextResponse.json(
      serializeBlockchainData({
        success: true,
        admins: enrichedAdmins,
        availablePermissions: ALL_DEPOSIT_PERMISSIONS,
      })
    );
  } catch (error: any) {
    console.error("[SuperAdmin Deposit Permissions GET Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin deposit permissions" },
      { status: 500 }
    );
  }
}

/**
 * POST: Updates per-admin deposit mode, dedicated vault, and granular RBAC permissions
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json({ error: "Restricted to SuperRootAdmin" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { adminId, depositMode, vaultAddress, vaultQrUrl, permissions } = body;

    if (!adminId) {
      return NextResponse.json({ error: "adminId is required" }, { status: 400 });
    }

    const targetAdmin = await db.user.findUnique({
      where: { id: adminId },
      select: { id: true, customId: true, fullName: true, role: true },
    });

    if (!targetAdmin) {
      return NextResponse.json({ error: "Admin branch not found" }, { status: 404 });
    }

    // 1. Update Admin depositMode
    if (depositMode && ["GLOBAL", "AUTOMATIC", "MANUAL"].includes(depositMode)) {
      await db.user.update({
        where: { id: adminId },
        data: { depositMode },
      });
    }

    // 2. Update dedicated vault address
    if (vaultAddress !== undefined) {
      const cleanAddr = typeof vaultAddress === "string" ? vaultAddress.trim() : "";
      await db.systemConfig.upsert({
        where: { key: `ADMIN_DEPOSIT_ADDRESS_${adminId}` },
        create: {
          key: `ADMIN_DEPOSIT_ADDRESS_${adminId}`,
          value: cleanAddr,
          description: `Dedicated USDT vault address for Admin branch ${targetAdmin.customId}`,
        },
        update: { value: cleanAddr },
      });

      // Also mirror to user.usdtAddress for quick queries
      await db.user.update({
        where: { id: adminId },
        data: { usdtAddress: cleanAddr || null },
      });
    }

    // 3. Update dedicated vault QR code URL
    if (vaultQrUrl !== undefined) {
      const cleanQr = typeof vaultQrUrl === "string" ? vaultQrUrl.trim() : "";
      await db.systemConfig.upsert({
        where: { key: `ADMIN_DEPOSIT_QR_${adminId}` },
        create: {
          key: `ADMIN_DEPOSIT_QR_${adminId}`,
          value: cleanQr,
          description: `Dedicated QR code image for Admin branch ${targetAdmin.customId}`,
        },
        update: { value: cleanQr },
      });
    }

    // 4. Update Granular RBAC Permissions
    if (Array.isArray(permissions)) {
      // Filter valid permissions
      const validPerms = permissions.filter((p: string) =>
        (ALL_DEPOSIT_PERMISSIONS as readonly string[]).includes(p)
      );

      // Delete existing and bulk create new permissions
      await db.$transaction([
        db.adminDepositPermission.deleteMany({
          where: { adminId },
        }),
        db.adminDepositPermission.createMany({
          data: validPerms.map((permission: string) => ({
            adminId,
            permission,
            grantedById: session.userId,
          })),
          skipDuplicates: true,
        }),
      ]);
    }

    await recordActivity({
      req,
      userId: session.userId,
      customId: session.customId,
      fullName: session.fullName,
      role: session.role,
      action: "ADMIN_DEPOSIT_SETTINGS_UPDATED",
      category: "SECURITY",
      targetUserId: targetAdmin.id,
      targetCustomId: targetAdmin.customId,
      details: {
        adminId,
        depositMode,
        vaultAddress,
        permissionsCount: Array.isArray(permissions) ? permissions.length : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deposit settings and permissions updated for branch ${targetAdmin.fullName} (${targetAdmin.customId}).`,
    });
  } catch (error: any) {
    console.error("[SuperAdmin Deposit Permissions POST Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin permissions" },
      { status: 500 }
    );
  }
}
