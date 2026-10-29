import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import { TIER_NAMES, REQUIRED_DIRECTS, TIER_VALUES } from "@/lib/constants";

export interface MatrixPlacementInfo {
  tier: number;
  tierName: string;
  queueIndex: number;
  status: "WAITING" | "COMPLETED";
  childrenPlaced: number;
  position: "Genesis Root" | "Left Unit" | "Right Unit";
  parent: {
    queueIndex: number;
    customId: string;
    fullName: string;
  } | null;
  children: Array<{
    slot: 1 | 2;
    queueIndex: number;
    customId: string;
    fullName: string;
    position: "Left Unit" | "Right Unit";
  }>;
}

export interface MatrixTreeNode {
  id: string;
  queueIndex: number;
  tier: number;
  tierName: string;
  userId: string;
  customId: string;
  fullName: string;
  status: "WAITING" | "COMPLETED";
  childrenPlaced: number;
  directCount: number;
  requiredDirects: number;
  isDirectsMet: boolean;
  position: "ROOT" | "LEFT" | "RIGHT";
  parent: {
    queueIndex: number;
    customId: string;
    fullName: string;
  } | null;
  expectedLeftIndex: number;
  expectedRightIndex: number;
  leftChild: MatrixTreeNode | null;
  rightChild: MatrixTreeNode | null;
  children: MatrixTreeNode[];
  matchedAt: string | null;
  createdAt: string;
}

export interface TierMatrixSummary {
  tier: number;
  tierName: string;
  tierValue: number;
  totalNodes: number;
  waitingNodes: number;
  completedNodes: number;
  nextQueueIndex: number;
  requiredDirects: number;
}

export interface TreeNodeData {
  id: string;
  customId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  currentTier: number;
  tierName: string;
  directCount: number;
  requiredDirectsForNext: number;
  missingDirects: number;
  sponsorId: string | null;
  sponsorCustomId?: string | null;
  sponsorName?: string | null;
  createdAt: string;
  isRankExit: boolean;
  activeQueue?: {
    tier: number;
    queueIndex: number;
    childrenPlaced: number;
  } | null;
  matrixPlacement?: MatrixPlacementInfo | null;
  children: TreeNodeData[];
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: "Administrative privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rootId = searchParams.get("rootId");

    const userWhere: any = {
      customId: { not: "SUPERROOT" },
      NOT: { role: "SUPER_ROOT_ADMIN" },
      OR: [
        { adminId: session.userId },
        { id: session.userId },
      ],
    };

    // 1. Fetch all users, rank exits, and waiting queues
    const [allUsers, rankExits, waitingQueuesCount] = await withDbRetry(async () => {
      return await Promise.all([
        db.user.findMany({
          where: userWhere,
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            customId: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            currentTier: true,
            directCount: true,
            sponsorId: true,
            createdAt: true,
            sponsor: {
              select: {
                id: true,
                customId: true,
                fullName: true,
              },
            },
            queueEntries: {
              orderBy: { tier: "desc" },
              select: {
                tier: true,
                queueIndex: true,
                childrenPlaced: true,
                status: true,
              },
            },
          },
        }),
        db.withdrawalRequest.findMany({
          where: {
            OR: [
              { feePercent: 20 },
              { adminNote: { contains: "CASHOUT" } },
              { adminNote: { contains: "RANK_EXIT" } },
              { amount: 20480 },
            ],
            status: { not: "REJECTED" },
          },
          select: { userId: true },
        }),
        db.queueEntry.count({
          where: {
            status: "WAITING",
            adminId: session.userId,
          },
        }),
      ]);
    });
    const rankExitUserIds = new Set(rankExits.map((w) => w.userId));
    const userIds = allUsers.map((u) => u.id);

    // 2. Fetch all queue entries relevant to this admin's network to compute 2:1 Tripod Matrix Placements
    const allQueueEntries = await withDbRetry(async () => {
      return await db.queueEntry.findMany({
        where: {
          OR: [
            { adminId: session.userId },
            { userId: { in: userIds } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              customId: true,
              fullName: true,
              status: true,
              currentTier: true,
              directCount: true,
            },
          },
        },
        orderBy: [{ tier: "asc" }, { queueIndex: "asc" }],
      });
    });

    // 3. Group Queue Entries by Tier and by queueIndex
    const tierQueueMap = new Map<number, Map<number, typeof allQueueEntries[0]>>();
    for (let t = 0; t <= 12; t++) {
      tierQueueMap.set(t, new Map());
    }

    allQueueEntries.forEach((entry) => {
      const tMap = tierQueueMap.get(entry.tier);
      if (tMap && !tMap.has(entry.queueIndex)) {
        tMap.set(entry.queueIndex, entry);
      }
    });

    // 4. Build enriched user lookup map with matrixPlacement
    const userNodeMap = new Map<string, TreeNodeData>();
    const tierDistribution: Record<number, number> = {};
    for (let i = 0; i <= 12; i++) {
      tierDistribution[i] = 0;
    }

    allUsers.forEach((u) => {
      const nextTier = Math.min(12, u.currentTier + 1);
      const reqDirects = REQUIRED_DIRECTS[nextTier] ?? 0;
      const missing = Math.max(0, reqDirects - u.directCount);
      const isExited = rankExitUserIds.has(u.id);

      tierDistribution[u.currentTier] = (tierDistribution[u.currentTier] || 0) + 1;

      // Find user's matrix entry in their current tier
      const tMap = tierQueueMap.get(u.currentTier);
      const currentTierQueue = Array.from(tMap?.values() || []).find((q) => q.userId === u.id);

      let matrixPlacement: MatrixPlacementInfo | null = null;
      if (currentTierQueue) {
        const qIdx = currentTierQueue.queueIndex;
        const isRoot = qIdx === 0;
        const parentIdx = isRoot ? null : Math.floor((qIdx - 1) / 2);
        const parentEntry = parentIdx !== null ? tMap?.get(parentIdx) : null;
        const isLeft = qIdx % 2 === 1;

        const leftChildEntry = tMap?.get(2 * qIdx + 1);
        const rightChildEntry = tMap?.get(2 * qIdx + 2);

        matrixPlacement = {
          tier: u.currentTier,
          tierName: TIER_NAMES[u.currentTier] || `Tier ${u.currentTier}`,
          queueIndex: qIdx,
          status: currentTierQueue.status as "WAITING" | "COMPLETED",
          childrenPlaced: currentTierQueue.childrenPlaced,
          position: isRoot ? "Genesis Root" : isLeft ? "Left Unit" : "Right Unit",
          parent: parentEntry
            ? {
                queueIndex: parentIdx!,
                customId: parentEntry.user.customId,
                fullName: parentEntry.user.fullName,
              }
            : null,
          children: [
            leftChildEntry
              ? {
                  slot: 1 as const,
                  queueIndex: leftChildEntry.queueIndex,
                  customId: leftChildEntry.user.customId,
                  fullName: leftChildEntry.user.fullName,
                  position: "Left Unit" as const,
                }
              : null,
            rightChildEntry
              ? {
                  slot: 2 as const,
                  queueIndex: rightChildEntry.queueIndex,
                  customId: rightChildEntry.user.customId,
                  fullName: rightChildEntry.user.fullName,
                  position: "Right Unit" as const,
                }
              : null,
          ].filter(Boolean) as any,
        };
      }

      userNodeMap.set(u.id, {
        id: u.id,
        customId: u.customId,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        status: isExited ? "EXITED" : u.status,
        currentTier: u.currentTier,
        tierName: TIER_NAMES[u.currentTier] || `Tier ${u.currentTier}`,
        directCount: u.directCount,
        requiredDirectsForNext: reqDirects,
        missingDirects: missing,
        sponsorId: u.sponsorId,
        sponsorCustomId: u.sponsor?.customId || null,
        sponsorName: u.sponsor?.fullName || null,
        createdAt: u.createdAt.toISOString(),
        isRankExit: isExited,
        activeQueue: u.queueEntries.find((q) => q.status === "WAITING") || u.queueEntries[0] || null,
        matrixPlacement,
        children: [],
      });
    });

    // 5. Construct Referral Tree Hierarchy
    const roots: TreeNodeData[] = [];
    const rootUser = rootId ? allUsers.find((u) => u.id === rootId || u.customId === rootId) : null;

    if (rootUser) {
      const rootNode = userNodeMap.get(rootUser.id);
      if (rootNode) {
        userNodeMap.forEach((node) => {
          if (node.sponsorId && userNodeMap.has(node.sponsorId)) {
            userNodeMap.get(node.sponsorId)!.children.push(node);
          }
        });
        roots.push(rootNode);
      }
    } else {
      userNodeMap.forEach((node) => {
        if (node.sponsorId && userNodeMap.has(node.sponsorId) && node.sponsorId !== node.id) {
          userNodeMap.get(node.sponsorId)!.children.push(node);
        } else {
          roots.push(node);
        }
      });
    }

    // 6. Build Tier-by-Tier 2:1 Tripod Matrix Trees & Summaries
    const matrixTrees: Record<number, MatrixTreeNode[]> = {};
    const matrixFlatEntries: Record<number, MatrixTreeNode[]> = {};
    const matrixSummaries: TierMatrixSummary[] = [];

    function buildMatrixSubtree(
      queueIndex: number,
      tier: number,
      tMap: Map<number, typeof allQueueEntries[0]>,
      visited = new Set<number>()
    ): MatrixTreeNode | null {
      const entry = tMap.get(queueIndex);
      if (!entry || visited.has(queueIndex)) return null;
      visited.add(queueIndex);

      const isRoot = queueIndex === 0;
      const parentIdx = isRoot ? null : Math.floor((queueIndex - 1) / 2);
      const parentEntry = parentIdx !== null ? tMap.get(parentIdx) : null;
      const isLeft = queueIndex % 2 === 1;

      const expectedLeftIndex = 2 * queueIndex + 1;
      const expectedRightIndex = 2 * queueIndex + 2;

      const leftChild = buildMatrixSubtree(expectedLeftIndex, tier, tMap, visited);
      const rightChild = buildMatrixSubtree(expectedRightIndex, tier, tMap, visited);

      return {
        id: entry.id,
        queueIndex: entry.queueIndex,
        tier: entry.tier,
        tierName: TIER_NAMES[entry.tier] || `Tier ${entry.tier}`,
        userId: entry.userId,
        customId: entry.user.customId,
        fullName: entry.user.fullName,
        status: entry.status as "WAITING" | "COMPLETED",
        childrenPlaced: entry.childrenPlaced,
        directCount: entry.user.directCount,
        requiredDirects: REQUIRED_DIRECTS[entry.tier] ?? 0,
        isDirectsMet: entry.user.directCount >= (REQUIRED_DIRECTS[entry.tier] ?? 0),
        position: isRoot ? "ROOT" : isLeft ? "LEFT" : "RIGHT",
        parent: parentEntry
          ? {
              queueIndex: parentIdx!,
              customId: parentEntry.user.customId,
              fullName: parentEntry.user.fullName,
            }
          : null,
        expectedLeftIndex,
        expectedRightIndex,
        leftChild,
        rightChild,
        children: [leftChild, rightChild].filter(Boolean) as MatrixTreeNode[],
        createdAt: entry.createdAt.toISOString(),
        matchedAt: entry.matchedAt ? entry.matchedAt.toISOString() : null,
      };
    }

    for (let t = 0; t <= 12; t++) {
      const tMap = tierQueueMap.get(t) || new Map();
      const entries = Array.from(tMap.values()).sort((a, b) => a.queueIndex - b.queueIndex);

      // Build flat converted entries
      const flatList: MatrixTreeNode[] = entries.map((entry) => {
        const isRoot = entry.queueIndex === 0;
        const parentIdx = isRoot ? null : Math.floor((entry.queueIndex - 1) / 2);
        const parentEntry = parentIdx !== null ? tMap.get(parentIdx) : null;
        const isLeft = entry.queueIndex % 2 === 1;

        return {
          id: entry.id,
          queueIndex: entry.queueIndex,
          tier: entry.tier,
          tierName: TIER_NAMES[entry.tier] || `Tier ${entry.tier}`,
          userId: entry.userId,
          customId: entry.user.customId,
          fullName: entry.user.fullName,
          status: entry.status as "WAITING" | "COMPLETED",
          childrenPlaced: entry.childrenPlaced,
          directCount: entry.user.directCount,
          requiredDirects: REQUIRED_DIRECTS[entry.tier] ?? 0,
          isDirectsMet: entry.user.directCount >= (REQUIRED_DIRECTS[entry.tier] ?? 0),
          position: isRoot ? "ROOT" : isLeft ? "LEFT" : "RIGHT",
          parent: parentEntry
            ? {
                queueIndex: parentIdx!,
                customId: parentEntry.user.customId,
                fullName: parentEntry.user.fullName,
              }
            : null,
          expectedLeftIndex: 2 * entry.queueIndex + 1,
          expectedRightIndex: 2 * entry.queueIndex + 2,
          leftChild: null,
          rightChild: null,
          children: [],
          createdAt: entry.createdAt.toISOString(),
          matchedAt: entry.matchedAt ? entry.matchedAt.toISOString() : null,
        };
      });

      matrixFlatEntries[t] = flatList;

      // Build tree roots starting with index 0
      const visited = new Set<number>();
      const tierRoots: MatrixTreeNode[] = [];

      if (tMap.has(0)) {
        const rootTree = buildMatrixSubtree(0, t, tMap, visited);
        if (rootTree) tierRoots.push(rootTree);
      }

      // If any entries weren't visited under index 0 (e.g. unattached fragments), add them
      entries.forEach((e) => {
        if (!visited.has(e.queueIndex)) {
          const fragTree = buildMatrixSubtree(e.queueIndex, t, tMap, visited);
          if (fragTree) tierRoots.push(fragTree);
        }
      });

      matrixTrees[t] = tierRoots;

      matrixSummaries.push({
        tier: t,
        tierName: TIER_NAMES[t],
        tierValue: TIER_VALUES[t],
        totalNodes: entries.length,
        waitingNodes: entries.filter((e) => e.status === "WAITING").length,
        completedNodes: entries.filter((e) => e.status === "COMPLETED").length,
        nextQueueIndex: entries.length > 0 ? Math.max(...entries.map((e) => e.queueIndex)) + 1 : 0,
        requiredDirects: REQUIRED_DIRECTS[t] ?? 0,
      });
    }

    return NextResponse.json({
      roots,
      allUsers: Array.from(userNodeMap.values()).map((node) => {
        const { children, ...rest } = node;
        return {
          ...rest,
          childrenCount: children.length,
        };
      }),
      tierDistribution,
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u) => u.status === "ACTIVE" && !rankExitUserIds.has(u.id)).length,
      waitingQueuesCount,
      matrixTrees,
      matrixFlatEntries,
      matrixSummaries,
    });
  } catch (err: any) {
    console.error("[Tree API Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to build network tree" },
      { status: 500 }
    );
  }
}
