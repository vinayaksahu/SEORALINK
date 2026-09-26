import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import {
  TIER_NAMES,
  TIER_VALUES,
  REQUIRED_DIRECTS,
  NET_CASHOUT_VALUES,
  UPLINE_OVERRIDE_VALUES,
} from "@/lib/constants";
import Decimal from "decimal.js";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json(
        { error: "Administrative privileges required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const identifier = decodeURIComponent(id).trim();

    // 1. Fetch user by CUID or CustomId
    const user = await withDbRetry(async () => {
      return await db.user.findFirst({
        where: {
          OR: [{ id: identifier }, { customId: identifier }],
        },
        include: {
          sponsor: {
            select: {
              id: true,
              customId: true,
              fullName: true,
              email: true,
              currentTier: true,
            },
          },
          directs: {
            select: {
              id: true,
              customId: true,
              fullName: true,
              email: true,
              status: true,
              currentTier: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          queueEntries: {
            orderBy: [{ tier: "asc" }, { queueIndex: "asc" }],
          },
          ledgers: {
            orderBy: { createdAt: "desc" },
            take: 200,
          },
          withdrawals: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });

    if (!user) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Branch isolation check for regular ADMIN
    if (
      session.role === "ADMIN" &&
      user.adminId !== session.userId &&
      user.id !== session.userId
    ) {
      return NextResponse.json(
        { error: "Access denied: Member belongs to another administrative branch" },
        { status: 403 }
      );
    }

    // Check Single-Exit status
    const hasRankExit = user.withdrawals.some(
      (w) =>
        w.status !== "REJECTED" &&
        (Number(w.feePercent) === 20 ||
          Number(w.amount) === 20480 ||
          w.adminNote?.includes("CASHOUT") ||
          w.adminNote?.includes("RANK_EXIT"))
    );

    // 2. Fetch distinct source user names for ledger entries
    const sourceUserIds = Array.from(
      new Set(user.ledgers.map((l) => l.sourceUserId).filter(Boolean) as string[])
    );
    const sourceUsers = await db.user.findMany({
      where: { id: { in: sourceUserIds } },
      select: { id: true, customId: true, fullName: true },
    });
    const sourceUserMap = new Map(sourceUsers.map((u) => [u.id, u]));

    // 3. Collect all child indices across all queues this user has
    const childQueries = user.queueEntries.map((q) => {
      const child1Index = 2 * q.queueIndex + 1;
      const child2Index = 2 * q.queueIndex + 2;
      return {
        tier: q.tier,
        queueIndex: { in: [child1Index, child2Index] },
        ...(q.adminId ? { adminId: q.adminId } : {}),
      };
    });

    const matchingChildren = childQueries.length > 0
      ? await db.queueEntry.findMany({
          where: { OR: childQueries },
          include: {
            user: {
              select: {
                id: true,
                customId: true,
                fullName: true,
                status: true,
                currentTier: true,
              },
            },
          },
          orderBy: { queueIndex: "asc" },
        })
      : [];

    // Also get total queue count per tier for branch to calculate waiting queue distances
    const tierQueueCounts = await Promise.all(
      Array.from({ length: 13 }, async (_, t) => {
        const countWhere: any = { tier: t };
        if (user.adminId) countWhere.adminId = user.adminId;
        const count = await db.queueEntry.count({ where: countWhere });
        return { tier: t, totalCount: count };
      })
    );
    const tierCountMap = new Map(tierQueueCounts.map((tc) => [tc.tier, tc.totalCount]));

    // 4. Construct Tier-by-Tier Progression Breakdown (Tier 0 to Tier 12)
    const tierProgression = Array.from({ length: 13 }, (_, t) => {
      const tierName = TIER_NAMES[t];
      const tierValue = TIER_VALUES[t];
      const requiredDirects = REQUIRED_DIRECTS[t];
      const userQueue = user.queueEntries.find((q) => q.tier === t);
      const totalInTier = tierCountMap.get(t) || 0;

      let childrenPlacedInfo: any[] = [];
      let waitingDetails: any = null;

      if (userQueue) {
        const child1Index = 2 * userQueue.queueIndex + 1;
        const child2Index = 2 * userQueue.queueIndex + 2;

        const child1 = matchingChildren.find(
          (c) => c.tier === t && c.queueIndex === child1Index
        );
        const child2 = matchingChildren.find(
          (c) => c.tier === t && c.queueIndex === child2Index
        );

        childrenPlacedInfo = [
          child1
            ? {
                slot: 1,
                queueIndex: child1Index,
                customId: child1.user.customId,
                fullName: child1.user.fullName,
                currentTier: child1.user.currentTier,
                placedAt: child1.createdAt.toISOString(),
              }
            : null,
          child2
            ? {
                slot: 2,
                queueIndex: child2Index,
                customId: child2.user.customId,
                fullName: child2.user.fullName,
                currentTier: child2.user.currentTier,
                placedAt: child2.createdAt.toISOString(),
              }
            : null,
        ].filter(Boolean);

        if (userQueue.status === "WAITING") {
          const requiredTotalForMatch = 2 * userQueue.queueIndex + 3;
          const entriesNeeded = Math.max(0, requiredTotalForMatch - totalInTier);
          waitingDetails = {
            requiredTotalForMatch,
            currentTotalInTier: totalInTier,
            entriesNeeded,
            waitingForIndices: [child1Index, child2Index],
            explanation:
              entriesNeeded === 0
                ? "Eligible for matching in next processing cycle"
                : `Needs ${entriesNeeded} more queue entry in Tier ${t} (Awaiting Index #${child1Index} & #${child2Index})`,
          };
        }
      }

      return {
        tier: t,
        tierName,
        tierValue,
        requiredDirects,
        isDirectsMet: user.directCount >= requiredDirects,
        isEnrolled: !!userQueue,
        isCurrentTier: user.currentTier === t,
        queueEntry: userQueue
          ? {
              id: userQueue.id,
              queueIndex: userQueue.queueIndex,
              status: userQueue.status,
              childrenPlaced: userQueue.childrenPlaced,
              createdAt: userQueue.createdAt.toISOString(),
              matchedAt: userQueue.matchedAt ? userQueue.matchedAt.toISOString() : null,
              children: childrenPlacedInfo,
              waitingDetails,
            }
          : null,
      };
    });

    // 5. Commission Summary & Ledger Breakdown
    let directCommissionTotal = new Decimal(0);
    let directCommissionCount = 0;
    let overrideTotal = new Decimal(0);
    let overrideCount = 0;
    let rankRewardTotal = new Decimal(0);
    let rankRewardCount = 0;

    const commissionTransactions: any[] = [];

    user.ledgers.forEach((l) => {
      const amt = new Decimal(l.amount.toString());
      const src = l.sourceUserId ? sourceUserMap.get(l.sourceUserId) : null;

      if (l.type === "DIRECT_COMMISSION") {
        directCommissionTotal = directCommissionTotal.plus(amt);
        directCommissionCount++;
        commissionTransactions.push({
          id: l.id,
          type: l.type,
          typeLabel: "5% Direct Sponsor Bonus",
          wallet: l.wallet,
          amount: amt.toNumber(),
          createdAt: l.createdAt.toISOString(),
          description: l.description,
          sourceUser: src
            ? { customId: src.customId, fullName: src.fullName }
            : null,
          tierNumber: l.tierNumber,
        });
      } else if (l.type === "UPLINE_OVERRIDE") {
        overrideTotal = overrideTotal.plus(amt);
        overrideCount++;
        commissionTransactions.push({
          id: l.id,
          type: l.type,
          typeLabel: `5% Mentorship Override (Tier ${l.tierNumber || "?"})`,
          wallet: l.wallet,
          amount: amt.toNumber(),
          createdAt: l.createdAt.toISOString(),
          description: l.description,
          sourceUser: src
            ? { customId: src.customId, fullName: src.fullName }
            : null,
          tierNumber: l.tierNumber,
        });
      } else if (l.type === "RANK_REWARD") {
        rankRewardTotal = rankRewardTotal.plus(amt);
        rankRewardCount++;
        commissionTransactions.push({
          id: l.id,
          type: l.type,
          typeLabel: "Rank Pool Exit Reward",
          wallet: l.wallet,
          amount: amt.toNumber(),
          createdAt: l.createdAt.toISOString(),
          description: l.description,
          sourceUser: null,
          tierNumber: l.tierNumber,
        });
      }
    });

    // 6. Next Rank Eligibility Roadmap
    const nextTier = Math.min(12, user.currentTier + 1);
    const reqDirectsForNext = REQUIRED_DIRECTS[nextTier];
    const missingDirectsForNext = Math.max(0, reqDirectsForNext - user.directCount);
    const currentTierQueue = user.queueEntries.find((q) => q.tier === user.currentTier);

    const nextRankRoadmap = {
      currentTier: user.currentTier,
      currentTierName: TIER_NAMES[user.currentTier],
      nextTier,
      nextTierName: TIER_NAMES[nextTier],
      directs: {
        current: user.directCount,
        required: reqDirectsForNext,
        missing: missingDirectsForNext,
        isQualified: missingDirectsForNext === 0,
      },
      autopool: {
        isWaitingInQueue: currentTierQueue?.status === "WAITING",
        childrenPlaced: currentTierQueue?.childrenPlaced ?? 0,
        childrenNeeded: 2 - (currentTierQueue?.childrenPlaced ?? 0),
        queueIndex: currentTierQueue?.queueIndex ?? null,
      },
      statusSummary: hasRankExit
        ? "Exited network via Rank Pool Cashout (Single-Exit)"
        : missingDirectsForNext > 0
        ? `Needs ${missingDirectsForNext} more direct referral(s) to unlock ${TIER_NAMES[nextTier]}`
        : currentTierQueue?.status === "WAITING"
        ? `Qualified for directs! Waiting for 2 children in ${TIER_NAMES[user.currentTier]} Autopool Queue`
        : `Ready for ${TIER_NAMES[nextTier]}`,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        customId: user.customId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        usdtAddress: user.usdtAddress,
        role: user.role,
        status: user.status,
        isSystemExited: hasRankExit,
        currentTier: user.currentTier,
        tierName: TIER_NAMES[user.currentTier],
        directCount: user.directCount,
        createdAt: user.createdAt.toISOString(),
        sponsor: user.sponsor
          ? {
              customId: user.sponsor.customId,
              fullName: user.sponsor.fullName,
              email: user.sponsor.email,
              currentTier: user.sponsor.currentTier,
              tierName: TIER_NAMES[user.sponsor.currentTier],
            }
          : null,
        balances: {
          fundBalance: Number(user.fundBalance),
          incomeBalance: Number(user.incomeBalance),
          totalEarned: Number(user.totalEarned),
          totalWithdrawn: Number(user.totalWithdrawn),
          currentRankPoolValue:
            user.status === "ACTIVE" && !hasRankExit && user.currentTier > 0
              ? TIER_VALUES[user.currentTier]
              : 0,
        },
      },
      directs: {
        total: user.directs.length,
        active: user.directs.filter((d) => d.status === "ACTIVE").length,
        inactive: user.directs.filter((d) => d.status !== "ACTIVE").length,
        list: user.directs.map((d) => ({
          id: d.id,
          customId: d.customId,
          fullName: d.fullName,
          email: d.email,
          status: d.status,
          currentTier: d.currentTier,
          tierName: TIER_NAMES[d.currentTier],
          createdAt: d.createdAt.toISOString(),
        })),
      },
      nextRankRoadmap,
      tierProgression,
      commissions: {
        summary: {
          directBonusTotal: directCommissionTotal.toNumber(),
          directBonusCount: directCommissionCount,
          mentorshipOverrideTotal: overrideTotal.toNumber(),
          mentorshipOverrideCount: overrideCount,
          rankRewardTotal: rankRewardTotal.toNumber(),
          rankRewardCount: rankRewardCount,
          totalEarnedCommissions: directCommissionTotal
            .plus(overrideTotal)
            .plus(rankRewardTotal)
            .toNumber(),
        },
        transactions: commissionTransactions,
      },
    });
  } catch (err: any) {
    console.error("[Member Audit API Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch member audit record" },
      { status: 500 }
    );
  }
}
