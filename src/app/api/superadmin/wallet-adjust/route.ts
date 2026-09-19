import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeLedgerTransaction, WalletType } from "@/lib/ledger";
import Decimal from "decimal.js";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const { userId, action, wallet, amount, note } = await req.json();

    if (!userId || !action || !wallet || !amount) {
      return NextResponse.json(
        { error: "User ID/Custom ID, Action, Wallet, and Amount are required." },
        { status: 400 }
      );
    }

    const cleanInput = userId.trim();
    const targetUser = await db.user.findFirst({
      where: {
        OR: [
          { id: cleanInput },
          { customId: { equals: cleanInput, mode: "insensitive" } },
          { email: { equals: cleanInput.toLowerCase(), mode: "insensitive" } },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `Target user "${cleanInput}" not found.` },
        { status: 404 }
      );
    }

    const parsedAmount = new Decimal(amount.toString());
    if (parsedAmount.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    const isCredit = action === "CREDIT";
    const deltaAmount = isCredit ? parsedAmount : parsedAmount.negated();

    if (!isCredit) {
      const currentBal = new Decimal(
        (wallet === "FUND" ? targetUser.fundBalance : targetUser.incomeBalance).toString()
      );
      if (currentBal.lessThan(parsedAmount)) {
        return NextResponse.json(
          {
            error: `Insufficient balance for debit. Current balance is $${currentBal.toFixed(2)} USDT.`,
          },
          { status: 400 }
        );
      }
    }

    const refKey = `SUPER_ROOT_ADJUST_${targetUser.id}_${Date.now()}`;
    const description = `Super Root Admin Manual ${action} of $${parsedAmount.toFixed(2)} USDT to ${wallet} wallet. Note: ${note || "None"}`;

    const ledgerRes = await executeLedgerTransaction({
      userId: targetUser.id,
      type: "ADMIN_ADJUSTMENT",
      wallet: wallet as WalletType,
      amount: deltaAmount,
      referenceKey: refKey,
      description,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${isCredit ? "credited" : "debited"} $${parsedAmount.toFixed(2)} USDT ${isCredit ? "to" : "from"} ${targetUser.customId}'s ${wallet} wallet.`,
      ledger: ledgerRes.ledger,
    });
  } catch (error: any) {
    console.error("[SuperAdmin Wallet Adjust Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to adjust wallet" },
      { status: 500 }
    );
  }
}
