import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { RATES } from "@/lib/constants";
import { executeLedgerTransaction } from "@/lib/ledger";
import Decimal from "decimal.js";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { amount, toAddress, network } = await req.json();

    if (!amount || parseFloat(amount) < RATES.MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is $${RATES.MIN_WITHDRAWAL_AMOUNT.toFixed(2)} USDT` },
        { status: 400 }
      );
    }

    if (!toAddress || toAddress.trim().length < 10) {
      return NextResponse.json(
        { error: "A valid destination USDT wallet address is required" },
        { status: 400 }
      );
    }

    const amountDec = new Decimal(amount);

    return await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) {
        throw new Error("User account not found");
      }

      const incomeBal = new Decimal(user.incomeBalance.toString());
      if (incomeBal.lessThan(amountDec)) {
        throw new Error(
          `Insufficient Income Wallet balance. Available: $${incomeBal.toFixed(2)}, Requested: $${amountDec.toFixed(2)} USDT`
        );
      }

      // Determine fee rate: 10% on Ultima (Tier 12), 20% standard on others
      const feePercent = user.currentTier === 12 ? RATES.ULTIMA_DEDUCTION_PERCENT : RATES.STANDARD_DEDUCTION_PERCENT;
      const feeAmount = amountDec.times(feePercent).dividedBy(100);
      const netAmount = amountDec.minus(feeAmount);

      // Lock funds from Income Wallet
      const withdrawRefKey = `WITHDRAWAL_REQUEST_${user.id}_${Date.now()}`;
      await executeLedgerTransaction(
        {
          userId: user.id,
          type: "WITHDRAWAL",
          wallet: "INCOME",
          amount: amountDec.negated(),
          referenceKey: withdrawRefKey,
          description: `Withdrawal Request ($${amountDec.toFixed(2)} Gross - ${feePercent}% Fee = $${netAmount.toFixed(2)} Net to ${toAddress.slice(0, 8)}...)`,
        },
        tx
      );

      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: amountDec.toFixed(8),
          feePercent: new Decimal(feePercent).toFixed(2),
          feeAmount: feeAmount.toFixed(8),
          netAmount: netAmount.toFixed(8),
          toAddress: toAddress.trim(),
          network: network || "USDT_BEP20",
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal request for $${netAmount.toFixed(2)} USDT submitted successfully.`,
        withdrawal,
      });
    });
  } catch (error: any) {
    console.error("[Withdrawal Request Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit withdrawal request" },
      { status: 400 }
    );
  }
}
