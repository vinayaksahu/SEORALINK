import { Prisma } from "@prisma/client";
import { db } from "./db";
import Decimal from "decimal.js";

export type WalletType = "FUND" | "INCOME";

export interface CreateLedgerParams {
  userId: string;
  type:
    | "DEPOSIT"
    | "ACTIVATION"
    | "DIRECT_COMMISSION"
    | "UPLINE_OVERRIDE"
    | "RANK_REWARD"
    | "PROTOCOL_RESERVE_DEDUCTION"
    | "WITHDRAWAL"
    | "WITHDRAWAL_REFUND"
    | "ADMIN_ADJUSTMENT";
  wallet: WalletType;
  amount: number | string | Decimal;
  referenceKey: string;
  description: string;
  sourceUserId?: string;
  tierNumber?: number;
}

export async function executeLedgerTransaction(
  params: CreateLedgerParams,
  externalTx?: Prisma.TransactionClient
) {
  const tx = externalTx || db;
  const amountDec = new Decimal(params.amount.toString());

  // Strict idempotency check
  const existing = await tx.ledgerEntry.findUnique({
    where: { referenceKey: params.referenceKey },
  });
  if (existing) {
    return { success: false, alreadyProcessed: true, ledger: existing };
  }

  // Fetch current user wallet balance
  const user = await tx.user.findUnique({
    where: { id: params.userId },
    select: {
      fundBalance: true,
      incomeBalance: true,
      totalEarned: true,
      totalWithdrawn: true,
    },
  });

  if (!user) {
    throw new Error(`User ${params.userId} not found for ledger transaction`);
  }

  let currentBalance: Decimal;
  let updateData: Prisma.UserUpdateInput = {};

  if (params.wallet === "FUND") {
    currentBalance = new Decimal(user.fundBalance.toString());
    const newBalance = currentBalance.plus(amountDec);
    if (newBalance.isNegative()) {
      throw new Error(`Insufficient Fund Wallet balance. Current: ${currentBalance}, Required: ${amountDec.abs()}`);
    }
    updateData = { fundBalance: newBalance.toFixed(8) };
  } else if (params.wallet === "INCOME") {
    currentBalance = new Decimal(user.incomeBalance.toString());
    const newBalance = currentBalance.plus(amountDec);
    if (newBalance.isNegative()) {
      throw new Error(`Insufficient Income Wallet balance. Current: ${currentBalance}, Required: ${amountDec.abs()}`);
    }
    
    // Update totalEarned if positive income
    let totalEarned = new Decimal(user.totalEarned.toString());
    if (amountDec.isPositive() && params.type !== "WITHDRAWAL_REFUND") {
      totalEarned = totalEarned.plus(amountDec);
    }
    
    // Update totalWithdrawn if withdrawal
    let totalWithdrawn = new Decimal(user.totalWithdrawn.toString());
    if (params.type === "WITHDRAWAL") {
      totalWithdrawn = totalWithdrawn.plus(amountDec.abs());
    }

    updateData = {
      incomeBalance: newBalance.toFixed(8),
      totalEarned: totalEarned.toFixed(8),
      totalWithdrawn: totalWithdrawn.toFixed(8),
    };
  } else {
    throw new Error(`Invalid wallet type: ${params.wallet}`);
  }

  const finalBalance = currentBalance.plus(amountDec);

  // Update user balance
  await tx.user.update({
    where: { id: params.userId },
    data: updateData,
  });

  // Create immutable ledger entry
  const entry = await tx.ledgerEntry.create({
    data: {
      userId: params.userId,
      type: params.type,
      wallet: params.wallet,
      amount: amountDec.toFixed(8),
      balanceBefore: currentBalance.toFixed(8),
      balanceAfter: finalBalance.toFixed(8),
      referenceKey: params.referenceKey,
      description: params.description,
      sourceUserId: params.sourceUserId,
      tierNumber: params.tierNumber,
    },
  });

  return { success: true, alreadyProcessed: false, ledger: entry };
}
