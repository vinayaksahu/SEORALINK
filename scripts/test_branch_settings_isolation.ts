import { db } from "@/lib/db";
import { isOtpFeatureEnabled, getAllOtpSettings } from "@/lib/otp";
import { isRequireActiveSponsorEnabled, canUserSponsor } from "@/lib/referralPolicy";
import { getBranchSystemConfig, saveBranchSystemConfig, resolveAdminIdentifiers } from "@/lib/adminBranchConfig";
import { getEffectiveDepositVault } from "@/lib/blockchain/config";

async function runIsolationTest() {
  console.log("===============================================================");
  console.log("   MULTI-ADMIN BRANCH ISOLATION VERIFICATION TEST SUITE");
  console.log("   Verifying Admin SL000001 vs Admin SL122436 Strict Separation");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Ensure Admin SL000001 and Admin SL122436 exist
    let admin1 = await db.user.findFirst({
      where: { customId: "SL000001" },
    });
    if (!admin1) {
      admin1 = await db.user.create({
        data: {
          customId: "SL000001",
          fullName: "Primary Branch Admin",
          email: "admin_sl000001@seoralink.test",
          passwordHash: "dummyhash",
          role: "ADMIN",
          status: "ACTIVE",
          referralCode: "SL000001",
        },
      });
      console.log("Created test admin SL000001");
    }

    let admin2 = await db.user.findFirst({
      where: { customId: "SL122436" },
    });
    if (!admin2) {
      admin2 = await db.user.create({
        data: {
          customId: "SL122436",
          fullName: "Secondary Branch Admin",
          email: "admin_sl122436@seoralink.test",
          passwordHash: "dummyhash",
          role: "ADMIN",
          status: "ACTIVE",
          referralCode: "SL122436",
        },
      });
      console.log("Created test admin SL122436");
    }

    assert(Boolean(admin1 && admin2), "Admins SL000001 and SL122436 exist in database");

    // 2. Test resolveAdminIdentifiers
    const ids1 = await resolveAdminIdentifiers("SL000001");
    const ids2 = await resolveAdminIdentifiers("SL122436");
    assert(ids1.includes(admin1.id) && ids1.includes("SL000001"), "resolveAdminIdentifiers resolves both CUID and customId for SL000001");
    assert(ids2.includes(admin2.id) && ids2.includes("SL122436"), "resolveAdminIdentifiers resolves both CUID and customId for SL122436");

    // 3. Configure Admin SL000001: OTP disabled, custom vault A, sponsor check disabled
    console.log("\n--- Configuring Branch SL000001 Settings ---");
    const vaultA = "0x1111111111111111111111111111111111111111";
    await saveBranchSystemConfig("OTP_ENABLED_REGISTRATION", "false", "SL000001");
    await saveBranchSystemConfig("USDT_DEPOSIT_ADDRESS", vaultA, "SL000001");
    await saveBranchSystemConfig("ADMIN_DEPOSIT_ADDRESS", vaultA, "SL000001");
    await saveBranchSystemConfig("REQUIRE_ACTIVE_SPONSOR", "false", "SL000001");
    await saveBranchSystemConfig("DEPOSIT_DISTRIBUTION_MODE", "SINGLE", "SL000001");

    // 4. Configure Admin SL122436: OTP enabled, custom vault B, sponsor check enabled
    console.log("--- Configuring Branch SL122436 Settings ---");
    const vaultB = "0x2222222222222222222222222222222222222222";
    await saveBranchSystemConfig("OTP_ENABLED_REGISTRATION", "true", "SL122436");
    await saveBranchSystemConfig("USDT_DEPOSIT_ADDRESS", vaultB, "SL122436");
    await saveBranchSystemConfig("ADMIN_DEPOSIT_ADDRESS", vaultB, "SL122436");
    await saveBranchSystemConfig("REQUIRE_ACTIVE_SPONSOR", "true", "SL122436");
    await saveBranchSystemConfig("DEPOSIT_DISTRIBUTION_MODE", "SINGLE", "SL122436");

    // 5. Verify Isolation: check OTP toggles independently
    const otp1_byId = await isOtpFeatureEnabled("REGISTRATION", admin1.id);
    const otp1_byCustomId = await isOtpFeatureEnabled("REGISTRATION", "SL000001");
    const otp2_byId = await isOtpFeatureEnabled("REGISTRATION", admin2.id);
    const otp2_byCustomId = await isOtpFeatureEnabled("REGISTRATION", "SL122436");

    assert(otp1_byId === false && otp1_byCustomId === false, "Admin SL000001 has Registration OTP DISABLED (by id and customId)");
    assert(otp2_byId === true && otp2_byCustomId === true, "Admin SL122436 has Registration OTP ENABLED (by id and customId)");

    // 6. Verify Isolation: check Sponsor Activation Policy
    const sponsorPolicy1 = await isRequireActiveSponsorEnabled(admin1.id);
    const sponsorPolicy2 = await isRequireActiveSponsorEnabled(admin2.id);
    assert(sponsorPolicy1 === false, "Admin SL000001 sponsor policy is DISABLED (open referrals)");
    assert(sponsorPolicy2 === true, "Admin SL122436 sponsor policy is ENABLED (requires active $10 account)");

    // 7. Verify Isolation: check Vault addresses
    const configVault1 = await getBranchSystemConfig("USDT_DEPOSIT_ADDRESS", admin1.id);
    const configVault2 = await getBranchSystemConfig("USDT_DEPOSIT_ADDRESS", admin2.id);
    assert(configVault1.value === vaultA, "Admin SL000001 vault is correctly isolated to vaultA", `${configVault1.value} !== ${vaultA}`);
    assert(configVault2.value === vaultB, "Admin SL122436 vault is correctly isolated to vaultB", `${configVault2.value} !== ${vaultB}`);

    // 8. Verify Team Member Vault resolution
    // Ensure test members exist for each admin branch
    let member1 = await db.user.findFirst({
      where: { email: "member_branch1@seoralink.test" },
    });
    if (!member1) {
      member1 = await db.user.create({
        data: {
          customId: `SL_TEST_M1_${Date.now().toString().slice(-4)}`,
          fullName: "Member of Branch 1",
          email: "member_branch1@seoralink.test",
          passwordHash: "dummyhash",
          role: "USER",
          adminId: admin1.id,
          referralCode: `REF_M1_${Date.now().toString().slice(-4)}`,
        },
      });
    }

    let member2 = await db.user.findFirst({
      where: { email: "member_branch2@seoralink.test" },
    });
    if (!member2) {
      member2 = await db.user.create({
        data: {
          customId: `SL_TEST_M2_${Date.now().toString().slice(-4)}`,
          fullName: "Member of Branch 2",
          email: "member_branch2@seoralink.test",
          passwordHash: "dummyhash",
          role: "USER",
          adminId: admin2.id,
          referralCode: `REF_M2_${Date.now().toString().slice(-4)}`,
        },
      });
    }

    const member1Vault = await getEffectiveDepositVault(member1.id);
    const member2Vault = await getEffectiveDepositVault(member2.id);

    assert(member1Vault.address.toLowerCase() === vaultA.toLowerCase(), "Branch 1 member sees Admin SL000001 vault", `${member1Vault.address} !== ${vaultA}`);
    assert(member2Vault.address.toLowerCase() === vaultB.toLowerCase(), "Branch 2 member sees Admin SL122436 vault", `${member2Vault.address} !== ${vaultB}`);
    assert(member1Vault.adminId === admin1.id, "Branch 1 member vault metadata points to Admin SL000001");
    assert(member2Vault.adminId === admin2.id, "Branch 2 member vault metadata points to Admin SL122436");

    // 9. CRITICAL MUTATION TEST: Update Admin SL000001 and assert Admin SL122436 is 100% UNTOUCHED
    console.log("\n--- Testing Mutation: Modifying SL000001 and verifying SL122436 remains unchanged ---");
    const vaultA_New = "0x3333333333333333333333333333333333333333";
    await saveBranchSystemConfig("USDT_DEPOSIT_ADDRESS", vaultA_New, "SL000001");
    await saveBranchSystemConfig("ADMIN_DEPOSIT_ADDRESS", vaultA_New, "SL000001");
    await saveBranchSystemConfig("OTP_ENABLED_REGISTRATION", "true", "SL000001");

    // Check SL000001 updated
    const updatedVault1 = await getBranchSystemConfig("USDT_DEPOSIT_ADDRESS", "SL000001");
    const updatedOtp1 = await isOtpFeatureEnabled("REGISTRATION", "SL000001");
    assert(updatedVault1.value === vaultA_New, "Admin SL000001 vault successfully updated to new address");
    assert(updatedOtp1 === true, "Admin SL000001 registration OTP successfully updated to true");

    // CRITICAL: Check SL122436 was NOT touched
    const untouchedVault2 = await getBranchSystemConfig("USDT_DEPOSIT_ADDRESS", "SL122436");
    const untouchedOtp2 = await isOtpFeatureEnabled("REGISTRATION", "SL122436");
    const untouchedPolicy2 = await isRequireActiveSponsorEnabled("SL122436");

    assert(untouchedVault2.value === vaultB, "STRICT ISOLATION: Admin SL122436 vault is STILL vaultB (NOT changed by SL000001 edit)", `${untouchedVault2.value} !== ${vaultB}`);
    assert(untouchedOtp2 === true, "STRICT ISOLATION: Admin SL122436 OTP is STILL true");
    assert(untouchedPolicy2 === true, "STRICT ISOLATION: Admin SL122436 Sponsor policy is STILL true");

    console.log("\n===============================================================");
    console.log(`   TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runIsolationTest();
