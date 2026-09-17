import { Prisma } from "@prisma/client";
import { db } from "./db";
import { TIER_VALUES, REQUIRED_DIRECTS, RATES, TIER_NAMES } from "./constants";
import { executeLedgerTransaction } from "./ledger";
import Decimal from "decimal.js";

/**
 * Executes 2:1 Tripod single-leg queue matching for a specific tier.
 * A waiting node at `queueIndex` completes when total tier entries >= 2 * queueIndex + 3.
 */
export async function processTierQueue(
  tier: number,
  externalTx?: Prisma.TransactionClient
): Promise<number> {
  const tx = externalTx || db;
  let matchesProcessed = 0;

  while (true) {
    // 1. Find the front-most WAITING entry in this tier
    const frontEntry = await tx.queueEntry.findFirst({
      where: { tier, status: "WAITING" },
      orderBy: { queueIndex: "asc" },
      include: { user: true },
    });

    if (!frontEntry) break;

    // 2. Count total entries in this tier
    const totalEntriesInTier = await tx.queueEntry.count({
      where: { tier },
    });

    // 3. Condition for 2:1 Tripod match: total >= 2 * frontIndex + 3
    const requiredTotal = 2 * frontEntry.queueIndex + 3;
    if (totalEntriesInTier < requiredTotal) {
      // Check if partially matched (1 child placed = 50%)
      if (totalEntriesInTier === requiredTotal - 1 && frontEntry.childrenPlaced < 1) {
        await tx.queueEntry.update({
          where: { id: frontEntry.id },
          data: { childrenPlaced: 1 },
        });
      }
      break;
    }

    // 4. Match completed (100%)!
    const matchedUser = frontEntry.user;
    const grossReward = new Decimal(TIER_VALUES[tier]);

    // Mark entry as COMPLETED
    await tx.queueEntry.update({
      where: { id: frontEntry.id },
      data: {
        status: "COMPLETED",
        childrenPlaced: 2,
        matchedAt: new Date(),
      },
    });

    // Pay 5% Upline Override to direct mentor (ONLY if mentor is not banned)
    if (matchedUser.sponsorId) {
      const sponsor = await tx.user.findUnique({
        where: { id: matchedUser.sponsorId },
        select: { id: true, status: true },
      });

      // Banned/deactivated IDs forfeit all overrides; only active/eligible IDs earn
      if (sponsor && sponsor.status !== "BLOCKED" && sponsor.status !== "SUSPENDED") {
        const overrideAmount = grossReward.times(RATES.UPLINE_OVERRIDE_PERCENT).dividedBy(100);
        const overrideRefKey = `OVERRIDE_T${tier}_FROM_${matchedUser.id}_FOR_${matchedUser.sponsorId}`;
        await executeLedgerTransaction(
          {
            userId: matchedUser.sponsorId,
            type: "UPLINE_OVERRIDE",
            wallet: "INCOME",
            amount: overrideAmount,
            referenceKey: overrideRefKey,
            description: `5% Mentorship Override from ${matchedUser.fullName} (${matchedUser.customId}) completing Tier ${tier} (${TIER_NAMES[tier]})`,
            sourceUserId: matchedUser.id,
            tierNumber: tier,
          },
          tx
        );
      }
    }

    // Rolling Auto-Upgrade: 100% of value rolls into Next Tier if within 12 tiers
    const nextTier = tier + 1;
    if (nextTier <= 12) {
      const requiredDirects = REQUIRED_DIRECTS[nextTier];
      if (matchedUser.directCount >= requiredDirects) {
        // Upgrade currentTier on user
        await tx.user.update({
          where: { id: matchedUser.id },
          data: { currentTier: nextTier },
        });

        // Add to next tier queue (100% roll-forward)
        const nextQueueIndex = await tx.queueEntry.count({
          where: { tier: nextTier },
        });

        await tx.queueEntry.create({
          data: {
            userId: matchedUser.id,
            tier: nextTier,
            queueIndex: nextQueueIndex,
            childrenPlaced: 0,
            status: "WAITING",
          },
        });

        // Trigger queue processing on next tier (cascading velocity)
        await processTierQueue(nextTier, tx);
      }
    } else if (tier === 12) {
      // Completed Tier 12 Ultima! Rank queue finishes, user stays ACTIVE for lifetime direct & override benefits
      await tx.user.update({
        where: { id: matchedUser.id },
        data: { currentTier: 12 },
      });
    }

    matchesProcessed++;
  }

  return matchesProcessed;
}

/**
 * Re-checks eligibility for users who have completed a tier but were pending direct referrals.
 */
export async function checkPendingRankPromotions(
  userId: string,
  externalTx?: Prisma.TransactionClient
) {
  const tx = externalTx || db;
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: {
      queueEntries: {
        where: { status: "COMPLETED" },
        orderBy: { tier: "desc" },
      },
    },
  });

  if (!user || user.queueEntries.length === 0) return;

  const highestCompletedTier = user.queueEntries[0].tier;
  const targetNextTier = highestCompletedTier + 1;

  if (targetNextTier <= 12 && user.directCount >= REQUIRED_DIRECTS[targetNextTier]) {
    // Check if already in targetNextTier queue
    const alreadyInNextQueue = await tx.queueEntry.findFirst({
      where: { userId: user.id, tier: targetNextTier },
    });

    if (!alreadyInNextQueue) {
      await tx.user.update({
        where: { id: user.id },
        data: { currentTier: targetNextTier },
      });

      const nextQueueIndex = await tx.queueEntry.count({
        where: { tier: targetNextTier },
      });

      await tx.queueEntry.create({
        data: {
          userId: user.id,
          tier: targetNextTier,
          queueIndex: nextQueueIndex,
          childrenPlaced: 0,
          status: "WAITING",
        },
      });

      await processTierQueue(targetNextTier, tx);
    }
  }
}
