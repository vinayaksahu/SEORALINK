import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("🌱 Starting SEORALINK database seeder...");

  // 1. Create Super Admin account
  const adminEmail = "admin@seoralink.com";
  const existingAdmin = await db.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminPasswordHash = await hashPassword("Admin@123456");
    const admin = await db.user.create({
      data: {
        customId: "SL000001",
        referralCode: "ADMIN",
        fullName: "Master Administrator",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        currentTier: 0,
      },
    });
    console.log("✅ Super Admin created:", admin.email, "(ID: SL000001)");
  } else {
    console.log("ℹ️ Super Admin already exists:", existingAdmin.email);
  }

  // 2. Create Genesis Top Node
  const genesisEmail = "genesis@seoralink.com";
  const existingGenesis = await db.user.findUnique({
    where: { email: genesisEmail },
  });

  if (!existingGenesis) {
    const genesisPasswordHash = await hashPassword("Genesis@123456");
    const genesis = await db.user.create({
      data: {
        customId: "SL100000",
        referralCode: "SL100000",
        fullName: "SEORALINK Genesis Node",
        email: genesisEmail,
        passwordHash: genesisPasswordHash,
        role: "USER",
        status: "ACTIVE",
        directCount: 100, // Pre-qualified for all 12 tiers
        currentTier: 0,
        fundBalance: "1000.00000000",
        incomeBalance: "500.00000000",
      },
    });

    // Place genesis in Tier 0 queue
    await db.queueEntry.create({
      data: {
        userId: genesis.id,
        tier: 0,
        queueIndex: 0,
        childrenPlaced: 0,
        status: "WAITING",
      },
    });

    console.log("✅ Genesis Node created:", genesis.email, "(ID: SL100000, Queue Index 0)");
  } else {
    console.log("ℹ️ Genesis Node already exists:", existingGenesis.email);
  }

  // 3. Seed Default System Configs
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

  console.log("✅ System configuration seeded successfully.");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
