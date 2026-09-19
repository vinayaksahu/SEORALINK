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

    const [
      totalAdmins,
      totalUsers,
      activeUsers,
      totalQueueEntries,
      activeWaitingQueue,
      pendingDepositsCount,
      pendingWithdrawalsCount,
      depositsAgg,
      withdrawalsAgg,
    ] = await Promise.all([
      db.user.count({
        where: {
          role: { in: ["ADMIN", "SUPER_ADMIN"] },
          NOT: { role: "SUPER_ROOT_ADMIN" },
        },
      }),
      db.user.count({ where: { role: "USER" } }),
      db.user.count({ where: { role: "USER", status: "ACTIVE" } }),
      db.queueEntry.count(),
      db.queueEntry.count({ where: { status: "WAITING" } }),
      db.depositRequest.count({ where: { status: "PENDING" } }),
      db.withdrawalRequest.count({ where: { status: "PENDING" } }),
      db.depositRequest.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
      db.withdrawalRequest.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true, feeAmount: true, netAmount: true },
      }),
    ]);

    const totalApprovedDepositsUsdt = Number(depositsAgg._sum.amount || 0);
    const totalProcessedWithdrawalsUsdt = Number(withdrawalsAgg._sum.netAmount || 0);
    const totalReserveCollectedUsdt = Number(withdrawalsAgg._sum.feeAmount || 0);

    return NextResponse.json({
      stats: {
        totalAdmins,
        totalUsers,
        activeUsers,
        totalQueueEntries,
        activeWaitingQueue,
        pendingDepositsCount,
        pendingWithdrawalsCount,
        totalApprovedDepositsUsdt,
        totalProcessedWithdrawalsUsdt,
        totalReserveCollectedUsdt,
      },
    });
  } catch (error: any) {
    console.error("[SuperAdmin Stats Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch superadmin stats" },
      { status: 500 }
    );
  }
}
