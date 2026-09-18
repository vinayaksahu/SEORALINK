import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { RATES, TIER_NAMES, TIER_VALUES, NET_CASHOUT_VALUES } from "@/lib/constants";
import { executeLedgerTransaction } from "@/lib/ledger";
import Decimal from "decimal.js";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { category, amount, toAddress } = await req.json();

    const cleanAddress = toAddress ? toAddress.trim() : "";
    if (!cleanAddress || !cleanAddress.startsWith("0x") || cleanAddress.length !== 42) {
      return NextResponse.json(
        { error: "A valid Binance Smart Chain (BEP-20) destination address starting with 0x (42 characters) is required" },
        { status: 400 }
      );
    }

    const targetNetwork = "USDT_BEP20";
    const withdrawalCategory = category === "RANK_EXIT" ? "RANK_EXIT" : "COMMISSION";

    return await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        include: {
          queueEntries: {
            orderBy: { tier: "desc" },
          },
        },
      });

      if (!user) {
        throw new Error("User account not found");
      }

      const hasRankExit = Boolean(
        await tx.withdrawalRequest.findFirst({
          where: {
            userId: user.id,
            OR: [
              { feePercent: 20 },
              { adminNote: { contains: "CASHOUT" } },
              { adminNote: { contains: "RANK_EXIT" } },
              { amount: 20480 },
            ],
            status: { not: "REJECTED" },
          },
        })
      );

      if (user.status === "BLOCKED" || user.status === "SUSPENDED") {
        if (!hasRankExit) {
          throw new Error("This account has been blocked by administration and cannot initiate withdrawals.");
        }

        // Single-Exit accounts can only withdraw remaining balance from Commission Wallet
        if (withdrawalCategory !== "COMMISSION") {
          throw new Error("You have already executed your one-time lifetime Rank Pool Wallet cashout.");
        }
      }

      if (user.status !== "ACTIVE" && !hasRankExit) {
        throw new Error("Account activation ($10 USDT) is required before initiating withdrawals. Please activate your account first.");
      }

      // ==========================================
      // CASE 1: COMMISSION WALLET WITHDRAWAL (10% FEE)
      // ==========================================
      if (withdrawalCategory === "COMMISSION") {
        const numAmount = parseFloat(amount);
        const minAmount = hasRankExit ? 1 : 10;

        if (!amount || isNaN(numAmount) || numAmount < minAmount) {
          throw new Error(`Minimum commission withdrawal amount is $${minAmount.toFixed(2)} USDT`);
        }

        if (!hasRankExit && numAmount % 5 !== 0) {
          throw new Error("Withdrawal amount must be in multiples of $5 USDT (e.g. $10, $15, $20, $25, $30...)");
        }

        const amountDec = new Decimal(amount);
        const incomeBal = new Decimal(user.incomeBalance.toString());

        if (incomeBal.lessThan(amountDec)) {
          throw new Error(
            `Insufficient Commission Wallet balance. Available: $${incomeBal.toFixed(2)}, Requested: $${amountDec.toFixed(2)} USDT`
          );
        }

        // Flat 10% deduction on all affiliate commission withdrawals
        const feePercent = RATES.COMMISSION_DEDUCTION_PERCENT; // 10%
        const feeAmount = amountDec.times(feePercent).dividedBy(100);
        const netAmount = amountDec.minus(feeAmount);

        // Deduct from Income (Commission) Wallet
        const withdrawRefKey = `COMMISSION_WITHDRAW_${user.id}_${Date.now()}`;
        await executeLedgerTransaction(
          {
            userId: user.id,
            type: "WITHDRAWAL",
            wallet: "INCOME",
            amount: amountDec.negated(),
            referenceKey: withdrawRefKey,
            description: `Commission Cashout ($${amountDec.toFixed(2)} Gross - 10% Fee = $${netAmount.toFixed(2)} Net to ${toAddress.slice(0, 8)}...)`,
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
            network: targetNetwork,
            adminNote: "[COMMISSION_WITHDRAWAL] 10% protocol fee applied. Account remains fully active.",
            status: "PENDING",
          },
        });

        return NextResponse.json({
          success: true,
          message: `Commission withdrawal request for $${netAmount.toFixed(2)} USDT submitted successfully (10% protocol fee applied). Your account remains fully active.`,
          withdrawal,
        });
      }

      // ==========================================
      // CASE 2: RANK POOL WALLET CASHOUT (SINGLE-EXIT / ULTIMA)
      // ==========================================
      // Verify user hasn't already taken a Rank Pool withdrawal
      const existingRankWithdrawal = await tx.withdrawalRequest.findFirst({
        where: {
          userId: user.id,
          OR: [
            { feePercent: 20 },
            { adminNote: { contains: "CASHOUT" } },
            { adminNote: { contains: "RANK_EXIT" } },
            { amount: 20480 },
          ],
          status: { not: "REJECTED" },
        },
      });

      if (existingRankWithdrawal) {
        throw new Error(
          "You have already executed your one-time Rank Pool Wallet withdrawal. The Rank Pool Wallet allows only one single cashout in a member's lifetime."
        );
      }

      const tier = user.currentTier;
      if (tier < 1) {
        throw new Error("You must reach at least Tier 1 (Zen) to qualify for Rank Pool Wallet cashout.");
      }

      const grossValue = new Decimal(TIER_VALUES[tier]);
      const isUltima = tier === 12;

      // Fee calculation: 10% for Ultima, 20% for R1-R11
      const feePercent = isUltima ? RATES.ULTIMA_DEDUCTION_PERCENT : RATES.INTERMEDIATE_DEDUCTION_PERCENT;
      const feeAmount = grossValue.times(feePercent).dividedBy(100);
      const netAmount = grossValue.minus(feeAmount);

      let adminNote = "";
      if (isUltima) {
        // Ultima completion: 10% fee ($18,432 Net), ID stays ACTIVE for life!
        adminNote = `[ULTIMA_APEX_CASHOUT: Tier 12 (Ultima)] Gross: $${grossValue.toFixed(2)}, Fee: 10% ($${feeAmount.toFixed(2)}), Net: $${netAmount.toFixed(2)}. Account remains permanently ACTIVE for life for direct sponsoring and 5% overrides.`;
      } else {
        // Intermediate R1-R11 exit: 20% fee, ID PERMANENTLY BANNED
        adminNote = `[RANK_EXIT_CASHOUT: Tier ${tier} (${TIER_NAMES[tier]})] Gross: $${grossValue.toFixed(2)}, Fee: 20% ($${feeAmount.toFixed(2)}), Net: $${netAmount.toFixed(2)}. Single-Exit executed: User permanently deactivated and banned. Cannot be reactivated.`;

        // Permanently ban and deactivate user account
        await tx.user.update({
          where: { id: user.id },
          data: {
            status: "BLOCKED",
          },
        });

        // Cancel any active waiting queue entries
        await tx.queueEntry.updateMany({
          where: { userId: user.id, status: "WAITING" },
          data: { status: "COMPLETED" },
        });
      }

      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: grossValue.toFixed(8),
          feePercent: new Decimal(feePercent).toFixed(2),
          feeAmount: feeAmount.toFixed(8),
          netAmount: netAmount.toFixed(8),
          toAddress: toAddress.trim(),
          network: targetNetwork,
          adminNote,
          status: "PENDING",
        },
      });

      const successMsg = isUltima
        ? `Congratulations! Ultima Apex cashout of $${netAmount.toFixed(2)} USDT submitted successfully (10% fee applied). Your account remains permanently ACTIVE for life with unlimited direct sponsoring & 5% team overrides.`
        : `Rank Reward Exit for Tier ${tier} (${TIER_NAMES[tier]}) submitted for $${netAmount.toFixed(2)} USDT (20% reserve deduction). As per Single-Exit protocol rules, your account has been permanently deactivated and banned.`;

      return NextResponse.json({
        success: true,
        message: successMsg,
        isBanned: !isUltima,
        isUltima,
        withdrawal,
      });
    }, { timeout: 35000, maxWait: 15000 });
  } catch (error: any) {
    console.error("[Withdrawal Request Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit withdrawal request" },
      { status: 400 }
    );
  }
}
