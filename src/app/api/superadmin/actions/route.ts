import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { processTierQueue } from "@/lib/queueEngine";
import { executeLedgerTransaction } from "@/lib/ledger";
import Decimal from "decimal.js";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // ACTION 1: RUN TRIPOD QUEUE FOR A BRANCH
    if (action === "RUN_QUEUE") {
      const { branchAdminId } = body;
      if (!branchAdminId) {
        return NextResponse.json({ error: "branchAdminId is required." }, { status: 400 });
      }

      let totalMatches = 0;
      for (let tier = 0; tier <= 12; tier++) {
        const matches = await processTierQueue(tier, branchAdminId);
        totalMatches += matches;
      }

      return NextResponse.json({
        success: true,
        message: `Queue Engine executed successfully for branch. ${totalMatches} node matches finalized.`,
        totalMatches,
      });
    }

    // ACTION 2: APPROVE DEPOSIT
    if (action === "APPROVE_DEPOSIT") {
      const { depositId } = body;
      if (!depositId) {
        return NextResponse.json({ error: "depositId is required." }, { status: 400 });
      }

      return await db.$transaction(async (tx) => {
        const deposit = await tx.depositRequest.findUnique({
          where: { id: depositId },
          include: { user: true },
        });

        if (!deposit) {
          throw new Error("Deposit request not found.");
        }

        if (deposit.status !== "PENDING") {
          throw new Error(`Deposit has already been ${deposit.status.toLowerCase()}.`);
        }

        await tx.depositRequest.update({
          where: { id: depositId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedById: session.userId,
          },
        });

        const depositRefKey = `SUPER_DEPOSIT_APPROVED_${deposit.id}`;
        await executeLedgerTransaction(
          {
            userId: deposit.userId,
            type: "DEPOSIT",
            wallet: "FUND",
            amount: new Decimal(deposit.amount.toString()),
            referenceKey: depositRefKey,
            description: `Super Root Master USDT Deposit Approved (TxID: ${deposit.txHash ? deposit.txHash.slice(0, 12) : "N/A"}...)`,
          },
          tx
        );

        return NextResponse.json({
          success: true,
          message: `Deposit of $${parseFloat(deposit.amount.toString()).toFixed(2)} USDT approved by Super Root for ${deposit.user.fullName} (${deposit.user.customId}).`,
        });
      });
    }

    // ACTION 3: REJECT DEPOSIT
    if (action === "REJECT_DEPOSIT") {
      const { depositId, reason } = body;
      if (!depositId) {
        return NextResponse.json({ error: "depositId is required." }, { status: 400 });
      }

      const deposit = await db.depositRequest.findUnique({
        where: { id: depositId },
        include: { user: true },
      });

      if (!deposit) {
        return NextResponse.json({ error: "Deposit request not found." }, { status: 404 });
      }

      if (deposit.status !== "PENDING") {
        return NextResponse.json(
          { error: `Deposit has already been ${deposit.status.toLowerCase()}.` },
          { status: 400 }
        );
      }

      await db.depositRequest.update({
        where: { id: depositId },
        data: {
          status: "REJECTED",
          adminNote: reason || "Rejected by Super Root Admin command.",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deposit of $${parseFloat(deposit.amount.toString()).toFixed(2)} USDT rejected.`,
      });
    }

    // ACTION 4: APPROVE WITHDRAWAL
    if (action === "APPROVE_WITHDRAWAL") {
      const { withdrawalId, txHash } = body;
      if (!withdrawalId) {
        return NextResponse.json({ error: "withdrawalId is required." }, { status: 400 });
      }

      const withdrawal = await db.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
        include: { user: true },
      });

      if (!withdrawal) {
        return NextResponse.json({ error: "Withdrawal request not found." }, { status: 404 });
      }

      if (withdrawal.status !== "PENDING") {
        return NextResponse.json(
          { error: `Withdrawal has already been ${withdrawal.status.toLowerCase()}.` },
          { status: 400 }
        );
      }

      await db.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "APPROVED",
          txHash: txHash || "SUPER_ROOT_MANUAL_PAYOUT",
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal of $${parseFloat(withdrawal.netAmount.toString()).toFixed(2)} USDT approved and marked processed.`,
      });
    }

    // ACTION 5: REJECT WITHDRAWAL
    if (action === "REJECT_WITHDRAWAL") {
      const { withdrawalId, reason } = body;
      if (!withdrawalId) {
        return NextResponse.json({ error: "withdrawalId is required." }, { status: 400 });
      }

      return await db.$transaction(async (tx) => {
        const withdrawal = await tx.withdrawalRequest.findUnique({
          where: { id: withdrawalId },
          include: { user: true },
        });

        if (!withdrawal) {
          throw new Error("Withdrawal request not found.");
        }

        if (withdrawal.status !== "PENDING") {
          throw new Error(`Withdrawal has already been ${withdrawal.status.toLowerCase()}.`);
        }

        await tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: "REJECTED",
            adminNote: reason || "Rejected by Super Root Admin command.",
          },
        });

        // Refund total deducted amount back to user's Income Wallet
        const refundAmount = new Decimal(withdrawal.amount.toString());
        const refundRefKey = `SUPER_REFUND_WITHDRAWAL_${withdrawal.id}`;

        await executeLedgerTransaction(
          {
            userId: withdrawal.userId,
            type: "WITHDRAWAL_REFUND",
            wallet: "INCOME",
            amount: refundAmount,
            referenceKey: refundRefKey,
            description: `Super Root Refund for Rejected Withdrawal #${withdrawal.id.slice(0, 8)}`,
          },
          tx
        );

        return NextResponse.json({
          success: true,
          message: `Withdrawal rejected and full $${refundAmount.toFixed(2)} USDT refunded to user's Income Wallet.`,
        });
      });
    }

    // ACTION 6: REPLY TICKET
    if (action === "REPLY_TICKET") {
      const { ticketId, message } = body;
      if (!ticketId || !message) {
        return NextResponse.json({ error: "ticketId and message are required." }, { status: 400 });
      }

      await db.ticketMessage.create({
        data: {
          ticketId,
          senderId: session.userId,
          message: `[Super Root Admin]: ${message}`,
          isAdmin: true,
        },
      });

      await db.supportTicket.update({
        where: { id: ticketId },
        data: { status: "ANSWERED" },
      });

      return NextResponse.json({
        success: true,
        message: "Reply sent to ticket.",
      });
    }

    // ACTION 7: CLOSE TICKET
    if (action === "CLOSE_TICKET") {
      const { ticketId } = body;
      if (!ticketId) {
        return NextResponse.json({ error: "ticketId is required." }, { status: 400 });
      }

      await db.supportTicket.update({
        where: { id: ticketId },
        data: { status: "CLOSED" },
      });

      return NextResponse.json({
        success: true,
        message: "Ticket closed successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[SuperAdmin Action Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute administrative action." },
      { status: 500 }
    );
  }
}
