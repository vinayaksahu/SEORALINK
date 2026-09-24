import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isUserSystemExited } from "@/lib/userStatus";
import {
  getDepositProcessingModeForUser,
  getOrCreateMemberDepositAddress,
  getEffectiveDepositVault,
  getRequiredConfirmations,
  isDepositCreditingPaused,
  serializeBlockchainData,
  DEFAULT_BSC_USDT_CONTRACT,
} from "@/lib/blockchain/config";
import { verifyOnChainTxHash } from "@/lib/blockchain/monitor";
import { executeLedgerTransaction } from "@/lib/ledger";
import { recordActivity } from "@/lib/auditLogger";
import Decimal from "decimal.js";

export const dynamic = "force-dynamic";

/**
 * GET: Resolves active deposit mode, receiving address/vault, QR code, and recent history
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const isExited = await isUserSystemExited(session.userId);
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, status: true, customId: true, fundBalance: true, adminId: true },
    });

    const mode = await getDepositProcessingModeForUser(session.userId);
    const isPaused = await isDepositCreditingPaused();
    const requiredConfirmations = await getRequiredConfirmations();

    const vault = await getEffectiveDepositVault(session.userId);
    const depositInfo = {
      mode: "AUTOMATIC" as const,
      address: vault.address,
      qrCodeUrl: vault.qrCodeUrl,
      label: vault.label || "Official Branch Deposit Vault",
      network: "USDT_BEP20",
      asset: "USDT",
      source: vault.source,
    };

    // Fetch user recent deposits
    const deposits = await db.depositRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      serializeBlockchainData({
        success: true,
        depositInfo,
        status: {
          isExited,
          isActivated: currentUser?.status === "ACTIVE",
          fundBalance: currentUser?.fundBalance ? currentUser.fundBalance.toString() : "0.00000000",
          isCreditingPaused: isPaused,
          requiredConfirmations,
          fixedAmount: "10.00",
        },
        recentDeposits: deposits,
      })
    );
  } catch (error: any) {
    console.error("[Crypto Deposit GET Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve deposit configuration" },
      { status: 500 }
    );
  }
}

/**
 * POST: Submits or instantly verifies on-chain TxHash
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const isExited = await isUserSystemExited(session.userId);
    if (isExited) {
      return NextResponse.json(
        { error: "Account exited under Single-Exit protocol. Deposits permanently disabled." },
        { status: 403 }
      );
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { status: true, customId: true, fullName: true, adminId: true },
    });

    const body = await req.json().catch(() => ({}));
    const { txHash, declaredAmount } = body;

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json({ error: "Blockchain Transaction Hash is required" }, { status: 400 });
    }

    const cleanHash = txHash.trim().toLowerCase();
    if (!cleanHash.startsWith("0x") || cleanHash.length !== 66) {
      return NextResponse.json(
        { error: "Invalid TxHash format. Must be a 66-character hex string starting with 0x." },
        { status: 400 }
      );
    }

    // Check for replay / duplicate submission
    const existing = await db.depositRequest.findUnique({
      where: { txHash: cleanHash },
    });

    if (existing) {
      return NextResponse.json(
        { error: `This transaction hash has already been submitted (Current status: ${existing.status}).` },
        { status: 400 }
      );
    }

    const mode = await getDepositProcessingModeForUser(session.userId);
    const requiredConfirmations = await getRequiredConfirmations();
    const isPaused = await isDepositCreditingPaused();

    // Verify transaction on-chain directly via BSC JSON-RPC
    const vault = await getEffectiveDepositVault(session.userId);
    const candidateAddresses = [vault.address.toLowerCase()];
    const personal = await db.depositAddress.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
      select: { address: true },
    });
    if (personal && !candidateAddresses.includes(personal.address.toLowerCase())) {
      candidateAddresses.push(personal.address.toLowerCase());
    }

    // Verify transaction on-chain directly via BSC JSON-RPC
    // Allows any amount >= 0.01 USDT (0.50, 1.00, 10.00 etc.)
    const minAmount = 0.01;
    let verification: any = null;
    for (const targetAddr of candidateAddresses) {
      const v = await verifyOnChainTxHash(cleanHash, targetAddr, minAmount);
      if (v.valid) {
        verification = v;
        break;
      }
    }

    if (!verification || !verification.valid) {
      return NextResponse.json(
        {
          error:
            verification?.error ||
            `On-chain verification failed. Ensure USDT was sent to the designated receiving address (${vault.address}) and has mined on BSC.`,
        },
        { status: 400 }
      );
    }

    const amountInUsdt = new Decimal(verification.amountInUsdt || "1.00");
    const confirmations = verification.confirmations || 0;
    const blockNumber = verification.blockNumber;

    // IMMEDIATE ON-CHAIN AUTO-CREDIT TO FUND WALLET
    const shouldCreditImmediately = confirmations >= requiredConfirmations && !isPaused;
    const initialStatus = shouldCreditImmediately
      ? "CREDITED"
      : isPaused
      ? "CREDIT_PENDING_PAUSED"
      : "CONFIRMING";

    const created = await db.$transaction(async (tx) => {
      const deposit = await tx.depositRequest.create({
        data: {
          userId: session.userId,
          amount: amountInUsdt.toFixed(8),
          amountInUsdt: amountInUsdt.toFixed(8),
          txHash: cleanHash,
          network: "USDT_BEP20",
          tokenContract: DEFAULT_BSC_USDT_CONTRACT,
          fromAddress: verification.fromAddress,
          toAddress: verification.toAddress,
          blockNumber,
          confirmations,
          processingMode: "AUTOMATIC",
          status: initialStatus,
          detectedAt: new Date(),
          confirmedAt: confirmations >= requiredConfirmations ? new Date() : null,
          creditedAt: shouldCreditImmediately ? new Date() : null,
          adminNote: shouldCreditImmediately
            ? `Instantly credited on-chain to ${verification.toAddress}`
            : isPaused
            ? "Crediting held by SuperRoot kill-switch"
            : "Awaiting required confirmations",
        },
      });

      if (shouldCreditImmediately) {
        await executeLedgerTransaction(
          {
            userId: session.userId,
            type: "DEPOSIT",
            wallet: "FUND",
            amount: amountInUsdt,
            referenceKey: `CRYPTO_DEPOSIT_${cleanHash}`,
            description: `USDT BEP-20 Instant Deposit (TxID: ${cleanHash.slice(0, 10)}...)`,
          },
          tx
        );
      }

      return deposit;
    });

    await recordActivity({
      req,
      userId: session.userId,
      customId: session.customId,
      fullName: session.fullName,
      role: session.role,
      adminId: currentUser?.adminId,
      action: shouldCreditImmediately ? "DEPOSIT_AUTO_CREDITED" : "DEPOSIT_DETECTED",
      category: "FINANCE",
      details: {
        txHash: cleanHash,
        amount: amountInUsdt.toString(),
        confirmations,
        status: initialStatus,
        mode: "AUTOMATIC",
        toAddress: verification.toAddress,
      },
    });

    return NextResponse.json(
      serializeBlockchainData({
        success: true,
        message: shouldCreditImmediately
          ? `Transaction confirmed on BSC! ${amountInUsdt.toString()} USDT credited to your Fund Wallet.`
          : `Transaction registered with ${confirmations}/${requiredConfirmations} confirmations. Auto-crediting in progress.`,
        deposit: created,
      })
    );
  } catch (error: any) {
    console.error("[Crypto Deposit POST Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process deposit transaction" },
      { status: 500 }
    );
  }
}
