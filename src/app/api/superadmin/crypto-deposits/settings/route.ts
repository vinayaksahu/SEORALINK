import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/auditLogger";
import {
  callBscRpc,
  getBscRpcEndpoints,
  getUsdtContractAddress,
  getRequiredConfirmations,
  isDepositCreditingPaused,
  serializeBlockchainData,
} from "@/lib/blockchain/config";
import { runBlockchainMonitor, CHECKPOINT_ID } from "@/lib/blockchain/monitor";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieves global deposit infrastructure configuration and live blockchain diagnostics
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json({ error: "Restricted to SuperRootAdmin" }, { status: 403 });
    }

    // 1. Fetch configs
    const [globalModeConfig, killSwitchConfig, contractConfig, rpcConfig, reqConfConfig] =
      await Promise.all([
        db.systemConfig.findUnique({ where: { key: "DEPOSIT_PROCESSING_MODE" } }),
        db.systemConfig.findUnique({ where: { key: "DEPOSIT_KILL_SWITCH" } }),
        db.systemConfig.findUnique({ where: { key: "USDT_BSC_CONTRACT" } }),
        db.systemConfig.findUnique({ where: { key: "BSC_RPC_URL" } }),
        db.systemConfig.findUnique({ where: { key: "DEPOSIT_REQUIRED_CONFIRMATIONS" } }),
      ]);

    const globalMode = globalModeConfig?.value || "MANUAL";
    const isKillSwitchActive = killSwitchConfig?.value === "PAUSED";
    const usdtContract = contractConfig?.value || (await getUsdtContractAddress());
    const rpcUrl = rpcConfig?.value || "";
    const requiredConfirmations = reqConfConfig?.value ? parseInt(reqConfConfig.value, 10) : 3;

    // 2. Query live blockchain metrics & checkpoint
    let liveBlockHeight: bigint | null = null;
    let rpcLatencyMs = 0;
    let rpcStatus = "ONLINE";

    const startTime = Date.now();
    try {
      const blockHex = await callBscRpc("eth_blockNumber");
      liveBlockHeight = BigInt(blockHex);
      rpcLatencyMs = Date.now() - startTime;
    } catch (rpcErr: any) {
      rpcStatus = "DEGRADED";
      console.error("[Settings GET] RPC block check failed:", rpcErr);
    }

    const checkpoint = await db.blockchainCheckpoint.findUnique({
      where: { id: CHECKPOINT_ID },
    });

    const lastScannedBlock = checkpoint?.lastProcessedBlock || null;
    const blockLag =
      liveBlockHeight && lastScannedBlock
        ? Number(liveBlockHeight > lastScannedBlock ? liveBlockHeight - lastScannedBlock : 0n)
        : 0;

    // 3. Aggregate deposit stats
    const [
      totalDepositsCount,
      autoDepositsCount,
      manualDepositsCount,
      pendingCount,
      creditedCount,
      pausedCount,
    ] = await Promise.all([
      db.depositRequest.count(),
      db.depositRequest.count({ where: { processingMode: "AUTOMATIC" } }),
      db.depositRequest.count({ where: { processingMode: "MANUAL" } }),
      db.depositRequest.count({ where: { status: { in: ["PENDING", "PENDING_REVIEW", "CONFIRMING"] } } }),
      db.depositRequest.count({ where: { status: { in: ["CREDITED", "APPROVED"] } } }),
      db.depositRequest.count({ where: { status: "CREDIT_PENDING_PAUSED" } }),
    ]);

    return NextResponse.json(
      serializeBlockchainData({
        success: true,
        settings: {
          globalMode,
          isKillSwitchActive,
          usdtContract,
          rpcUrl,
          requiredConfirmations,
        },
        diagnostics: {
          rpcStatus,
          rpcLatencyMs,
          liveBlockHeight: liveBlockHeight ? liveBlockHeight.toString() : "Unavailable",
          lastScannedBlock: lastScannedBlock ? lastScannedBlock.toString() : "Not initialized",
          blockLag,
          checkpointStatus: checkpoint?.status || "IDLE",
          lastSuccessfulScan: checkpoint?.lastSuccessfulScan || null,
          lastError: checkpoint?.lastError || null,
        },
        stats: {
          totalDepositsCount,
          autoDepositsCount,
          manualDepositsCount,
          pendingCount,
          creditedCount,
          pausedCount,
        },
      })
    );
  } catch (error: any) {
    console.error("[SuperAdmin Deposit Settings GET Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to load deposit settings" },
      { status: 500 }
    );
  }
}

/**
 * POST: Updates global deposit infrastructure settings or triggers manual reconciliation
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json({ error: "Restricted to SuperRootAdmin" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      globalMode,
      killSwitch,
      tokenContract,
      rpcUrl,
      requiredConfirmations,
      triggerReconcile,
    } = body;

    // Trigger reconciliation if requested
    if (triggerReconcile) {
      const scanResult = await runBlockchainMonitor(100);
      return NextResponse.json(
        serializeBlockchainData({
          success: true,
          message: "Reconciliation cycle executed successfully.",
          scanResult,
        })
      );
    }

    // Update Global Mode
    if (globalMode === "AUTOMATIC" || globalMode === "MANUAL") {
      await db.systemConfig.upsert({
        where: { key: "DEPOSIT_PROCESSING_MODE" },
        create: {
          key: "DEPOSIT_PROCESSING_MODE",
          value: globalMode,
          description: "Global fallback deposit processing mode (AUTOMATIC or MANUAL)",
        },
        update: { value: globalMode },
      });
    }

    // Update Kill-Switch
    if (killSwitch === "ACTIVE" || killSwitch === "PAUSED") {
      await db.systemConfig.upsert({
        where: { key: "DEPOSIT_KILL_SWITCH" },
        create: {
          key: "DEPOSIT_KILL_SWITCH",
          value: killSwitch,
          description: "Emergency Kill-Switch for automatic deposit balance crediting",
        },
        update: { value: killSwitch },
      });
    }

    // Update Token Contract
    if (tokenContract && typeof tokenContract === "string" && tokenContract.trim().startsWith("0x")) {
      await db.systemConfig.upsert({
        where: { key: "USDT_BSC_CONTRACT" },
        create: {
          key: "USDT_BSC_CONTRACT",
          value: tokenContract.trim().toLowerCase(),
          description: "Official USDT BEP-20 Contract address on BSC Mainnet",
        },
        update: { value: tokenContract.trim().toLowerCase() },
      });
    }

    // Update Custom RPC
    if (rpcUrl !== undefined) {
      await db.systemConfig.upsert({
        where: { key: "BSC_RPC_URL" },
        create: {
          key: "BSC_RPC_URL",
          value: typeof rpcUrl === "string" ? rpcUrl.trim() : "",
          description: "Custom primary BSC JSON-RPC endpoints (comma-separated)",
        },
        update: { value: typeof rpcUrl === "string" ? rpcUrl.trim() : "" },
      });
    }

    // Update Required Confirmations
    if (requiredConfirmations && !isNaN(parseInt(requiredConfirmations, 10))) {
      const parsed = Math.max(1, parseInt(requiredConfirmations, 10));
      await db.systemConfig.upsert({
        where: { key: "DEPOSIT_REQUIRED_CONFIRMATIONS" },
        create: {
          key: "DEPOSIT_REQUIRED_CONFIRMATIONS",
          value: parsed.toString(),
          description: "Required BSC block confirmations for deposit auto-crediting",
        },
        update: { value: parsed.toString() },
      });
    }

    await recordActivity({
      req,
      userId: session.userId,
      customId: session.customId,
      fullName: session.fullName,
      role: session.role,
      action: "DEPOSIT_SETTINGS_UPDATED",
      category: "SYSTEM",
      details: {
        globalMode,
        killSwitch,
        tokenContract,
        rpcUrl,
        requiredConfirmations,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deposit system settings updated successfully.",
    });
  } catch (error: any) {
    console.error("[SuperAdmin Deposit Settings POST Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update deposit settings" },
      { status: 500 }
    );
  }
}
