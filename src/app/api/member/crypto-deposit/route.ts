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

    let depositInfo: {
      mode: "AUTOMATIC" | "MANUAL";
      address: string;
      qrCodeUrl: string | null;
      label: string;
      network: string;
      asset: string;
      source?: string;
      derivationIndex?: number;
    };

    if (mode === "AUTOMATIC") {
      const personalAddress = await getOrCreateMemberDepositAddress(session.userId);
      depositInfo = {
        mode: "AUTOMATIC",
        address: personalAddress.address,
        qrCodeUrl: null,
        label: "Your Dedicated BSC Deposit Address (Auto-Credit)",
        network: "USDT_BEP20",
        asset: "USDT",
        derivationIndex: personalAddress.derivationIndex,
      };
    } else {
      const vault = await getEffectiveDepositVault(session.userId);
      depositInfo = {
        mode: "MANUAL",
        address: vault.address,
        qrCodeUrl: vault.qrCodeUrl,
        label: vault.label,
        network: "USDT_BEP20",
        asset: "USDT",
        source: vault.source,
      };
    }

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

    if (currentUser?.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Your account is already active. Deposits are disabled for active accounts." },
        { status: 403 }
      );
    }

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
    let expectedAddress: string | undefined;
    if (mode === "AUTOMATIC") {
      const personal = await getOrCreateMemberDepositAddress(session.userId);
      expectedAddress = personal.address;
    } else {
      const vault = await getEffectiveDepositVault(session.userId);
      expectedAddress = vault.address;
    }

    // Allow minimum 1.0 USDT for testing or flexible wallet deposits
    const minAmount = 1.0;
    const verification = await verifyOnChainTxHash(cleanHash, expectedAddress, minAmount);

    if (!verification.valid) {
      return NextResponse.json(
        {
          error:
            verification.error ||
            "On-chain verification failed. Ensure USDT was sent to the designated address and has mined.",
        },
        { status: 400 }
      );
    }

    const amountInUsdt = new Decimal(verification.amountInUsdt || "10.00");
    const confirmations = verification.confirmations || 0;
    const blockNumber = verification.blockNumber;

    if (mode === "AUTOMATIC") {
      const shouldCreditImmediately = confirmations >= requiredConfirmations && !isPaused;
      const initialStatus = shouldCreditImmediately
        ? "CREDITED"
        : isPaused
        ? "CREDIT_PENDING_PAUSED"
        : confirmations >= requiredConfirmations
        ? "CONFIRMED"
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
              ? "Instantly credited via on-chain confirmation"
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
        },
      });

      return NextResponse.json(
        serializeBlockchainData({
          success: true,
          message: shouldCreditImmediately
            ? `Transaction confirmed on BSC! $${amountInUsdt.toFixed(2)} USDT credited to your Fund Wallet.`
            : `Transaction registered with ${confirmations}/${requiredConfirmations} confirmations. Auto-crediting in progress.`,
          deposit: created,
        })
      );
    } else {
      // MANUAL APPROVAL MODE
      const created = await db.depositRequest.create({
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
          processingMode: "MANUAL",
          status: "PENDING_REVIEW",
          detectedAt: new Date(),
          adminNote: `Manual deposit submitted by member. Verified on-chain to ${verification.toAddress}.`,
        },
      });

      await recordActivity({
        req,
        userId: session.userId,
        customId: session.customId,
        fullName: session.fullName,
        role: session.role,
        adminId: currentUser?.adminId,
        action: "DEPOSIT_PENDING_REVIEW",
        category: "FINANCE",
        details: {
          txHash: cleanHash,
          amount: amountInUsdt.toString(),
          vaultAddress: verification.toAddress,
          mode: "MANUAL",
        },
      });

      return NextResponse.json(
        serializeBlockchainData({
          success: true,
          message:
            "Deposit verified on BSC and queued for your Branch Admin review. Funds will be credited once approved.",
          deposit: created,
        })
      );
    }
  } catch (error: any) {
    console.error("[Crypto Deposit POST Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process deposit transaction" },
      { status: 500 }
    );
  }
}
