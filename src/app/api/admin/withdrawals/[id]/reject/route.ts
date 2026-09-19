import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeLedgerTransaction } from "@/lib/ledger";
import Decimal from "decimal.js";

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
    const adminNote = body?.adminNote || "Withdrawal rejected by administration";

    return await db.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequest.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!withdrawal || withdrawal.user.adminId !== session.userId) {
        throw new Error("Withdrawal request not found");
      }

      if (withdrawal.status !== "PENDING") {
        throw new Error(`Withdrawal has already been ${withdrawal.status.toLowerCase()}`);
      }

      // Mark REJECTED
      await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNote,
          processedAt: new Date(),
          processedById: session.userId,
        },
      });

      // Refund gross amount back to user's Income Wallet
      const refundRefKey = `WITHDRAWAL_REFUND_${withdrawal.id}`;
      await executeLedgerTransaction(
        {
          userId: withdrawal.userId,
          type: "WITHDRAWAL_REFUND",
          wallet: "INCOME",
          amount: new Decimal(withdrawal.amount.toString()),
          referenceKey: refundRefKey,
          description: `Withdrawal Refund: $${parseFloat(withdrawal.amount.toString()).toFixed(2)} USDT credited back to Income Wallet (${adminNote})`,
        },
        tx
      );

      return NextResponse.json({
        success: true,
        message: `Withdrawal rejected and $${parseFloat(withdrawal.amount.toString()).toFixed(2)} refunded to ${withdrawal.user.fullName}.`,
      });
    });
  } catch (error: any) {
    console.error("[Reject Withdrawal Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject withdrawal" },
      { status: 400 }
    );
  }
}
