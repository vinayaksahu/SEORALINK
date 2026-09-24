import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DepositFormClient from "./DepositFormClient";
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Zap,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { isUserSystemExited } from "@/lib/userStatus";
import {
  getDepositProcessingModeForUser,
  getOrCreateMemberDepositAddress,
  getEffectiveDepositVault,
  getRequiredConfirmations,
  isDepositCreditingPaused,
  serializeBlockchainData,
} from "@/lib/blockchain/config";

export const dynamic = "force-dynamic";

export default async function MemberDepositPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isSystemExited = await isUserSystemExited(session.userId);

  const currentUser = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, status: true, customId: true, fundBalance: true },
  });

  const isActivated = currentUser?.status === "ACTIVE";

  // Resolve 3-tier processing mode
  const mode = await getDepositProcessingModeForUser(session.userId);
  const isPaused = await isDepositCreditingPaused();
  const requiredConfirmations = await getRequiredConfirmations();

  // Direct all deposits directly to the Admin's Main Vault address
  const vault = await getEffectiveDepositVault(session.userId);
  const depositAddress = vault.address;
  const walletLabel = vault.label;
  const qrCodeUrl = vault.qrCodeUrl;

  // Fetch recent user deposits
  const rawDeposits = await db.depositRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const deposits = serializeBlockchainData(rawDeposits);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet size={20} className="text-[#38bdf8]" />
          Deposit USDT &bull; Fund Wallet Top-Up
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Deposit USDT on BNB Smart Chain (BEP-20) to your Fund Wallet to activate accounts or register downline partners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Deposit Submission Form Component or Disabled Notices */}
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
          <div className="space-y-4">
            {isActivated && (
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">Account Active &bull; Fund Wallet Top-Up</span>
                    <span className="text-[11px] text-emerald-200/80">
                      Balance: ${parseFloat(currentUser?.fundBalance?.toString() || "0").toFixed(2)} USDT. Deposits credit directly to your Fund Wallet.
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DepositFormClient
              mode={mode}
              depositAddress={depositAddress}
              walletLabel={walletLabel}
              qrCodeUrl={qrCodeUrl}
              requiredConfirmations={requiredConfirmations}
              isPaused={isPaused}
            />
          </div>
        )}

        {/* Deposit History Table */}
        <div className="card-seoralink p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-[#d4af37]" />
              Your Recent Deposit Requests
            </h3>
            <span className="text-[10px] text-[#94a3b8] font-mono">Auto-refreshes on scan</span>
          </div>

          {deposits.length === 0 ? (
            <div className="text-center py-12 text-[#94a3b8] text-xs border border-dashed border-[#1e293b] rounded-xl space-y-2">
              <p>No deposit requests found.</p>
              <p className="text-[11px] text-[#64748b]">
                {mode === "AUTOMATIC"
                  ? "Send USDT to your personal address to see auto-credited transfers here."
                  : "Submit your first deposit on the left."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-num text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#94a3b8] text-[10px] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">TxID</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {deposits.map((d: any) => {
                    const status = d.status?.toUpperCase();
                    const isCredited = status === "CREDITED" || status === "APPROVED";
                    const isConfirming = status === "CONFIRMING";
                    const isConfirmed = status === "CONFIRMED";
                    const isPendingReview = status === "PENDING" || status === "PENDING_REVIEW";
                    const isPausedState = status === "CREDIT_PENDING_PAUSED";
                    const isRejected = status === "REJECTED" || status === "FAILED";

                    return (
                      <tr key={d.id} className="hover:bg-[#0f172a]/30">
                        <td className="py-2.5 px-3 text-[#94a3b8] text-[11px]">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          ${parseFloat(d.amountInUsdt || d.amount || "0").toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 max-w-[140px]">
                          <a
                            href={
                              d.txHash?.trim().startsWith("http")
                                ? d.txHash.trim()
                                : `https://bscscan.com/tx/${d.txHash?.trim()}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38bdf8] hover:text-sky-300 hover:underline text-xs font-mono truncate flex items-center gap-1"
                            title="View on BscScan"
                          >
                            <span className="truncate">{d.txHash?.slice(0, 10)}...</span>
                            <ExternalLink size={10} className="shrink-0" />
                          </a>
                        </td>
                        <td className="py-2.5 px-3 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                              d.processingMode === "AUTOMATIC"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {d.processingMode === "AUTOMATIC" ? "AUTO" : "MANUAL"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {isCredited && (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 size={12} /> Credited
                            </span>
                          )}
                          {isConfirming && (
                            <span className="text-sky-400 font-bold flex items-center gap-1 text-[11px]">
                              <RotateCcw size={12} className="animate-spin" />
                              {d.confirmations || 0}/{requiredConfirmations}
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 size={12} /> Confirmed
                            </span>
                          )}
                          {isPendingReview && (
                            <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                              <Clock size={12} /> Pending Review
                            </span>
                          )}
                          {isPausedState && (
                            <span className="text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                              <AlertTriangle size={12} /> Queued (Paused)
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                              <XCircle size={12} /> Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
