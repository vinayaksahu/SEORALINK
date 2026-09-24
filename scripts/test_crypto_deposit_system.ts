import "dotenv/config";
import { db, withDbRetry } from "../src/lib/db";
import {
  getDepositProcessingMode,
  getDepositProcessingModeForUser,
  getEffectiveDepositVault,
  getOrCreateMemberDepositAddress,
  serializeBlockchainData,
  DEFAULT_BSC_USDT_CONTRACT,
} from "../src/lib/blockchain/config";
import { verifyOnChainTxHash, runBlockchainMonitor } from "../src/lib/blockchain/monitor";
import { executeLedgerTransaction } from "../src/lib/ledger";
import Decimal from "decimal.js";

async function runTestSuite() {
  console.log("🧪 Starting Comprehensive Crypto Deposit Test Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, details || "");
      failed++;
    }
  }

  // TEST 1: Mode Hierarchy Resolution
  console.log("--- TEST 1: Multi-Tier Mode Hierarchy Resolution ---");
  await withDbRetry(async () => {
    // Check global fallback mode
    const globalMode = await getDepositProcessingMode(null);
    assert(globalMode === "MANUAL" || globalMode === "AUTOMATIC", `Default platform mode is valid (${globalMode})`);

    // Create 2 test users/admins to test Level 1 override vs Level 2 inheritance
    const testAdminAuto = await db.user.upsert({
      where: { email: "test_admin_auto@seoralink.test" },
      create: {
        customId: "TADMIN_AUTO",
        fullName: "Test Admin Auto Branch",
        email: "test_admin_auto@seoralink.test",
        passwordHash: "hash",
        referralCode: "TADMIN_AUTO",
        role: "ADMIN",
        depositMode: "AUTOMATIC",
      },
      update: { depositMode: "AUTOMATIC" },
    });

    const testAdminManual = await db.user.upsert({
      where: { email: "test_admin_manual@seoralink.test" },
      create: {
        customId: "TADMIN_MANUAL",
        fullName: "Test Admin Manual Branch",
        email: "test_admin_manual@seoralink.test",
        passwordHash: "hash",
        referralCode: "TADMIN_MANUAL",
        role: "ADMIN",
        depositMode: "MANUAL",
      },
      update: { depositMode: "MANUAL" },
    });

    const modeA = await getDepositProcessingMode(testAdminAuto.id);
    const modeB = await getDepositProcessingMode(testAdminManual.id);
    assert(modeA === "AUTOMATIC", "Admin A resolves to AUTOMATIC branch override");
    assert(modeB === "MANUAL", "Admin B resolves to MANUAL branch override");

    // Test member registered under Admin A
    const testMemberA = await db.user.upsert({
      where: { email: "test_member_a@seoralink.test" },
      create: {
        customId: "TMEM_A",
        fullName: "Member under Admin A",
        email: "test_member_a@seoralink.test",
        passwordHash: "hash",
        referralCode: "TMEM_A",
        role: "USER",
        adminId: testAdminAuto.id,
        depositMode: "GLOBAL",
      },
      update: { adminId: testAdminAuto.id, depositMode: "GLOBAL" },
    });

    const memberModeA = await getDepositProcessingModeForUser(testMemberA.id);
    assert(memberModeA === "AUTOMATIC", "Member under Admin A inherits Admin A's AUTOMATIC mode");

    // Test member registered under Admin B
    const testMemberB = await db.user.upsert({
      where: { email: "test_member_b@seoralink.test" },
      create: {
        customId: "TMEM_B",
        fullName: "Member under Admin B",
        email: "test_member_b@seoralink.test",
        passwordHash: "hash",
        referralCode: "TMEM_B",
        role: "USER",
        adminId: testAdminManual.id,
        depositMode: "GLOBAL",
      },
      update: { adminId: testAdminManual.id, depositMode: "GLOBAL" },
    });

    const memberModeB = await getDepositProcessingModeForUser(testMemberB.id);
    assert(memberModeB === "MANUAL", "Member under Admin B inherits Admin B's MANUAL mode");
  });

  // TEST 2: Dedicated Branch Vault Isolation
  console.log("\n--- TEST 2: Dedicated Branch Vault Isolation ---");
  await withDbRetry(async () => {
    const adminAuto = await db.user.findUnique({ where: { email: "test_admin_auto@seoralink.test" } });
    const memberA = await db.user.findUnique({ where: { email: "test_member_a@seoralink.test" } });

    // Set dedicated vault address for adminAuto
    const customVault = "0x1111111111111111111111111111111111111111";
    await db.systemConfig.upsert({
      where: { key: `ADMIN_DEPOSIT_ADDRESS_${adminAuto!.id}` },
      create: {
        key: `ADMIN_DEPOSIT_ADDRESS_${adminAuto!.id}`,
        value: customVault,
      },
      update: { value: customVault },
    });

    const vault = await getEffectiveDepositVault(memberA!.id);
    assert(vault.address.toLowerCase() === customVault.toLowerCase(), "Member resolves to assigned Admin's dedicated vault");
    assert(vault.source === "ADMIN_BRANCH", "Vault source is correctly marked ADMIN_BRANCH");
  });

  // TEST 3: Deterministic Member Address Derivation
  console.log("\n--- TEST 3: Deterministic Member Address Derivation ---");
  await withDbRetry(async () => {
    const memberA = await db.user.findUnique({ where: { email: "test_member_a@seoralink.test" } });
    const addr1 = await getOrCreateMemberDepositAddress(memberA!.id);

    assert(addr1.address.startsWith("0x"), `Derived address is valid EVM hex: ${addr1.address}`);
    assert(addr1.derivationIndex > 0, `Derivation index is assigned: #${addr1.derivationIndex}`);

    // Call again to verify persistence / idempotency
    const addr2 = await getOrCreateMemberDepositAddress(memberA!.id);
    assert(addr2.address === addr1.address, "Subsequent calls return identical deterministic address (idempotent)");
    assert(addr2.isNew === false, "Second call correctly flagged isNew: false");
  });

  // TEST 4: BigInt & Decimal Serialization
  console.log("\n--- TEST 4: BigInt & Decimal Serialization Protection ---");
  const testPayload = {
    blockNumber: BigInt(123456789),
    balance: new Decimal("123.45678901"),
    nested: {
      innerBlock: BigInt(987654321),
      amount: new Decimal("10.00"),
    },
    array: [BigInt(1), BigInt(2)],
  };

  let jsonResult = "";
  try {
    const serialized = serializeBlockchainData(testPayload);
    jsonResult = JSON.stringify(serialized);
    assert(typeof jsonResult === "string" && jsonResult.includes("123456789"), "BigInt serialized to string without JSON crash");
    assert(jsonResult.includes("123.45678901"), "Decimal serialized to string without precision loss");
  } catch (err: any) {
    assert(false, "Serialization failed", err.message);
  }

  // TEST 5: Atomic Wallet Crediting & Replay Protection
  console.log("\n--- TEST 5: Atomic Wallet Crediting & Idempotency ---");
  await withDbRetry(async () => {
    const memberA = await db.user.findUnique({ where: { email: "test_member_a@seoralink.test" } });
    const initialBalance = new Decimal(memberA!.fundBalance.toString());
    const depositAmount = new Decimal("10.00");
    const testRefKey = `TEST_CRYPTO_DEPOSIT_${Date.now()}`;

    // Execute first ledger transaction
    const res1 = await executeLedgerTransaction({
      userId: memberA!.id,
      type: "DEPOSIT",
      wallet: "FUND",
      amount: depositAmount,
      referenceKey: testRefKey,
      description: "Test Crypto Deposit Credit",
    });

    assert(res1.success === true, "First deposit transaction succeeds");

    const updatedMember = await db.user.findUnique({ where: { id: memberA!.id } });
    const newBalance = new Decimal(updatedMember!.fundBalance.toString());
    assert(
      newBalance.equals(initialBalance.plus(depositAmount)),
      `Fund balance correctly incremented from ${initialBalance} to ${newBalance}`
    );

    // Replay attack prevention: execute again with same referenceKey
    const res2 = await executeLedgerTransaction({
      userId: memberA!.id,
      type: "DEPOSIT",
      wallet: "FUND",
      amount: depositAmount,
      referenceKey: testRefKey,
      description: "Duplicate Replay Test",
    });

    assert(res2.success === false && res2.alreadyProcessed === true, "Replay attack prevented: duplicate referenceKey rejected");

    const recheckMember = await db.user.findUnique({ where: { id: memberA!.id } });
    assert(
      new Decimal(recheckMember!.fundBalance.toString()).equals(newBalance),
      "Balance remains unchanged after replay attempt"
    );
  });

  // TEST 6: Blockchain Monitor Cycle Execution
  console.log("\n--- TEST 6: Blockchain Monitor Health & Scan Cycle ---");
  try {
    const monitorResult = await runBlockchainMonitor(5);
    assert(monitorResult.success === true, `Blockchain monitor ran successfully (Status: ${monitorResult.status})`);
    assert(monitorResult.blocksScanned >= 0, `Blocks scanned: ${monitorResult.blocksScanned}`);
    if (monitorResult.currentBlock) {
      console.log(`  ℹ️ Current BSC Block Height: ${monitorResult.currentBlock}`);
    }
  } catch (err: any) {
    assert(false, "Blockchain monitor encountered error", err.message);
  }

  // Clean up test data
  console.log("\n🧹 Cleaning up test accounts...");
  try {
    await db.ledgerEntry.deleteMany({ where: { user: { email: { contains: "@seoralink.test" } } } });
    await db.depositRequest.deleteMany({ where: { user: { email: { contains: "@seoralink.test" } } } });
    await db.depositAddress.deleteMany({ where: { user: { email: { contains: "@seoralink.test" } } } });
    await db.user.deleteMany({ where: { email: { contains: "@seoralink.test" } } });
    console.log("✅ Test data cleaned up.");
  } catch {}

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error("Test Suite execution failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
