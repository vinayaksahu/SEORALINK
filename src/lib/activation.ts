import { db } from "./db";
import { RATES } from "./constants";
import { executeLedgerTransaction } from "./ledger";
import { processTierQueue, checkPendingRankPromotions } from "./queueEngine";
import Decimal from "decimal.js";

export interface ActivationResult {
  success: boolean;
  message: string;
  queueIndex?: number;
}

/**
 * Activates a user account with $10 USDT Micro-Entry fee from Fund Wallet.
 */
export async function activateUserAccount(userId: string): Promise<ActivationResult> {
  return await db.$transaction(async (tx) => {
    // 1. Fetch user
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { sponsor: true },
    });

    if (!user) {
      throw new Error("User account not found");
    }

    if (user.status === "ACTIVE") {
      throw new Error("Account is already active in the SEORALINK network");
    }

    const fundBalanceDec = new Decimal(user.fundBalance.toString());
    const entryFee = new Decimal(RATES.MICRO_ENTRY_FEE);

    if (fundBalanceDec.lessThan(entryFee)) {
      throw new Error(
        `Insufficient Fund Wallet balance. Current: $${fundBalanceDec.toFixed(2)}, Required: $${entryFee.toFixed(2)} USDT`
      );
    }

    // 2. Deduct $10 from Fund Wallet
    const activationRefKey = `ACTIVATION_FEE_${user.id}_${Date.now()}`;
    await executeLedgerTransaction(
      {
        userId: user.id,
        type: "ACTIVATION",
        wallet: "FUND",
        amount: entryFee.negated(),
        referenceKey: activationRefKey,
        description: "$10 USDT Micro-Entry Account Activation Fee",
      },
      tx
    );

    // 3. Mark user ACTIVE
    await tx.user.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",
        currentTier: 0, // Junior
      },
    });

    // 4. Reward Direct Sponsor (5% = $0.50 instant direct bonus)
    if (user.sponsorId) {
      // Increment sponsor active direct count
      await tx.user.update({
        where: { id: user.sponsorId },
        data: { directCount: { increment: 1 } },
      });

      const directBonus = entryFee.times(RATES.DIRECT_COMMISSION_PERCENT).dividedBy(100);
      const sponsorRefKey = `DIRECT_COMMISSION_FROM_${user.id}_FOR_${user.sponsorId}`;
      await executeLedgerTransaction(
        {
          userId: user.sponsorId,
          type: "DIRECT_COMMISSION",
          wallet: "INCOME",
          amount: directBonus,
          referenceKey: sponsorRefKey,
          description: `5% Instant Direct Sponsor Bonus from ${user.fullName} (${user.customId})`,
          sourceUserId: user.id,
        },
        tx
      );

      // Check if sponsor was held from a rank promotion due to missing direct
      await checkPendingRankPromotions(user.sponsorId, tx);
    }

    // 5. Enter Global Single-Leg Tier 0 (Junior) Queue
    const tier0Index = await tx.queueEntry.count({
      where: { tier: 0 },
    });

    await tx.queueEntry.create({
      data: {
        userId: user.id,
        tier: 0,
        queueIndex: tier0Index,
        childrenPlaced: 0,
        status: "WAITING",
      },
    });

    // 6. Process Queue matching
    await processTierQueue(0, tx);

    return {
      success: true,
      message: `Account activated successfully! Placed at Tier 0 (Junior) queue position #${tier0Index}.`,
      queueIndex: tier0Index,
    };
  });
}
