import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import Decimal from "decimal.js";

async function resetDatabase() {
  console.log("🧹 Starting database cleanup...");

  // 1. Delete all dependent tables
  console.log("Deleting ledger entries...");
  await db.ledgerEntry.deleteMany({});

  console.log("Deleting queue entries...");
  await db.queueEntry.deleteMany({});

  console.log("Deleting deposit requests...");
  await db.depositRequest.deleteMany({});

  console.log("Deleting withdrawal requests...");
  await db.withdrawalRequest.deleteMany({});

  console.log("Deleting support tickets...");
  await db.supportTicket.deleteMany({});

  // 2. Identify admin account
  const adminEmail = "admin@seoralink.com";
  let admin = await db.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { customId: "SL000001" },
        { referralCode: "ADMIN" },
        { role: "SUPER_ADMIN" }
      ]
    }
  });

  // Disconnect all sponsor links first to prevent foreign key errors
  console.log("Disconnecting referral relations...");
  await db.user.updateMany({
    data: { sponsorId: null }
  });

  // 3. Delete all users EXCEPT the admin
  if (admin) {
    console.log(`Found admin: ${admin.email} (${admin.customId}). Preserving admin and deleting others...`);
    const deleteResult = await db.user.deleteMany({
      where: {
        id: { not: admin.id }
      }
    });
    console.log(`Deleted ${deleteResult.count} other users.`);

    // Reset admin balances, tier, directs to clean state
    await db.user.update({
      where: { id: admin.id },
      data: {
        customId: "SL000001",
        referralCode: "ADMIN",
        fullName: "Master Administrator",
        email: adminEmail,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        sponsorId: null,
        currentTier: 0,
        directCount: 0,
        fundBalance: new Decimal(0.0),
        incomeBalance: new Decimal(0.0),
        totalEarned: new Decimal(0.0),
        totalWithdrawn: new Decimal(0.0),
      }
    });
    console.log("✅ Admin account reset to clean baseline.");
  } else {
    // If no admin existed, create a fresh one
    console.log("Creating fresh Super Admin account...");
    const adminPasswordHash = await hashPassword("Admin@123456");
    admin = await db.user.create({
      data: {
        customId: "SL000001",
        referralCode: "ADMIN",
        fullName: "Master Administrator",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        currentTier: 0,
        directCount: 0,
        fundBalance: new Decimal(0.0),
        incomeBalance: new Decimal(0.0),
        totalEarned: new Decimal(0.0),
        totalWithdrawn: new Decimal(0.0),
      }
    });
    console.log("✅ Super Admin created:", admin.email);
  }

  // 4. Ensure default SystemConfig exists
  await db.systemConfig.upsert({
    where: { key: "USDT_DEPOSIT_ADDRESS" },
    update: {},
    create: {
      key: "USDT_DEPOSIT_ADDRESS",
      value: "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001",
      description: "Official USDT deposit wallet address for member fund top-up",
    },
  });

  await db.systemConfig.upsert({
    where: { key: "DEFAULT_NETWORK" },
    update: {},
    create: {
      key: "DEFAULT_NETWORK",
      value: "USDT_BEP20",
      description: "Default deposit blockchain network",
    },
  });

  // 5. Final state summary
  const totalUsers = await db.user.count();
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      customId: true,
      referralCode: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      currentTier: true,
      directCount: true,
      fundBalance: true,
      incomeBalance: true,
    }
  });

  const queueCount = await db.queueEntry.count();
  const ledgerCount = await db.ledgerEntry.count();
  const depositsCount = await db.depositRequest.count();

  console.log("\n==========================================");
  console.log("🎉 DATABASE RESET SUCCESSFUL!");
  console.log("Total Users in DB:", totalUsers);
  console.log("Users:", JSON.stringify(allUsers, null, 2));
  console.log("Queues Remaining:", queueCount);
  console.log("Ledgers Remaining:", ledgerCount);
  console.log("Deposits Remaining:", depositsCount);
  console.log("==========================================");
}

resetDatabase()
  .catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
