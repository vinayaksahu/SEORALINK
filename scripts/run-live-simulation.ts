import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { activateUserAccount } from "../src/lib/activation";
import { TIER_NAMES } from "../src/lib/constants";
import Decimal from "decimal.js";

interface DummyUserSpec {
  customId: string;
  fullName: string;
  email: string;
  sponsorCustomId: string;
}

const DEFAULT_PASSWORD = "Test@123456";

// 36 Dummy Users Network Hierarchy
const DUMMY_USERS: DummyUserSpec[] = [
  // Top Level Leaders (Sponsored by Genesis node SL100000)
  { customId: "SL200001", fullName: "Vikram Sharma", email: "vikram@test.com", sponsorCustomId: "SL100000" },
  { customId: "SL200002", fullName: "Rahul Verma", email: "rahul@test.com", sponsorCustomId: "SL100000" },
  { customId: "SL200003", fullName: "Priya Patel", email: "priya@test.com", sponsorCustomId: "SL100000" },
  { customId: "SL200004", fullName: "Amit Kumar", email: "amit@test.com", sponsorCustomId: "SL100000" },
  { customId: "SL200005", fullName: "Neha Singh", email: "neha@test.com", sponsorCustomId: "SL100000" },

  // Directs of Vikram (SL200001) - 6 directs to unlock all ranks
  { customId: "SL200006", fullName: "Aakash Gupta", email: "aakash@test.com", sponsorCustomId: "SL200001" },
  { customId: "SL200007", fullName: "Kavita Rao", email: "kavita@test.com", sponsorCustomId: "SL200001" },
  { customId: "SL200008", fullName: "Manish Joshi", email: "manish@test.com", sponsorCustomId: "SL200001" },
  { customId: "SL200009", fullName: "Pooja Mehta", email: "pooja@test.com", sponsorCustomId: "SL200001" },
  { customId: "SL200010", fullName: "Rohan Das", email: "rohan@test.com", sponsorCustomId: "SL200001" },
  { customId: "SL200011", fullName: "Sanjay Sen", email: "sanjay@test.com", sponsorCustomId: "SL200001" },

  // Directs of Rahul (SL200002) - 6 directs
  { customId: "SL200012", fullName: "Deepak Yadav", email: "deepak@test.com", sponsorCustomId: "SL200002" },
  { customId: "SL200013", fullName: "Anjali Nair", email: "anjali@test.com", sponsorCustomId: "SL200002" },
  { customId: "SL200014", fullName: "Varun Bajaj", email: "varun@test.com", sponsorCustomId: "SL200002" },
  { customId: "SL200015", fullName: "Ritu Kapoor", email: "ritu@test.com", sponsorCustomId: "SL200002" },
  { customId: "SL200016", fullName: "Karan Johar", email: "karan@test.com", sponsorCustomId: "SL200002" },
  { customId: "SL200017", fullName: "Swati Roy", email: "swati@test.com", sponsorCustomId: "SL200002" },

  // Directs of Priya (SL200003) - 6 directs
  { customId: "SL200018", fullName: "Naveen Reddy", email: "naveen@test.com", sponsorCustomId: "SL200003" },
  { customId: "SL200019", fullName: "Geeta Pandey", email: "geeta@test.com", sponsorCustomId: "SL200003" },
  { customId: "SL200020", fullName: "Harish Pillai", email: "harish@test.com", sponsorCustomId: "SL200003" },
  { customId: "SL200021", fullName: "Divya Chauhan", email: "divya@test.com", sponsorCustomId: "SL200003" },
  { customId: "SL200022", fullName: "Arjun Bhat", email: "arjun@test.com", sponsorCustomId: "SL200003" },
  { customId: "SL200023", fullName: "Sunita Malik", email: "sunita@test.com", sponsorCustomId: "SL200003" },

  // Directs of Amit (SL200004) - 6 directs
  { customId: "SL200024", fullName: "Gaurav Bansal", email: "gaurav@test.com", sponsorCustomId: "SL200004" },
  { customId: "SL200025", fullName: "Shilpa Jain", email: "shilpa@test.com", sponsorCustomId: "SL200004" },
  { customId: "SL200026", fullName: "Tarun Gill", email: "tarun@test.com", sponsorCustomId: "SL200004" },
  { customId: "SL200027", fullName: "Monika Sethi", email: "monika@test.com", sponsorCustomId: "SL200004" },
  { customId: "SL200028", fullName: "Abhishek Soni", email: "abhishek@test.com", sponsorCustomId: "SL200004" },
  { customId: "SL200029", fullName: "Komal Ahuja", email: "komal@test.com", sponsorCustomId: "SL200004" },

  // Additional members to push queue velocity across Tiers 1-4
  { customId: "SL200030", fullName: "Yash Chopra", email: "yash@test.com", sponsorCustomId: "SL200005" },
  { customId: "SL200031", fullName: "Meera Iyer", email: "meera@test.com", sponsorCustomId: "SL200005" },
  { customId: "SL200032", fullName: "Kunal Shah", email: "kunal@test.com", sponsorCustomId: "SL200005" },
  { customId: "SL200033", fullName: "Sneha Saxena", email: "sneha@test.com", sponsorCustomId: "SL200005" },
  { customId: "SL200034", fullName: "Prateek Goyal", email: "prateek@test.com", sponsorCustomId: "SL200005" },
  { customId: "SL200035", fullName: "Bhavna Mishra", email: "bhavna@test.com", sponsorCustomId: "SL200005" },
  { customId: "SL200036", fullName: "Nikhil Mathur", email: "nikhil@test.com", sponsorCustomId: "SL200006" },
];

async function main() {
  console.log("==========================================================");
  console.log("🚀 STARTING SEORALINK LIVE DATABASE SIMULATION");
  console.log("Rule: $10 one-time entry + Max 6 directs for rank progression");
  console.log("==========================================================\n");

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  // 1. Check Genesis node exists
  const genesis = await db.user.findFirst({
    where: { customId: "SL100000" },
  });

  if (!genesis) {
    throw new Error("Genesis node SL100000 not found. Please run seed.ts first.");
  }

  console.log(`✅ Genesis Node ready: ${genesis.fullName} (${genesis.customId})`);

  const createdUsers: any[] = [];

  // 2. Sequential registration and activation of each dummy user
  for (const spec of DUMMY_USERS) {
    let user = await db.user.findUnique({
      where: { customId: spec.customId },
    });

    // Find sponsor
    const sponsor = await db.user.findFirst({
      where: {
        OR: [{ customId: spec.sponsorCustomId }, { referralCode: spec.sponsorCustomId }],
      },
    });

    if (!user) {
      // Create user with $10 initial Fund Wallet for activation
      user = await db.user.create({
        data: {
          customId: spec.customId,
          referralCode: spec.customId,
          fullName: spec.fullName,
          email: spec.email,
          passwordHash,
          role: "USER",
          status: "INACTIVE",
          sponsorId: sponsor?.id || genesis.id,
          fundBalance: new Decimal(10.0), // $10 for single one-time activation
          incomeBalance: new Decimal(0.0),
          currentTier: 0,
        },
      });
      console.log(`👤 Created user ${spec.fullName} (${spec.customId}) - Sponsor: ${spec.sponsorCustomId}`);
    }

    // Activate user with $10 if inactive
    if (user.status === "INACTIVE") {
      try {
        const result = await activateUserAccount(user.id);
        console.log(`⚡ Activated ${spec.customId} ($10 Micro-Entry) -> ${result.message}`);
      } catch (err: any) {
        console.warn(`⚠️ Activation note for ${spec.customId}: ${err.message}`);
      }
    }

    createdUsers.push(spec.customId);
  }

  console.log("\n==========================================================");
  console.log("📊 SIMULATION COMPLETED! FETCHING FINAL RANK & REWARD STATS");
  console.log("==========================================================\n");

  // Fetch all simulation users with updated stats
  const finalUsers = await db.user.findMany({
    where: {
      customId: { in: DUMMY_USERS.map((u) => u.customId) },
    },
    include: {
      queueEntries: true,
      sponsor: { select: { fullName: true, customId: true } },
    },
    orderBy: { currentTier: "desc" },
  });

  // Display summary table in console
  console.log("---------------------------------------------------------------------------------------------------------");
  console.log("| Member ID | Full Name        | Rank / Tier         | Directs | Income Wallet | Fund Bal | Sponsor     |");
  console.log("---------------------------------------------------------------------------------------------------------");

  for (const u of finalUsers) {
    const rankName = `Tier ${u.currentTier} (${TIER_NAMES[u.currentTier] || "Unknown"})`;
    const income = `$${parseFloat(u.incomeBalance.toString()).toFixed(2)}`;
    const fund = `$${parseFloat(u.fundBalance.toString()).toFixed(2)}`;
    const sponsorName = u.sponsor ? `${u.sponsor.customId}` : "None";
    console.log(
      `| ${u.customId.padEnd(9)} | ${u.fullName.padEnd(16)} | ${rankName.padEnd(19)} | ${String(u.directCount).padStart(7)} | ${income.padStart(13)} | ${fund.padStart(8)} | ${sponsorName.padEnd(11)} |`
    );
  }
  console.log("---------------------------------------------------------------------------------------------------------");

  // Print Tier Queue distribution
  const tierCounts: { [tier: number]: { waiting: number; completed: number } } = {};
  for (let t = 0; t <= 12; t++) {
    const waiting = await db.queueEntry.count({ where: { tier: t, status: "WAITING" } });
    const completed = await db.queueEntry.count({ where: { tier: t, status: "COMPLETED" } });
    if (waiting > 0 || completed > 0) {
      tierCounts[t] = { waiting, completed };
    }
  }

  console.log("\n📈 GLOBAL TIER QUEUE METRICS:");
  for (const [tier, stats] of Object.entries(tierCounts)) {
    const tNum = parseInt(tier);
    console.log(`  • Tier ${tNum} (${TIER_NAMES[tNum]}): ${stats.completed} Completed | ${stats.waiting} Waiting in Queue`);
  }

  console.log("\n✅ Done! All records are live in your Neon PostgreSQL database.");
  console.log("You can now view them in the Admin Panel or test login with any account.");
}

main()
  .catch((e) => {
    console.error("❌ Simulation Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
