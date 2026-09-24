import "dotenv/config";
import { db, withDbRetry } from "../src/lib/db";
import { ALL_DEPOSIT_PERMISSIONS, DEFAULT_BSC_USDT_CONTRACT } from "../src/lib/blockchain/config";

async function main() {
  console.log("🌱 Seeding Crypto Deposit System Defaults...");

  await withDbRetry(async () => {
    // 1. System Config defaults
    const configs = [
      {
        key: "DEPOSIT_PROCESSING_MODE",
        value: "MANUAL",
        description: "Global fallback deposit processing mode (AUTOMATIC or MANUAL)",
      },
      {
        key: "DEPOSIT_KILL_SWITCH",
        value: "ACTIVE",
        description: "Emergency Kill-Switch for automatic deposit crediting (ACTIVE or PAUSED)",
      },
      {
        key: "USDT_BSC_CONTRACT",
        value: DEFAULT_BSC_USDT_CONTRACT,
        description: "Official USDT BEP-20 Contract on BNB Smart Chain",
      },
      {
        key: "DEPOSIT_REQUIRED_CONFIRMATIONS",
        value: "3",
        description: "Required block confirmations before automatic deposit balance credit (~9s)",
      },
    ];

    for (const c of configs) {
      await db.systemConfig.upsert({
        where: { key: c.key },
        create: c,
        update: {}, // Don't overwrite if already customized
      });
      console.log(`✅ SystemConfig '${c.key}' initialized.`);
    }

    // 2. Grant all sub-admins default deposit permissions so they can manage their queue
    const admins = await db.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, customId: true, fullName: true },
    });

    console.log(`Found ${admins.length} sub-admins. Ensuring RBAC deposit permissions...`);

    for (const admin of admins) {
      for (const permission of ALL_DEPOSIT_PERMISSIONS) {
        await db.adminDepositPermission.upsert({
          where: {
            adminId_permission: {
              adminId: admin.id,
              permission,
            },
          },
          create: {
            adminId: admin.id,
            permission,
          },
          update: {},
        });
      }
      console.log(`✅ Permissions granted for admin: ${admin.fullName} (${admin.customId})`);
    }
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
