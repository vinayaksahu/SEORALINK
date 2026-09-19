import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DepositFormClient from "./DepositFormClient";
import { Wallet, Clock, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { isUserSystemExited } from "@/lib/userStatus";

export default async function MemberDepositPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isSystemExited = await isUserSystemExited(session.userId);

  // Fetch user deposits
  const deposits = await db.depositRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Fetch deposit address settings from system config
  const addressListConfig = await db.systemConfig.findUnique({
    where: { key: "USDT_DEPOSIT_ADDRESSES" },
  });
  const distributionModeConfig = await db.systemConfig.findUnique({
    where: { key: "DEPOSIT_DISTRIBUTION_MODE" },
  });
  const depositAddressConfig = await db.systemConfig.findUnique({
    where: { key: "USDT_DEPOSIT_ADDRESS" },
  });
  const defaultNetworkConfig = await db.systemConfig.findUnique({
    where: { key: "DEFAULT_NETWORK" },
  });

  const defaultAddress = depositAddressConfig?.value || "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001";
  const defaultNetwork = defaultNetworkConfig?.value || "USDT_BEP20";
  const distributionMode = distributionModeConfig?.value || "MULTI_USER";

  let addresses: Array<{
    id: string;
    address: string;
    label?: string;
    network: string;
    isActive: boolean;
    isPrimary?: boolean;
  }> = [];

  try {
    if (addressListConfig?.value) {
      addresses = JSON.parse(addressListConfig.value);
    }
  } catch (e) {
    addresses = [];
  }

  const activeAddresses = addresses.filter((a) => a.isActive);

  let selectedAddress = defaultAddress;
  let selectedNetwork = defaultNetwork;
  let selectedLabel = "Official Deposit Wallet";

  if (activeAddresses.length > 0) {
    if (distributionMode === "MULTI_USER" && activeAddresses.length > 1) {
      // Deterministic hash based on session.userId so different users see different addresses simultaneously,
      // while a single user sees a consistent address across page reloads.
      let hash = 0;
      const keyStr = session.userId || "user";
      for (let i = 0; i < keyStr.length; i++) {
        hash = ((hash << 5) - hash) + keyStr.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % activeAddresses.length;
      const chosen = activeAddresses[index];
      selectedAddress = chosen.address;
      selectedNetwork = chosen.network || defaultNetwork;
      selectedLabel = chosen.label || `Company Wallet #${index + 1}`;
    } else {
      const primary = activeAddresses.find((a) => a.isPrimary) || activeAddresses[0];
      selectedAddress = primary.address;
      selectedNetwork = primary.network || defaultNetwork;
      selectedLabel = primary.label || "Official Deposit Wallet";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet size={20} className="text-[#38bdf8]" />
          Deposit USDT &bull; Fund Wallet Top-Up
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Deposit USDT to your Fund Wallet to activate accounts or register downline partners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Deposit Submission Form Component or System Exit Notice */}
        {isSystemExited ? (
          <div className="card-seoralink p-6 border-2 border-purple-500/50 bg-purple-500/10 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert size={28} className="text-purple-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-purple-300">
                  Deposits Disabled &bull; System Exited
                </h3>
                <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider">
                  Single-Exit Protocol Settlement
                </span>
              </div>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              This member account has executed the single-exit rank cashout protocol and has officially concluded its participation in the SEORALINK network. Under system exit rules, fund deposits are permanently disabled for retired IDs.
            </p>
          </div>
        ) : (
          <DepositFormClient
            depositAddress={selectedAddress}
            initialNetwork={selectedNetwork}
            walletLabel={selectedLabel}
          />
        )}

        {/* Deposit History Table */}
        <div className="card-seoralink p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-[#d4af37]" />
            Your Recent Deposit Requests
          </h3>

          {deposits.length === 0 ? (
            <div className="text-center py-12 text-[#94a3b8] text-xs border border-dashed border-[#1e293b] rounded-xl">
              No deposit requests found. Submit your first deposit on the left.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-num text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#94a3b8] text-[10px] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">TxID</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-[#0f172a]/30">
                      <td className="py-2.5 px-3 text-[#94a3b8] text-[11px]">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        ${parseFloat(d.amount.toString()).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-[#38bdf8] truncate max-w-[120px]">
                        {d.txHash}
                      </td>
                      <td className="py-2.5 px-3">
                        {d.status === "APPROVED" && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        )}
                        {d.status === "PENDING" && (
                          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {d.status === "REJECTED" && (
                          <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
