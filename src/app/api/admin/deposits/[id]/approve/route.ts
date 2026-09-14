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

    return await db.$transaction(async (tx) => {
      const deposit = await tx.depositRequest.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!deposit) {
        throw new Error("Deposit request not found");
      }

      if (deposit.status !== "PENDING") {
        throw new Error(`Deposit has already been ${deposit.status.toLowerCase()}`);
      }

      // Mark APPROVED
      await tx.depositRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: session.userId,
        },
      });

      // Credit user's Fund Wallet via immutable ledger
      const depositRefKey = `DEPOSIT_APPROVED_${deposit.id}`;
      await executeLedgerTransaction(
        {
          userId: deposit.userId,
          type: "DEPOSIT",
          wallet: "FUND",
          amount: new Decimal(deposit.amount.toString()),
          referenceKey: depositRefKey,
          description: `USDT Deposit Approved (TxID: ${deposit.txHash.slice(0, 10)}...)`,
        },
        tx
      );

      return NextResponse.json({
        success: true,
        message: `Deposit of $${parseFloat(deposit.amount.toString()).toFixed(2)} USDT approved and credited to ${deposit.user.fullName}.`,
      });
    });
  } catch (error: any) {
    console.error("[Approve Deposit Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve deposit" },
      { status: 400 }
    );
  }
}
