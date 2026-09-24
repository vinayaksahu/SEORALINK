import { db, withDbRetry } from "@/lib/db";
import { mnemonicToAccount, generateMnemonic, english } from "viem/accounts";
import Decimal from "decimal.js";
import { getBranchSystemConfig } from "@/lib/adminBranchConfig";

// BSC Mainnet Constants
export const BSC_CHAIN_ID = 56;
export const DEFAULT_BSC_USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955".toLowerCase();
export const ERC20_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export const USDT_DECIMALS = 18;
export const DEFAULT_REQUIRED_CONFIRMATIONS = 3;
export const DEFAULT_FIXED_DEPOSIT_AMOUNT = "10.00";

// Public RPC endpoints with fallback (verified active and open)
export const DEFAULT_BSC_RPCS = [
  "https://bsc.publicnode.com",
  "https://binance.community-rpc.com",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
  "https://bsc-rpc.publicnode.com",
  "https://1rpc.io/bnb",
];

export const ALL_DEPOSIT_PERMISSIONS = [
  "deposit.view",
  "deposit.approve",
  "deposit.reject",
  "deposit.verify",
  "deposit.reconcile",
  "deposit.export",
  "deposit.vault.update",
  "deposit.settings.update",
  "deposit.mode.override",
  "deposit.details.inspect",
  "deposit.rate.view",
  "deposit.queue.manage",
  "deposit.notes.edit",
  "deposit.audit.view",
  "deposit.notify.resend",
  "deposit.address.generate",
  "deposit.analytics.view",
] as const;

export type DepositPermission = typeof ALL_DEPOSIT_PERMISSIONS[number];

/**
 * Resolves active BSC RPC endpoints including database overrides
 */
export async function getBscRpcEndpoints(): Promise<string[]> {
  try {
    const config = await db.systemConfig.findUnique({ where: { key: "BSC_RPC_URL" } });
    if (config?.value && config.value.trim()) {
      const customUrls = config.value
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u.startsWith("http"));
      if (customUrls.length > 0) {
        return [...customUrls, ...DEFAULT_BSC_RPCS];
      }
    }
  } catch (err) {
    console.warn("[BlockchainConfig] Error fetching custom RPC, using defaults:", err);
  }
  return DEFAULT_BSC_RPCS;
}

/**
 * Resolves active USDT BEP-20 Contract address with database override
 */
export async function getUsdtContractAddress(): Promise<string> {
  try {
    const config = await db.systemConfig.findUnique({ where: { key: "USDT_BSC_CONTRACT" } });
    if (config?.value && config.value.trim().startsWith("0x")) {
      return config.value.trim().toLowerCase();
    }
  } catch (err) {
    console.warn("[BlockchainConfig] Error fetching custom USDT contract:", err);
  }
  return DEFAULT_BSC_USDT_CONTRACT;
}

/**
 * Checks whether emergency crediting pause (kill-switch) is active
 */
export async function isDepositCreditingPaused(): Promise<boolean> {
  try {
    const config = await db.systemConfig.findUnique({ where: { key: "DEPOSIT_KILL_SWITCH" } });
    return config?.value === "PAUSED";
  } catch {
    return false;
  }
}

/**
 * Retrieves the required block confirmations (default 3)
 */
export async function getRequiredConfirmations(): Promise<number> {
  try {
    const config = await db.systemConfig.findUnique({ where: { key: "DEPOSIT_REQUIRED_CONFIRMATIONS" } });
    if (config?.value) {
      const parsed = parseInt(config.value, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return DEFAULT_REQUIRED_CONFIRMATIONS;
}

/**
 * Executes a resilient JSON-RPC call across fallback endpoints
 */
export async function callBscRpc<T = any>(
  method: string,
  params: any[] = [],
  timeoutMs = 8000
): Promise<T> {
  const rpcs = await getBscRpcEndpoints();
  let lastError: any = null;

  for (const rpc of rpcs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Math.floor(Math.random() * 1000000),
          method,
          params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${rpc}`);
      }

      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message || `RPC Error: ${JSON.stringify(json.error)}`);
      }

      return json.result as T;
    } catch (err: any) {
      lastError = err;
      // Continue to next RPC fallback endpoint
    }
  }

  throw new Error(`All BSC RPC endpoints failed for ${method}. Last error: ${lastError?.message}`);
}

/**
 * Resolves effective deposit processing mode using the 3-tier hierarchy:
 * Level 1: Admin Branch Override (Admin.depositMode === "AUTOMATIC" | "MANUAL")
 * Level 2: Inheritance (if "GLOBAL", look up platform SystemConfig key DEPOSIT_PROCESSING_MODE)
 * Level 3: Default is "MANUAL"
 */
export async function getDepositProcessingMode(adminId?: string | null): Promise<"AUTOMATIC" | "MANUAL"> {
  if (adminId) {
    try {
      const admin = await db.user.findUnique({
        where: { id: adminId },
        select: { depositMode: true, role: true },
      });
      if (admin?.depositMode === "AUTOMATIC" || admin?.depositMode === "MANUAL") {
        return admin.depositMode;
      }
    } catch (e) {
      console.error("[getDepositProcessingMode] Admin fetch failed:", e);
    }
  }

  try {
    const globalConfig = await db.systemConfig.findUnique({
      where: { key: "DEPOSIT_PROCESSING_MODE" },
    });
    if (globalConfig?.value === "AUTOMATIC" || globalConfig?.value === "MANUAL") {
      return globalConfig.value;
    }
  } catch (e) {
    console.error("[getDepositProcessingMode] Global config fetch failed:", e);
  }

  return "MANUAL";
}

/**
 * Resolves effective deposit processing mode for a specific user
 */
export async function getDepositProcessingModeForUser(userId: string): Promise<"AUTOMATIC" | "MANUAL"> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { adminId: true, depositMode: true },
    });

    if (user?.depositMode === "AUTOMATIC" || user?.depositMode === "MANUAL") {
      return user.depositMode;
    }

    return await getDepositProcessingMode(user?.adminId);
  } catch (err) {
    console.error("[getDepositProcessingModeForUser] Error:", err);
    return "MANUAL";
  }
}

/**
 * Resolves the effective deposit receiving vault for Manual Approval Mode
 * Per-Admin dedicated vault isolation with company fallback
 */
export async function getEffectiveDepositVault(userId: string): Promise<{
  address: string;
  qrCodeUrl: string | null;
  label: string;
  source: "ADMIN_BRANCH" | "GLOBAL_FALLBACK";
  adminId: string | null;
  adminName: string | null;
}> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        adminId: true,
        usdtAddress: true,
        fullName: true,
        customId: true,
        assignedAdmin: {
          select: {
            id: true,
            fullName: true,
            customId: true,
            usdtAddress: true,
          },
        },
      },
    });

    // Check if the user is an admin or has an assigned branch admin
    const targetAdmin =
      user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
        ? { id: user.id, fullName: user.fullName, customId: user.customId, usdtAddress: user.usdtAddress }
        : user?.assignedAdmin || null;

    if (targetAdmin) {
      const adminRef = targetAdmin.id;
      const [addrRes, distRes, addrsListRes] = await Promise.all([
        getBranchSystemConfig("USDT_DEPOSIT_ADDRESS", adminRef),
        getBranchSystemConfig("DEPOSIT_DISTRIBUTION_MODE", adminRef),
        getBranchSystemConfig("USDT_DEPOSIT_ADDRESSES", adminRef),
      ]);

      let chosenAddress = addrRes.value || targetAdmin.usdtAddress;

      // If MULTI_USER mode is active for this admin branch, pick a deterministic address from their pool
      if (distRes.value === "MULTI_USER" && addrsListRes.value) {
        try {
          const list = JSON.parse(addrsListRes.value);
          const activeList = Array.isArray(list) ? list.filter((a: any) => a && a.isActive && a.address) : [];
          if (activeList.length > 0) {
            let hash = 0;
            for (let i = 0; i < userId.length; i++) {
              hash = (hash << 5) - hash + userId.charCodeAt(i);
              hash |= 0;
            }
            const idx = Math.abs(hash) % activeList.length;
            chosenAddress = activeList[idx].address;
          }
        } catch {
          // keep chosenAddress fallback
        }
      }

      const adminQrConfig = await db.systemConfig.findFirst({
        where: {
          key: {
            in: [
              `ADMIN_DEPOSIT_QR_${targetAdmin.id}`,
              `ADMIN_DEPOSIT_QR_${targetAdmin.customId}`,
            ],
          },
        },
      });

      if (chosenAddress && chosenAddress.trim().startsWith("0x")) {
        return {
          address: chosenAddress.trim(),
          qrCodeUrl: adminQrConfig?.value || null,
          label: `Branch Vault (${targetAdmin.fullName} - ${targetAdmin.customId})`,
          source: "ADMIN_BRANCH",
          adminId: targetAdmin.id,
          adminName: targetAdmin.fullName,
        };
      }
    }

    // Fallback: Global company deposit address
    const globalAddrConfig = await db.systemConfig.findUnique({
      where: { key: "USDT_DEPOSIT_ADDRESS" },
    });
    const globalQrConfig = await db.systemConfig.findUnique({
      where: { key: "USDT_DEPOSIT_QR" },
    });

    const fallbackAddress =
      globalAddrConfig?.value ||
      process.env.DEFAULT_DEPOSIT_USDT_ADDRESS ||
      "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001";

    return {
      address: fallbackAddress.trim(),
      qrCodeUrl: globalQrConfig?.value || null,
      label: "Official SeoraLink Company Vault",
      source: "GLOBAL_FALLBACK",
      adminId: null,
      adminName: null,
    };
  } catch (err) {
    console.error("[getEffectiveDepositVault] Error:", err);
    return {
      address: "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001",
      qrCodeUrl: null,
      label: "Official SeoraLink Company Vault",
      source: "GLOBAL_FALLBACK",
      adminId: null,
      adminName: null,
    };
  }
}

/**
 * Gets or creates the Master HD Mnemonic for deterministic member address derivation
 */
export async function getMasterMnemonic(): Promise<string> {
  const envMnemonic = process.env.DEPOSIT_MASTER_MNEMONIC;
  if (envMnemonic && envMnemonic.trim().split(" ").length >= 12) {
    return envMnemonic.trim();
  }

  const existingConfig = await db.systemConfig.findUnique({
    where: { key: "DEPOSIT_MASTER_MNEMONIC" },
  });

  if (existingConfig?.value && existingConfig.value.trim().split(" ").length >= 12) {
    return existingConfig.value.trim();
  }

  // Generate a cryptographically secure 24-word BIP-39 mnemonic
  const newMnemonic = generateMnemonic(english);
  await db.systemConfig.upsert({
    where: { key: "DEPOSIT_MASTER_MNEMONIC" },
    create: {
      key: "DEPOSIT_MASTER_MNEMONIC",
      value: newMnemonic,
      description: "Master BIP-39 mnemonic for deterministic member BSC deposit address generation",
    },
    update: {
      value: newMnemonic,
    },
  });

  return newMnemonic;
}

/**
 * Derives or retrieves a member's unique, deterministic receiving BSC address for Automatic Mode
 */
export async function getOrCreateMemberDepositAddress(userId: string): Promise<{
  address: string;
  derivationIndex: number;
  network: string;
  asset: string;
  isNew: boolean;
}> {
  return await withDbRetry(async () => {
    // 1. Check if user already has an active deposit address
    const existing = await db.depositAddress.findFirst({
      where: { userId, status: "ACTIVE" },
    });

    if (existing) {
      return {
        address: existing.address,
        derivationIndex: existing.derivationIndex,
        network: existing.network,
        asset: existing.asset,
        isNew: false,
      };
    }

    // 2. Fetch master mnemonic
    const mnemonic = await getMasterMnemonic();

    // 3. Atomically find the next derivation index
    const lastAddress = await db.depositAddress.findFirst({
      orderBy: { derivationIndex: "desc" },
      select: { derivationIndex: true },
    });

    const nextIndex = (lastAddress?.derivationIndex || 0) + 1;

    // Standard BIP-44 path for Ethereum / BSC: m/44'/60'/0'/0/index
    const path = `m/44'/60'/0'/0/${nextIndex}` as any;
    const account = mnemonicToAccount(mnemonic, { path });
    const derivedAddress = account.address.toLowerCase();

    // 4. Save to database
    const created = await db.depositAddress.create({
      data: {
        userId,
        network: "BSC",
        asset: "USDT",
        address: derivedAddress,
        derivationIndex: nextIndex,
        status: "ACTIVE",
      },
    });

    return {
      address: created.address,
      derivationIndex: created.derivationIndex,
      network: created.network,
      asset: created.asset,
      isNew: true,
    };
  });
}

/**
 * Checks whether an admin has a specific deposit permission
 * SuperRootAdmin always has all permissions
 */
export async function checkAdminDepositPermission(
  adminId: string,
  permission: DepositPermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === "SUPER_ROOT_ADMIN") return true;

  try {
    const record = await db.adminDepositPermission.findUnique({
      where: {
        adminId_permission: {
          adminId,
          permission,
        },
      },
    });
    return Boolean(record);
  } catch {
    return false;
  }
}

/**
 * Recursively serializes BigInt and Decimal fields for safe JSON responses
 * Prevents "Do not know how to serialize a BigInt" crashes
 */
export function serializeBlockchainData<T>(obj: T): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  // Handle Prisma Decimal or Decimal.js
  if (
    typeof obj === "object" &&
    obj !== null &&
    "d" in (obj as any) &&
    "e" in (obj as any) &&
    "s" in (obj as any) &&
    typeof (obj as any).toFixed === "function"
  ) {
    return (obj as any).toFixed(8);
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBlockchainData(item));
  }

  if (typeof obj === "object") {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      res[key] = serializeBlockchainData(value);
    }
    return res;
  }

  return obj;
}
