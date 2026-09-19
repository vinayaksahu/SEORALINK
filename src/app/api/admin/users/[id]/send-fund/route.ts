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
      return NextResponse.json(
        { error: "Unauthorized administrative access" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const rawAmount = body.amount !== undefined ? body.amount : 10;
    const note = (body.note || "").trim();
    const walletType = (body.wallet || "FUND").toUpperCase() === "INCOME" ? "INCOME" : "FUND";

    const amountDec = new Decimal(rawAmount.toString());
    if (amountDec.isNaN() || !amountDec.isFinite() || amountDec.lessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: "Please provide a valid positive amount to send." },
        { status: 400 }
      );
    }

    return await db.$transaction(
      async (tx) => {
        // Verify target member
        const user = await tx.user.findUnique({
          where: { id },
          select: {
            id: true,
            customId: true,
            fullName: true,
            email: true,
            status: true,
            fundBalance: true,
            incomeBalance: true,
          },
        });

        if (!user) {
          throw new Error("Target member not found");
        }

        const formattedAmount = amountDec.toFixed(2);
        const timestamp = Date.now();
        const randSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const refKey = `ADMIN_DIRECT_SEND_${user.id}_${timestamp}`;
        const txHash = `DIRECT_SEND_${timestamp}_${randSuffix}`;

        // 1. Credit wallet via immutable ledger
        const ledgerDescription =
          note ||
          `Direct Admin Fund Credit: $${formattedAmount} USDT (No Request)`;

        const ledgerResult = await executeLedgerTransaction(
          {
            userId: user.id,
            type: "ADMIN_ADJUSTMENT",
            wallet: walletType,
            amount: amountDec,
            referenceKey: refKey,
            description: ledgerDescription,
          },
          tx
        );

        // 2. If credited to Fund Wallet, record an approved DepositRequest for full transparency & tracking
        if (walletType === "FUND") {
          await tx.depositRequest.create({
            data: {
              userId: user.id,
              amount: amountDec.toFixed(8),
              txHash: txHash,
              network: "ADMIN_DIRECT_CREDIT",
              adminNote: note || "Direct Admin Transfer without member request",
              status: "APPROVED",
              approvedAt: new Date(),
              approvedById: session.userId,
            },
          });
        }

        // Fetch refreshed balances
        const updatedUser = await tx.user.findUnique({
          where: { id },
          select: {
            fundBalance: true,
            incomeBalance: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Successfully sent $${formattedAmount} USDT to ${user.fullName} (${user.customId}) without member request.`,
          user: {
            id: user.id,
            customId: user.customId,
            fullName: user.fullName,
            fundBalance: updatedUser?.fundBalance.toString() || "0",
            incomeBalance: updatedUser?.incomeBalance.toString() || "0",
          },
          ledger: ledgerResult.ledger,
        });
      },
      { timeout: 20000, maxWait: 10000 }
    );
  } catch (error: any) {
    console.error("[Admin Direct Send Fund Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute direct fund transfer" },
      { status: 400 }
    );
  }
}
