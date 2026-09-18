import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const txHash = body?.txHash ? body.txHash.trim() : null;
    const adminNote = body?.adminNote ? body.adminNote.trim() : (txHash ? `TxID: ${txHash}` : "Approved by administrator");

    const withdrawal = await db.withdrawalRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: `Withdrawal has already been ${withdrawal.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const originalNote = withdrawal.adminNote || "";
    let finalNote = adminNote;
    if (originalNote.includes("[")) {
      finalNote = `${originalNote} | ${adminNote}`;
    } else if (parseFloat(withdrawal.feePercent.toString()) === 20) {
      finalNote = `[RANK_EXIT_CASHOUT] ${adminNote}`;
    }

    await db.withdrawalRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        txHash,
        adminNote: finalNote,
        processedAt: new Date(),
        processedById: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal of $${parseFloat(withdrawal.netAmount.toString()).toFixed(2)} USDT marked as paid to ${withdrawal.user.fullName}.`,
    });
  } catch (error: any) {
    console.error("[Approve Withdrawal Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
