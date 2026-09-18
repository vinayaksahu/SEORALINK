import { db } from "./db";
import { hashPassword } from "./auth";
import { activateUserAccount } from "./activation";
import { processTierQueue, checkPendingRankPromotions, awardMentorshipOverride } from "./queueEngine";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS, RATES } from "./constants";
import { executeLedgerTransaction } from "./ledger";
import { generateCustomId } from "./utils";
import Decimal from "decimal.js";

const REALISTIC_NAMES = [
  "Min-jun Park", "Ji-woo Kim", "David Chen", "Sarah Jenkins", "Vikram Malhotra",
  "Elena Rostova", "Omar Al-Mansoor", "Kenji Sato", "Chloe Dubois", "Lucas Silva",
  "Pooja Sharma", "Alex Rivera", "Hannah Schmidt", "Daniel Zhao", "Fatima Al-Sayed",
  "Marcus Vance", "Sophia Tanaka", "Liam O'Connor", "Aarav Patel", "Camila Torres",
  "Ethan Hunt", "Zoe Kravitz", "Gabriel Santos", "Maya Lin", "Arjun Mehta",
  "Isabella Rossi", "Noah Williams", "Kavita Reddy", "Jin-woo Lee", "Emma Watson"
];

export interface SimulatorOptions {
  mode: "DIRECT" | "GLOBAL" | "RANDOM" | "BOOST_RANK";
  targetUserIdentifier?: string; // customId, email, or referralCode
  targetTier?: number;          // 0 to 12
  count?: number;               // number of dummy users to generate (1 to 100)
  autoActivate?: boolean;       // default true: deposit $10 & trigger activation
  sponsorStrategy?: "TARGET_USER" | "ADMIN" | "RANDOM_ACTIVE";
  namePrefix?: string;
}

export interface SimulationResult {
  success: boolean;
  message: string;
  createdCount: number;
  usersCreated: Array<{
    id: string;
    customId: string;
    fullName: string;
    email: string;
    sponsorCustomId?: string;
    activated: boolean;
  }>;
  promotions: Array<{
    userId: string;
    customId: string;
    fullName: string;
    oldTier: number;
    newTier: number;
    tierName: string;
  }>;
  summary: {
    totalDirectsGiven: number;
    queueEntriesAdded: number;
    matchesTriggered: number;
  };
}

/**
 * Resolves a user by customId, referralCode, or email.
 */
export async function resolveUser(identifier?: string) {
  if (!identifier || !identifier.trim()) return null;
  const trimmed = identifier.trim();
  return await db.user.findFirst({
    where: {
      OR: [
        { customId: trimmed },
        { referralCode: trimmed },
        { email: trimmed.toLowerCase() },
      ],
    },
    include: {
      queueEntries: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Get telemetry details for a target user to guide admin rank upgrade decisions.
 */
export async function getTargetUserTelemetry(identifier: string) {
  const user = await resolveUser(identifier);
  if (!user) return null;

  const currentTier = user.currentTier;
  const nextTier = Math.min(12, currentTier + 1);
  const requiredDirects = REQUIRED_DIRECTS[nextTier];
  const missingDirects = Math.max(0, requiredDirects - user.directCount);

  // Find active waiting queue entry
  const waitingQueue = user.queueEntries.find((q) => q.status === "WAITING" && q.tier === currentTier);
  const completedEntries = user.queueEntries.filter((q) => q.status === "COMPLETED");

  // Total in current tier queue
  const totalInTierQueue = await db.queueEntry.count({
    where: { tier: currentTier },
  });

  return {
    user: {
      id: user.id,
      customId: user.customId,
      fullName: user.fullName,
      email: user.email,
      currentTier,
      currentTierName: TIER_NAMES[currentTier],
      directCount: user.directCount,
      fundBalance: user.fundBalance.toString(),
      incomeBalance: user.incomeBalance.toString(),
      status: user.status,
    },
    nextTier: {
      tier: nextTier,
      name: TIER_NAMES[nextTier],
      value: TIER_VALUES[nextTier],
      requiredDirects,
      missingDirects,
      canDirectlyPromote: missingDirects === 0,
    },
    queue: {
      waitingQueueIndex: waitingQueue ? waitingQueue.queueIndex : null,
      childrenPlaced: waitingQueue ? waitingQueue.childrenPlaced : 0,
      totalInTierQueue,
      completedTiersCount: completedEntries.length,
    },
  };
}

/**
 * Creates and optionally activates simulated dummy users according to selected strategy.
 */
export async function runDummyUserSimulation(options: SimulatorOptions): Promise<SimulationResult> {
  const count = Math.min(100, Math.max(1, options.count || 1));
  const autoActivate = options.autoActivate !== false; // default true

  // 1. Fetch system admin for default sponsorship fallback
  const masterAdmin = await db.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "asc" },
  });

  if (!masterAdmin) {
    throw new Error("Master Admin user not found in database. Run seed first.");
  }

  // 2. Resolve target user if provided
  let targetUser = options.targetUserIdentifier
    ? await resolveUser(options.targetUserIdentifier)
    : null;

  if (options.mode === "DIRECT" && !targetUser) {
    throw new Error(`Target user "${options.targetUserIdentifier}" not found. Please provide a valid Member ID or email.`);
  }

  // If in BOOST_RANK mode, run specialized rank promotion pipeline
  if (options.mode === "BOOST_RANK") {
    if (!targetUser) {
      throw new Error("Target user is required for BOOST_RANK mode.");
    }
    return await executeDirectRankBoost(targetUser.id, options.targetTier);
  }

  // Pre-load active users for RANDOM sponsorship strategy
  let activeUsers: Array<{ id: string; customId: string }> = [];
  if (options.sponsorStrategy === "RANDOM_ACTIVE" || options.mode === "RANDOM") {
    activeUsers = await db.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, customId: true },
      take: 200,
    });
    if (activeUsers.length === 0) {
      activeUsers = [{ id: masterAdmin.id, customId: masterAdmin.customId }];
    }
  }

  const createdUsers: SimulationResult["usersCreated"] = [];
  const defaultPasswordHash = await hashPassword("Demo@123456");

  // Track tier snapshots before simulation to detect promotions
  const usersBeforeSnap = await db.user.findMany({
    select: { id: true, customId: true, fullName: true, currentTier: true },
  });
  const beforeTierMap = new Map(usersBeforeSnap.map((u) => [u.id, u.currentTier]));

  // 3. Batch Create & Activate Dummy Users
  for (let i = 0; i < count; i++) {
    // Determine sponsor for this dummy user
    let sponsorId = masterAdmin.id;
    let sponsorCustomId = masterAdmin.customId;

    if (options.mode === "DIRECT" && targetUser) {
      sponsorId = targetUser.id;
      sponsorCustomId = targetUser.customId;
    } else if (options.mode === "RANDOM" || options.sponsorStrategy === "RANDOM_ACTIVE") {
      const randomSponsor = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      sponsorId = randomSponsor.id;
      sponsorCustomId = randomSponsor.customId;
    } else if (options.sponsorStrategy === "TARGET_USER" && targetUser) {
      sponsorId = targetUser.id;
      sponsorCustomId = targetUser.customId;
    }

    // Generate realistic identity
    const nameIndex = (Date.now() + i) % REALISTIC_NAMES.length;
    const baseName = options.namePrefix
      ? `${options.namePrefix} ${i + 1}`
      : REALISTIC_NAMES[nameIndex];
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const customId = generateCustomId("SL");
    const email = `sim.${customId.toLowerCase()}@seoralink.net`;

    // Create User record
    const dummyUser = await db.user.create({
      data: {
        customId,
        referralCode: customId,
        fullName: `${baseName}`,
        email,
        passwordHash: defaultPasswordHash,
        role: "USER",
        status: "INACTIVE",
        sponsorId,
        fundBalance: autoActivate ? new Decimal(10.0) : new Decimal(0.0),
        incomeBalance: new Decimal(0.0),
        currentTier: 0,
      },
    });

    let activated = false;
    if (autoActivate) {
      try {
        await activateUserAccount(dummyUser.id);
        activated = true;
      } catch (err: any) {
        console.error(`Failed to activate dummy user ${customId}:`, err);
      }
    }

    createdUsers.push({
      id: dummyUser.id,
      customId: dummyUser.customId,
      fullName: dummyUser.fullName,
      email: dummyUser.email,
      sponsorCustomId,
      activated,
    });
  }

  // 4. Check for promotions across all users
  const usersAfterSnap = await db.user.findMany({
    select: { id: true, customId: true, fullName: true, currentTier: true },
  });

  const promotions: SimulationResult["promotions"] = [];
  for (const after of usersAfterSnap) {
    const oldTier = beforeTierMap.get(after.id) ?? 0;
    if (after.currentTier > oldTier) {
      promotions.push({
        userId: after.id,
        customId: after.customId,
        fullName: after.fullName,
        oldTier,
        newTier: after.currentTier,
        tierName: TIER_NAMES[after.currentTier],
      });
    }
  }

  return {
    success: true,
    message: `Successfully generated and ${autoActivate ? "activated" : "created"} ${createdUsers.length} dummy user(s).`,
    createdCount: createdUsers.length,
    usersCreated: createdUsers,
    promotions,
    summary: {
      totalDirectsGiven: createdUsers.filter((u) => u.activated).length,
      queueEntriesAdded: createdUsers.filter((u) => u.activated).length,
      matchesTriggered: promotions.length,
    },
  };
}

/**
 * Dedicated Rank Booster: Promotes a specific user to their target (or next) tier.
 * Automatically fulfills missing direct referrals and satisfies queue advancement!
 */
export async function executeDirectRankBoost(
  targetUserId: string,
  requestedTargetTier?: number
): Promise<SimulationResult> {
  const user = await db.user.findUnique({
    where: { id: targetUserId },
    include: {
      queueEntries: {
        orderBy: { tier: "desc" },
      },
      sponsor: true,
    },
  });

  if (!user) {
    throw new Error("Target user not found for rank boost.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error(`Cannot boost inactive user ${user.fullName} (${user.customId}). Account must be activated with $10 USDT first.`);
  }

  const currentTier = user.currentTier;
  const targetTier = requestedTargetTier !== undefined && requestedTargetTier > currentTier
    ? Math.min(12, requestedTargetTier)
    : Math.min(12, currentTier + 1);

  if (targetTier <= currentTier) {
    throw new Error(`Target tier (${targetTier} - ${TIER_NAMES[targetTier]}) must be higher than current tier (${currentTier} - ${TIER_NAMES[currentTier]}).`);
  }

  const usersCreated: SimulationResult["usersCreated"] = [];
  const defaultPasswordHash = await hashPassword("Demo@123456");

  // Step 1: Fulfill missing direct referrals required for target tier
  const requiredDirects = REQUIRED_DIRECTS[targetTier];
  const missingDirects = Math.max(0, requiredDirects - user.directCount);

  if (missingDirects > 0) {
    console.log(`[RankBoost] User ${user.customId} needs ${missingDirects} direct(s) for Tier ${targetTier}. Auto-generating directs...`);
    for (let i = 0; i < missingDirects; i++) {
      const customId = generateCustomId("SL");
      const nameIndex = (Date.now() + i) % REALISTIC_NAMES.length;
      const dummyDirect = await db.user.create({
        data: {
          customId,
          referralCode: customId,
          fullName: `${REALISTIC_NAMES[nameIndex]} (Direct)`,
          email: `sim.${customId.toLowerCase()}@seoralink.net`,
          passwordHash: defaultPasswordHash,
          role: "USER",
          status: "INACTIVE",
          sponsorId: user.id,
          fundBalance: new Decimal(10.0),
          incomeBalance: new Decimal(0.0),
          currentTier: 0,
        },
      });

      await activateUserAccount(dummyDirect.id);

      usersCreated.push({
        id: dummyDirect.id,
        customId: dummyDirect.customId,
        fullName: dummyDirect.fullName,
        email: dummyDirect.email,
        sponsorCustomId: user.customId,
        activated: true,
      });
    }
  }

  // Refresh user state after direct activations
  const refreshedUser = await db.user.findUnique({
    where: { id: user.id },
    include: { queueEntries: true },
  });

  if (!refreshedUser) throw new Error("User state lost during boost.");

  // Step 2: Step-by-step queue promotion up to targetTier
  const promotions: SimulationResult["promotions"] = [];

  for (let tier = refreshedUser.currentTier; tier < targetTier; tier++) {
    const nextTierNum = tier + 1;

    // Complete any existing WAITING entry in current tier
    const waitingEntry = await db.queueEntry.findFirst({
      where: { userId: refreshedUser.id, tier, status: "WAITING" },
    });

    if (waitingEntry) {
      await db.queueEntry.update({
        where: { id: waitingEntry.id },
        data: {
          status: "COMPLETED",
          childrenPlaced: 2,
          matchedAt: new Date(),
        },
      });
    } else {
      // Create a completed entry for this tier
      const tierCount = await db.queueEntry.count({ where: { tier } });
      await db.queueEntry.create({
        data: {
          userId: refreshedUser.id,
          tier,
          queueIndex: tierCount,
          childrenPlaced: 2,
          status: "COMPLETED",
          matchedAt: new Date(),
        },
      });
    }

    // Advance user to nextTierNum
    await db.user.update({
      where: { id: refreshedUser.id },
      data: { currentTier: nextTierNum },
    });

    // Award 5% Mentorship Override to direct sponsor for advancing to nextTierNum (Tiers 1 to 12)
    await awardMentorshipOverride(refreshedUser, nextTierNum, db);

    // Enroll into next tier queue
    const nextQueueIndex = await db.queueEntry.count({ where: { tier: nextTierNum } });
    await db.queueEntry.create({
      data: {
        userId: refreshedUser.id,
        tier: nextTierNum,
        queueIndex: nextQueueIndex,
        childrenPlaced: 0,
        status: "WAITING",
      },
    });

    promotions.push({
      userId: refreshedUser.id,
      customId: refreshedUser.customId,
      fullName: refreshedUser.fullName,
      oldTier: tier,
      newTier: nextTierNum,
      tierName: TIER_NAMES[nextTierNum],
    });
  }

  return {
    success: true,
    message: `🎉 Successfully boosted ${refreshedUser.fullName} (${refreshedUser.customId}) from ${TIER_NAMES[currentTier]} to ${TIER_NAMES[targetTier]} (${targetTier}).`,
    createdCount: usersCreated.length,
    usersCreated,
    promotions,
    summary: {
      totalDirectsGiven: usersCreated.length,
      queueEntriesAdded: promotions.length,
      matchesTriggered: promotions.length,
    },
  };
}
