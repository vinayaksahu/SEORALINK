import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import { TIER_NAMES, REQUIRED_DIRECTS } from "@/lib/constants";

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

    const isSuper = session.role === "SUPER_ROOT_ADMIN" || session.role === "SUPER_ADMIN";

    const userWhere: any = {};
    if (!isSuper) {
      userWhere.OR = [
        { adminId: session.userId },
        { adminId: null },
      ];
    }
    // Exclude SUPERROOT from the tree view as it is purely an internal system operator
    userWhere.customId = { not: "SUPERROOT" };

    // Fetch all users, rank exits, and waiting queues with retry
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
              where: { status: "WAITING" },
              orderBy: { queueIndex: "asc" },
              take: 1,
              select: {
                tier: true,
                queueIndex: true,
                childrenPlaced: true,
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
            ...(isSuper ? {} : { OR: [{ adminId: session.userId }, { adminId: null }] }),
          },
        }),
      ]);
    });
    const rankExitUserIds = new Set(rankExits.map((w) => w.userId));

    // 3. Build enriched user lookup map
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
        activeQueue: u.queueEntries[0] || null,
        children: [],
      });
    });

    // 4. Construct tree hierarchy
    const roots: TreeNodeData[] = [];
    const rootUser = rootId ? allUsers.find((u) => u.id === rootId || u.customId === rootId) : null;

    if (rootUser) {
      // If a specific root was requested, build subtree from that root
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
      // Global hierarchy: top nodes are those without sponsorId or whose sponsor isn't in userNodeMap
      userNodeMap.forEach((node) => {
        if (node.sponsorId && userNodeMap.has(node.sponsorId) && node.sponsorId !== node.id) {
          userNodeMap.get(node.sponsorId)!.children.push(node);
        } else {
          roots.push(node);
        }
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
    });
  } catch (err: any) {
    console.error("[Tree API Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to build network tree" },
      { status: 500 }
    );
  }
}
