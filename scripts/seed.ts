import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("🌱 Starting SEORALINK database seeder...");

  // 1. Create Super Root Admin Master account
  const superRootEmail = "superroot@seoralink.com";
  const existingSuperRoot = await db.user.findFirst({
    where: {
      OR: [{ email: superRootEmail }, { customId: "SUPERROOT" }, { role: "SUPER_ROOT_ADMIN" }],
    },
  });

  const superRootPasswordHash = await hashPassword("6260552217");
  if (!existingSuperRoot) {
    const superRoot = await db.user.create({
      data: {
        customId: "SUPERROOT",
        referralCode: "SUPERROOT",
        fullName: "Super Root Administrator",
        email: superRootEmail,
        passwordHash: superRootPasswordHash,
        role: "SUPER_ROOT_ADMIN",
        status: "ACTIVE",
        currentTier: 0,
      },
    });
    console.log("👑 Super Root Admin created:", superRoot.email, "(ID: SUPERROOT, login: /superrootadminlogin)");
  } else {
    await db.user.update({
      where: { id: existingSuperRoot.id },
      data: {
        passwordHash: superRootPasswordHash,
        role: "SUPER_ROOT_ADMIN",
      },
    });
    console.log("👑 Super Root Admin updated with password '6260552217':", existingSuperRoot.email);
  }

  // 2. Create or Update Parallel Admin Branch 1
  const adminEmail = "admin@seoralink.com";
  let admin = await db.user.findFirst({
    where: {
      OR: [{ customId: "SL000001" }, { email: adminEmail }],
    },
  });

  if (!admin) {
    const adminPasswordHash = await hashPassword("Admin@123456");
    admin = await db.user.create({
      data: {
        customId: "SL000001",
        referralCode: "ADMIN",
        fullName: "Primary Branch Admin",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        status: "ACTIVE",
        currentTier: 0,
      },
    });
    console.log("✅ Primary Admin created:", admin.email, "(ID: SL000001)");
  } else {
    console.log("ℹ️ Primary Admin already exists:", admin.email, "(ID: SL000001)");
  }

  // 3. Create Genesis Top Node for Admin Branch 1
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
        adminId: admin.id,
        directCount: 100, // Pre-qualified for all 12 tiers
        currentTier: 0,
        fundBalance: "1000.00000000",
        incomeBalance: "500.00000000",
      },
    });

    // Place genesis in Tier 0 queue for admin branch
    await db.queueEntry.create({
      data: {
        userId: genesis.id,
        adminId: admin.id,
        tier: 0,
        queueIndex: 0,
        childrenPlaced: 0,
        status: "WAITING",
      },
    });

    console.log("✅ Genesis Node created:", genesis.email, "(ID: SL100000, Queue Index 0)");
  } else {
    if (!existingGenesis.adminId) {
      await db.user.update({
        where: { id: existingGenesis.id },
        data: { adminId: admin.id },
      });
      await db.queueEntry.updateMany({
        where: { userId: existingGenesis.id, adminId: null },
        data: { adminId: admin.id },
      });
    }
    console.log("ℹ️ Genesis Node already exists:", existingGenesis.email);
  }

  // Assign any orphan users to Admin Branch 1
  await db.user.updateMany({
    where: {
      role: "USER",
      adminId: null,
    },
    data: {
      adminId: admin.id,
    },
  });

  await db.queueEntry.updateMany({
    where: {
      adminId: null,
    },
    data: {
      adminId: admin.id,
    },
  });

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
