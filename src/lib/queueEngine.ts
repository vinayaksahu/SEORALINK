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

    // Pay 5% Upline Override to direct mentor (ONLY for Tiers 1-12, entry Tier 0 has no override)
    if (tier >= 1 && matchedUser.sponsorId) {
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
 * Re-checks eligibility for users who have completed a tier or met direct requirements.
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
        orderBy: { tier: "desc" },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") return;

  // 1. Tier 0 (Junior) Promotion: If user has at least 2 directs, promote to Tier 1 (Zen)
  if (user.currentTier === 0 && user.directCount >= REQUIRED_DIRECTS[1]) {
    // Complete or record Tier 0 queue entry
    const tier0Entry = user.queueEntries.find((q) => q.tier === 0);
    if (tier0Entry) {
      if (tier0Entry.status !== "COMPLETED") {
        await tx.queueEntry.update({
          where: { id: tier0Entry.id },
          data: {
            status: "COMPLETED",
            childrenPlaced: 2,
            matchedAt: new Date(),
          },
        });
      }
    } else {
      const tier0Count = await tx.queueEntry.count({ where: { tier: 0 } });
      await tx.queueEntry.create({
        data: {
          userId: user.id,
          tier: 0,
          queueIndex: tier0Count,
          childrenPlaced: 2,
          status: "COMPLETED",
          matchedAt: new Date(),
        },
      });
    }

    // Upgrade user to Tier 1 (Zen)
    await tx.user.update({
      where: { id: user.id },
      data: { currentTier: 1 },
    });

    // Enroll into Tier 1 (Zen) queue
    const inTier1 = await tx.queueEntry.findFirst({
      where: { userId: user.id, tier: 1 },
    });

    if (!inTier1) {
      const tier1Count = await tx.queueEntry.count({ where: { tier: 1 } });
      await tx.queueEntry.create({
        data: {
          userId: user.id,
          tier: 1,
          queueIndex: tier1Count,
          childrenPlaced: 0,
          status: "WAITING",
        },
      });

      await processTierQueue(1, tx);
    }
    return;
  }

  // 2. Higher Tiers Promotion: Completed queue entry waiting for required directs
  const completedEntries = user.queueEntries.filter((q) => q.status === "COMPLETED");
  if (completedEntries.length === 0) return;

  const highestCompletedTier = completedEntries[0].tier;
  const targetNextTier = highestCompletedTier + 1;

  if (targetNextTier <= 12 && user.directCount >= REQUIRED_DIRECTS[targetNextTier] && user.currentTier < targetNextTier) {
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
