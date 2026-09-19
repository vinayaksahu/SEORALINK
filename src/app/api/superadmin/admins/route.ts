import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
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

    // Fetch all parallel sub-admins
    const admins = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        NOT: { role: "SUPER_ROOT_ADMIN" },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Gather branch statistics for each admin
    const enrichedAdmins = await Promise.all(
      admins.map(async (adm) => {
        const [
          totalMembers,
          activeMembers,
          pendingDeposits,
          pendingWithdrawals,
          approvedDepositsAgg,
          processedWithdrawalsAgg,
          totalQueueCount,
        ] = await Promise.all([
          db.user.count({ where: { adminId: adm.id, role: "USER" } }),
          db.user.count({ where: { adminId: adm.id, role: "USER", status: "ACTIVE" } }),
          db.depositRequest.count({ where: { user: { adminId: adm.id }, status: "PENDING" } }),
          db.withdrawalRequest.count({ where: { user: { adminId: adm.id }, status: "PENDING" } }),
          db.depositRequest.aggregate({
            where: { user: { adminId: adm.id }, status: "APPROVED" },
            _sum: { amount: true },
          }),
          db.withdrawalRequest.aggregate({
            where: { user: { adminId: adm.id }, status: "APPROVED" },
            _sum: { amount: true, feeAmount: true, netAmount: true },
          }),
          db.queueEntry.count({ where: { adminId: adm.id } }),
        ]);

        return {
          ...adm,
          totalMembers,
          activeMembers,
          pendingDeposits,
          pendingWithdrawals,
          totalQueueCount,
          totalDepositsUsdt: Number(approvedDepositsAgg._sum.amount || 0),
          totalWithdrawalsUsdt: Number(processedWithdrawalsAgg._sum.netAmount || 0),
          totalReserveCollectedUsdt: Number(processedWithdrawalsAgg._sum.feeAmount || 0),
        };
      })
    );

    return NextResponse.json({ admins: enrichedAdmins });
  } catch (error: any) {
    console.error("[SuperAdmin Admins GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const { fullName, customId, email, phone, password } = await req.json();

    if (!fullName || !customId || !email || !password) {
      return NextResponse.json(
        { error: "Full Name, Admin ID, Email, and Password are required." },
        { status: 400 }
      );
    }

    const cleanCustomId = customId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate Custom ID
    const existingId = await db.user.findFirst({
      where: { customId: cleanCustomId },
    });
    if (existingId) {
      return NextResponse.json(
        { error: `Admin ID "${cleanCustomId}" is already taken.` },
        { status: 400 }
      );
    }

    // Check duplicate Email
    const existingEmail = await db.user.findFirst({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: `Email "${cleanEmail}" is already registered.` },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password.trim());

    // Create the new parallel Admin
    const newAdmin = await db.user.create({
      data: {
        customId: cleanCustomId,
        referralCode: cleanCustomId,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        fundBalance: 0,
        incomeBalance: 0,
      },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Automatically seed a Genesis Top Node for this parallel Admin's branch with random customId
    const genesisEmail = `genesis_${cleanCustomId.toLowerCase()}@seoralink.local`;

    const existingGenesis = await db.user.findFirst({
      where: { email: genesisEmail },
    });

    if (!existingGenesis) {
      const genesisPasswordHash = await hashPassword("Genesis@123456");
      const randomGenesisDigits = Math.floor(100000 + Math.random() * 900000);
      const genesisCustomId = `SL${randomGenesisDigits}`;

      const genesisNode = await db.user.create({
        data: {
          customId: genesisCustomId,
          referralCode: genesisCustomId,
          fullName: `${newAdmin.fullName} Genesis Node`,
          email: genesisEmail,
          passwordHash: genesisPasswordHash,
          role: "USER",
          status: "ACTIVE",
          adminId: newAdmin.id,
          directCount: 100, // Pre-qualified
          currentTier: 0,
          fundBalance: 1000,
          incomeBalance: 0,
        },
      });

      // Place genesis in Tier 0 queue for this admin's isolated branch
      await db.queueEntry.create({
        data: {
          userId: genesisNode.id,
          adminId: newAdmin.id,
          tier: 0,
          queueIndex: 0,
          childrenPlaced: 0,
          status: "WAITING",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Parallel Admin ${newAdmin.customId} created successfully with dedicated isolated branch.`,
      admin: newAdmin,
    });
  } catch (error: any) {
    console.error("[SuperAdmin Admins POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create admin" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { adminId, action, newPassword, fullName, email, phone, customId, password } = body;
    if (!adminId) {
      return NextResponse.json({ error: "adminId is required." }, { status: 400 });
    }

    const targetAdmin = await db.user.findUnique({
      where: { id: adminId },
    });

    if (!targetAdmin || targetAdmin.role === "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Target admin not found or invalid operation." },
        { status: 404 }
      );
    }

    if (action === "TOGGLE_STATUS") {
      const updatedStatus = targetAdmin.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
      await db.user.update({
        where: { id: adminId },
        data: { status: updatedStatus },
      });
      return NextResponse.json({
        success: true,
        message: `Admin ${targetAdmin.customId} status updated to ${updatedStatus}.`,
      });
    }

    if (action === "RESET_PASSWORD") {
      if (!newPassword || newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }
      const passwordHash = await hashPassword(newPassword.trim());
      await db.user.update({
        where: { id: adminId },
        data: { passwordHash },
      });
      return NextResponse.json({
        success: true,
        message: `Password for Admin ${targetAdmin.customId} updated successfully.`,
      });
    }

    if (action === "UPDATE_PROFILE") {
      const updateData: any = {};

      if (fullName && fullName.trim()) {
        updateData.fullName = fullName.trim();
      }

      if (phone !== undefined) {
        updateData.phone = phone ? phone.trim() : null;
      }

      if (email && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail !== targetAdmin.email.toLowerCase()) {
          const emailConflict = await db.user.findFirst({
            where: {
              email: cleanEmail,
              NOT: { id: adminId },
            },
          });
          if (emailConflict) {
            return NextResponse.json(
              { error: `Email "${cleanEmail}" is already registered by another user.` },
              { status: 400 }
            );
          }
          updateData.email = cleanEmail;
        }
      }

      if (customId && customId.trim()) {
        const cleanCustomId = customId.trim().toUpperCase();
        if (cleanCustomId !== targetAdmin.customId.toUpperCase()) {
          const idConflict = await db.user.findFirst({
            where: {
              OR: [
                { customId: cleanCustomId },
                { referralCode: cleanCustomId },
              ],
              NOT: { id: adminId },
            },
          });
          if (idConflict) {
            return NextResponse.json(
              { error: `Admin ID "${cleanCustomId}" is already taken.` },
              { status: 400 }
            );
          }
          updateData.customId = cleanCustomId;
          updateData.referralCode = cleanCustomId;
        }
      }

      if (password && password.trim()) {
        if (password.trim().length < 6) {
          return NextResponse.json(
            { error: "Password must be at least 6 characters." },
            { status: 400 }
          );
        }
        updateData.passwordHash = await hashPassword(password.trim());
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: "No changes detected to update." },
          { status: 400 }
        );
      }

      const updated = await db.user.update({
        where: { id: adminId },
        data: updateData,
        select: {
          id: true,
          customId: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Admin ${updated.customId} profile updated successfully!`,
        admin: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[SuperAdmin Admins PATCH Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin" },
      { status: 500 }
    );
  }
}
