import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
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

    if (!adminId) {
      return NextResponse.json(
        { error: "adminId query parameter is required." },
        { status: 400 }
      );
    }

    const targetAdmin = await db.user.findUnique({
      where: { id: adminId },
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

    if (!targetAdmin) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    // Fetch all members belonging to this admin
    const members = await db.user.findMany({
      where: { adminId: adminId, role: "USER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        currentTier: true,
        directCount: true,
        fundBalance: true,
        incomeBalance: true,
        totalEarned: true,
        totalWithdrawn: true,
        usdtAddress: true,
        createdAt: true,
        sponsor: { select: { customId: true, fullName: true } },
        _count: { select: { directs: true, deposits: true, withdrawals: true, queueEntries: true } },
      },
    });

    // Fetch all deposits under this admin
    const deposits = await db.depositRequest.findMany({
      where: { user: { adminId: adminId } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { customId: true, fullName: true } },
      },
    });

    // Fetch all withdrawals under this admin
    const withdrawals = await db.withdrawalRequest.findMany({
      where: { user: { adminId: adminId } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { customId: true, fullName: true } },
      },
    });

    // Fetch queue entries under this admin
    const queue = await db.queueEntry.findMany({
      where: { adminId: adminId },
      orderBy: [{ tier: "asc" }, { queueIndex: "asc" }],
      take: 50,
      include: {
        user: { select: { customId: true, fullName: true } },
      },
    });

    // Fetch tickets under this admin
    const tickets = await db.supportTicket.findMany({
      where: { user: { adminId: adminId } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { customId: true, fullName: true } },
      },
    });

    return NextResponse.json({
      admin: targetAdmin,
      members,
      deposits,
      withdrawals,
      queue,
      tickets,
    });
  } catch (error: any) {
    console.error("[SuperAdmin Team Inspect Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to inspect admin team" },
      { status: 500 }
    );
  }
}
