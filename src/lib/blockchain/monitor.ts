import { db, withDbRetry } from "@/lib/db";
import { executeLedgerTransaction } from "@/lib/ledger";
import { recordActivity } from "@/lib/auditLogger";
import Decimal from "decimal.js";
import {
  callBscRpc,
  getUsdtContractAddress,
  getRequiredConfirmations,
  isDepositCreditingPaused,
  ERC20_TRANSFER_TOPIC,
  USDT_DECIMALS,
} from "./config";

export const CHECKPOINT_ID = "bsc_usdt_mainnet";

export interface ScanResult {
  success: boolean;
  status: string;
  fromBlock?: string;
  toBlock?: string;
  currentBlock?: string;
  blocksScanned: number;
  transfersDetected: number;
  depositsCredited: number;
  depositsPaused: number;
  errors?: string[];
}

/**
 * Parses 32-byte hex string to an EVM 20-byte address
 */
export function topicToAddress(topic: string): string {
  if (!topic || topic.length < 42) return "";
  const clean = topic.startsWith("0x") ? topic.slice(2) : topic;
  return ("0x" + clean.slice(-40)).toLowerCase();
}

/**
 * Verifies an individual on-chain Transaction Hash on BSC
 * Validates token contract, recipient, status, and amount
 */
export async function verifyOnChainTxHash(
  txHash: string,
  expectedRecipient?: string,
  minAmount = 0.01
): Promise<{
  valid: boolean;
  error?: string;
  blockNumber?: bigint;
  confirmations?: number;
  fromAddress?: string;
  toAddress?: string;
  amountInUsdt?: string;
  txStatus?: string;
}> {
  const cleanHash = txHash.trim();
  if (!cleanHash.startsWith("0x") || cleanHash.length !== 66) {
    return { valid: false, error: "Invalid transaction hash format. Must be 66 hex characters starting with 0x." };
  }

  const usdtContract = (await getUsdtContractAddress()).toLowerCase();

  // 1. Fetch transaction receipt
  const receipt = await callBscRpc("eth_getTransactionReceipt", [cleanHash]);
  if (!receipt) {
    return { valid: false, error: "Transaction receipt not found on BSC. The transaction may still be propagating in mempool." };
  }

  if (receipt.status !== "0x1") {
    return { valid: false, error: "Transaction has failed or reverted on BNB Smart Chain." };
  }

  // 2. Fetch current block number for confirmation count
  const currentBlockHex = await callBscRpc("eth_blockNumber");
  const currentBlock = BigInt(currentBlockHex);
  const txBlock = BigInt(receipt.blockNumber);
  const confirmations = Number(currentBlock >= txBlock ? currentBlock - txBlock + 1n : 0n);

  // 3. Scan logs for USDT BEP-20 Transfer
  const logs = receipt.logs || [];
  let matchingTransfer: { from: string; to: string; amount: Decimal } | null = null;

  for (const log of logs) {
    if (log.address.toLowerCase() === usdtContract) {
      const topics = log.topics || [];
      if (topics[0]?.toLowerCase() === ERC20_TRANSFER_TOPIC.toLowerCase()) {
        const from = topicToAddress(topics[1]);
        const to = topicToAddress(topics[2]);
        const rawValue = BigInt(log.data || "0x0");
        const amount = new Decimal(rawValue.toString()).dividedBy(new Decimal(10).pow(USDT_DECIMALS));

        if (expectedRecipient) {
          if (to.toLowerCase() === expectedRecipient.toLowerCase()) {
            matchingTransfer = { from, to, amount };
            break;
          }
        } else {
          // Take the highest transfer if multiple
          if (!matchingTransfer || amount.greaterThan(matchingTransfer.amount)) {
            matchingTransfer = { from, to, amount };
          }
        }
      }
    }
  }

  if (!matchingTransfer) {
    return {
      valid: false,
      error: expectedRecipient
        ? `No USDT BEP-20 transfer found sent to ${expectedRecipient}.`
        : "No USDT BEP-20 transfer found in this transaction.",
    };
  }

  if (matchingTransfer.amount.lessThan(minAmount)) {
    return {
      valid: false,
      error: `Transfer amount (${matchingTransfer.amount.toFixed(2)} USDT) is less than required minimum (${minAmount.toFixed(2)} USDT).`,
    };
  }

  return {
    valid: true,
    blockNumber: txBlock,
    confirmations,
    fromAddress: matchingTransfer.from,
    toAddress: matchingTransfer.to,
    amountInUsdt: matchingTransfer.amount.toFixed(8),
    txStatus: "SUCCESS",
  };
}

/**
 * Main blockchain monitoring engine
 * Scans BSC blocks for incoming transfers to platform member addresses,
 * tracks confirmations, and credits user wallets automatically.
 */
export async function runBlockchainMonitor(maxBlocksToScan = 80): Promise<ScanResult> {
  const result: ScanResult = {
    success: false,
    status: "STARTING",
    blocksScanned: 0,
    transfersDetected: 0,
    depositsCredited: 0,
    depositsPaused: 0,
    errors: [],
  };

  try {
    const usdtContract = (await getUsdtContractAddress()).toLowerCase();
    const requiredConfirmations = await getRequiredConfirmations();
    const isPaused = await isDepositCreditingPaused();

    // 1. Fetch current BSC block number
    const currentBlockHex = await callBscRpc("eth_blockNumber");
    const currentBlock = BigInt(currentBlockHex);
    result.currentBlock = currentBlock.toString();

    // 2. Fetch or initialize blockchain checkpoint
    let checkpoint = await db.blockchainCheckpoint.findUnique({
      where: { id: CHECKPOINT_ID },
    });

    if (!checkpoint) {
      // Start 15 blocks behind current head
      const startBlock = currentBlock > 15n ? currentBlock - 15n : currentBlock;
      checkpoint = await db.blockchainCheckpoint.create({
        data: {
          id: CHECKPOINT_ID,
          lastProcessedBlock: startBlock,
          latestKnownBlock: currentBlock,
          status: "IDLE",
          lastSuccessfulScan: new Date(),
        },
      });
    }

    let fromBlock = checkpoint.lastProcessedBlock + 1n;
    if (currentBlock > fromBlock + 100n) {
      // Fast-forward checkpoint to 50 blocks behind head so monitor never lags
      fromBlock = currentBlock - 50n;
    }

    if (fromBlock > currentBlock) {
      // Up to date; also process any pending confirmations
      await processPendingConfirmations(currentBlock, requiredConfirmations, isPaused, result);
      result.success = true;
      result.status = "UP_TO_DATE";
      return result;
    }

    // Limit block range to prevent RPC timeouts
    const toBlock =
      fromBlock + BigInt(maxBlocksToScan) - 1n < currentBlock
        ? fromBlock + BigInt(maxBlocksToScan) - 1n
        : currentBlock;

    result.fromBlock = fromBlock.toString();
    result.toBlock = toBlock.toString();
    result.blocksScanned = Number(toBlock - fromBlock + 1n);

    // Update checkpoint status to RUNNING
    await db.blockchainCheckpoint.update({
      where: { id: CHECKPOINT_ID },
      data: { status: "RUNNING", latestKnownBlock: currentBlock },
    });

    // 3. Query ERC-20 Transfer logs
    const fromHex = "0x" + fromBlock.toString(16);
    const toHex = "0x" + toBlock.toString(16);

    const logs = await callBscRpc("eth_getLogs", [
      {
        fromBlock: fromHex,
        toBlock: toHex,
        address: usdtContract,
        topics: [ERC20_TRANSFER_TOPIC],
      },
    ]);

    // 4. Index member addresses for fast lookup
    const memberAddresses = await db.depositAddress.findMany({
      where: { status: "ACTIVE" },
      select: { userId: true, address: true },
    });

    const addressToUserMap = new Map<string, string>();
    for (const item of memberAddresses) {
      addressToUserMap.set(item.address.toLowerCase(), item.userId);
    }

    // 5. Process detected logs
    if (Array.isArray(logs) && logs.length > 0) {
      for (const log of logs) {
        try {
          const topics = log.topics || [];
          if (topics.length < 3) continue;

          const toAddress = topicToAddress(topics[2]);
          const userId = addressToUserMap.get(toAddress);

          // If recipient matches a registered member's deterministic address
          if (userId) {
            result.transfersDetected++;
            const fromAddress = topicToAddress(topics[1]);
            const rawValue = BigInt(log.data || "0x0");
            const amountInUsdt = new Decimal(rawValue.toString()).dividedBy(
              new Decimal(10).pow(USDT_DECIMALS)
            );

            // Minimum $0.01 threshold to filter spam dust
            if (amountInUsdt.lessThan(0.01)) continue;

            const txHash = log.transactionHash.toLowerCase();
            const logBlock = BigInt(log.blockNumber);
            const confirmations = Number(currentBlock >= logBlock ? currentBlock - logBlock + 1n : 1n);

            // Atomically register DepositRequest if not exists
            const existing = await db.depositRequest.findUnique({
              where: { txHash },
            });

            if (!existing) {
              await db.depositRequest.create({
                data: {
                  userId,
                  amount: amountInUsdt.toFixed(8),
                  amountInUsdt: amountInUsdt.toFixed(8),
                  txHash,
                  network: "USDT_BEP20",
                  tokenContract: usdtContract,
                  fromAddress,
                  toAddress,
                  blockNumber: logBlock,
                  confirmations,
                  processingMode: "AUTOMATIC",
                  status: confirmations >= requiredConfirmations ? "CONFIRMED" : "CONFIRMING",
                  detectedAt: new Date(),
                  confirmedAt: confirmations >= requiredConfirmations ? new Date() : null,
                },
              });
            } else {
              // Update blockNumber / confirmations if newly confirmed
              await db.depositRequest.update({
                where: { txHash },
                data: {
                  confirmations,
                  blockNumber: logBlock,
                  status:
                    existing.status === "CONFIRMING" && confirmations >= requiredConfirmations
                      ? "CONFIRMED"
                      : existing.status,
                },
              });
            }
          }
        } catch (logErr: any) {
          result.errors?.push(`Log processing error: ${logErr.message}`);
        }
      }
    }

    // 6. Process pending confirmations and credit balances
    await processPendingConfirmations(currentBlock, requiredConfirmations, isPaused, result);

    // 7. Update checkpoint on success
    await db.blockchainCheckpoint.update({
      where: { id: CHECKPOINT_ID },
      data: {
        lastProcessedBlock: toBlock,
        latestKnownBlock: currentBlock,
        status: "IDLE",
        lastSuccessfulScan: new Date(),
        lastError: null,
      },
    });

    result.success = true;
    result.status = "COMPLETED";
    return result;
  } catch (err: any) {
    result.status = "ERROR";
    result.errors?.push(err.message || String(err));

    // Record error in checkpoint
    try {
      await db.blockchainCheckpoint.update({
        where: { id: CHECKPOINT_ID },
        data: {
          status: "IDLE",
          lastError: err.message || String(err),
        },
      });
    } catch {}

    return result;
  }
}

/**
 * Handles confirmation tracking and atomic crediting of uncredited deposits
 */
async function processPendingConfirmations(
  currentBlock: bigint,
  requiredConfirmations: number,
  isPaused: boolean,
  result: ScanResult
) {
  // Find all uncredited automatic deposits
  const pendingDeposits = await db.depositRequest.findMany({
    where: {
      processingMode: "AUTOMATIC",
      status: {
        in: ["CONFIRMING", "CONFIRMED", "CREDIT_PENDING_PAUSED", "PENDING"],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          customId: true,
          fullName: true,
          adminId: true,
        },
      },
    },
  });

  for (const deposit of pendingDeposits) {
    try {
      let confirmations = deposit.confirmations;
      if (deposit.blockNumber) {
        confirmations = Number(
          currentBlock >= deposit.blockNumber ? currentBlock - deposit.blockNumber + 1n : 0n
        );
      }

      const isReadyToCredit = confirmations >= requiredConfirmations;

      if (!isReadyToCredit) {
        // Update confirmation count
        if (confirmations !== deposit.confirmations) {
          await db.depositRequest.update({
            where: { id: deposit.id },
            data: { confirmations, status: "CONFIRMING" },
          });
        }
        continue;
      }

      // If kill-switch is active, pause crediting
      if (isPaused) {
        if (deposit.status !== "CREDIT_PENDING_PAUSED") {
          await db.depositRequest.update({
            where: { id: deposit.id },
            data: {
              confirmations,
              status: "CREDIT_PENDING_PAUSED",
              adminNote: "Automatic crediting paused by SuperRootAdmin Kill-Switch.",
            },
          });
          result.depositsPaused++;
        }
        continue;
      }

      // Execute atomic balance crediting & ledger insertion inside db.$transaction
      await db.$transaction(
        async (tx) => {
          // Re-fetch with row lock check
          const current = await tx.depositRequest.findUnique({
            where: { id: deposit.id },
          });

          if (!current || current.status === "CREDITED") {
            return;
          }

          const creditAmount = new Decimal(current.amountInUsdt.toString());
          const referenceKey = `CRYPTO_DEPOSIT_${current.txHash}`;

          // Execute ledger transaction to increment Fund Wallet
          await executeLedgerTransaction(
            {
              userId: current.userId,
              type: "DEPOSIT",
              wallet: "FUND",
              amount: creditAmount,
              referenceKey,
              description: `Automated USDT BEP-20 Deposit Credited (TxHash: ${current.txHash.slice(0, 10)}...)`,
            },
            tx
          );

          // Mark deposit as CREDITED
          await tx.depositRequest.update({
            where: { id: current.id },
            data: {
              status: "CREDITED",
              confirmations,
              creditedAt: new Date(),
              confirmedAt: current.confirmedAt || new Date(),
              adminNote: "Automatically credited after blockchain confirmation.",
            },
          });

          result.depositsCredited++;
        },
        { timeout: 30000, maxWait: 10000 }
      );
    } catch (creditErr: any) {
      console.error(`[processPendingConfirmations] Error crediting deposit ${deposit.id}:`, creditErr);
      result.errors?.push(`Crediting failed for ${deposit.id}: ${creditErr.message}`);
    }
  }
}
