import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES, TIER_VALUES, NET_CASHOUT_VALUES } from "@/lib/constants";
import { GitCommit, ShieldAlert, AlertCircle, ArrowUpRight, Zap, CheckCircle2 } from "lucide-react";

export default async function MemberQueuePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      queueEntries: {
        orderBy: { tier: "asc" },
      },
    },
  });

  if (!user) redirect("/login");

  const activeEntry = user.queueEntries.find((q) => q.status === "WAITING");
  const currentTier = user.currentTier;
  const tierName = TIER_NAMES[currentTier];
  const tierValue = TIER_VALUES[currentTier];
  const netCashout = NET_CASHOUT_VALUES[currentTier];
  const isUltima = currentTier === 12;

  // Count total entries in user's current tier
  const totalInTier = await db.queueEntry.count({
    where: { tier: currentTier },
  });

  // Calculate units needed for active entry to match
  let unitsNeeded = 2;
  if (activeEntry) {
    const requiredTotal = 2 * activeEntry.queueIndex + 3;
    unitsNeeded = Math.max(0, requiredTotal - totalInTier);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitCommit size={20} className="text-[#38bdf8]" />
          Signature Tripod Model &bull; 2:1 Rolling Auto-Upgrade Queue
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Universal FIFO queue progression. 100% of cycle capital rolls forward into the next doubling tier until cashout.
        </p>
      </div>

      {user.status === "BLOCKED" ? (
        <div className="card-seoralink p-8 text-center space-y-4 border-rose-500/40 bg-rose-500/5">
          <ShieldAlert size={42} className="mx-auto text-rose-400" />
          <h3 className="text-lg font-bold text-white">Single-Exit Settlement Executed</h3>
          <p className="text-xs text-[#94a3b8] max-w-xl mx-auto leading-relaxed">
            You have executed an intermediate rank reward cashout (Tier {currentTier} {tierName}). Under the SEORALINK Protocol, an 80% net payout was disbursed, 20% was contributed to the protocol capital reserve, and this ID has been permanently retired. Queue positions and future team overrides are locked.
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono-num font-bold">
            Status: ID Permanently Deactivated (Single-Exit)
          </div>
        </div>
      ) : user.status === "INACTIVE" ? (
        <div className="card-seoralink p-8 text-center space-y-4 border-[#d4af37]/40">
          <AlertCircle size={36} className="mx-auto text-[#d4af37]" />
          <h3 className="text-lg font-bold text-white">Queue Entry Requires $10 Activation</h3>
          <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
            Your account is currently inactive. Activate your $10 USDT Micro-Entry to secure your timestamped queue position.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Tripod Visual Graphic */}
          <div className="card-seoralink p-8 bg-[#0b1120] border-[#d4af37]/40 flex flex-col items-center justify-center relative">
            <div className="absolute top-3 left-3">
              <span className="badge-gold text-[10px]">Deterministic FIFO Matching</span>
            </div>

            {/* Top Node (Active Position) */}
            <div className="w-full max-w-[300px] p-4 rounded-xl border-2 border-[#d4af37] bg-[#0d1424] shadow-lg flex flex-col items-center text-center mt-4">
              <div className="text-[11px] font-mono-num text-[#94a3b8] uppercase tracking-wider">
                Tier {currentTier} Node
              </div>
              <div className="text-lg font-bold text-white mt-0.5">{tierName}</div>
              <div className="text-sm font-mono-num font-bold text-[#d4af37] mt-1">
                ${tierValue.toLocaleString()} USDT Asset
              </div>
              <div className="mt-2 text-[10px] px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-mono-num font-semibold">
                {activeEntry ? `Queue Index #${activeEntry.queueIndex}` : "Cycle Completed"}
              </div>
            </div>

            {/* Connection Lines (SVG) */}
            <div className="w-full max-w-[280px] h-10 flex justify-center items-center my-1">
              <svg viewBox="0 0 200 40" className="w-full h-full stroke-[#38bdf8]/60" fill="none">
                <line x1="100" y1="0" x2="40" y2="40" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="100" y1="0" x2="160" y2="40" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="100" cy="0" r="3" fill="#38bdf8" />
                <circle cx="40" cy="40" r="3" fill="#10b981" />
                <circle cx="160" cy="40" r="3" fill="#10b981" />
              </svg>
            </div>

            {/* Bottom Row: 2 Matching Units */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-[340px]">
              {/* Unit 1 */}
              <div className={`p-3 rounded-lg border text-center flex flex-col items-center ${
                activeEntry && activeEntry.childrenPlaced >= 1
                  ? "border-[#10b981] bg-[#10b981]/10 text-white"
                  : "border-[#1e293b] bg-[#0d1424] text-[#94a3b8]"
              }`}>
                <span className="text-[10px] font-mono-num font-bold text-[#38bdf8]">Child ID 1</span>
                <span className="text-xs font-bold mt-0.5">
                  {activeEntry && activeEntry.childrenPlaced >= 1 ? "Matched (50%)" : "Waiting"}
                </span>
                <span className="text-[9px] text-[#64748b] mt-1">Liquidity Provider Unit</span>
              </div>

              {/* Unit 2 */}
              <div className={`p-3 rounded-lg border text-center flex flex-col items-center ${
                activeEntry && activeEntry.childrenPlaced >= 2
                  ? "border-[#10b981] bg-[#10b981]/10 text-white"
                  : "border-[#1e293b] bg-[#0d1424] text-[#94a3b8]"
              }`}>
                <span className="text-[10px] font-mono-num font-bold text-[#10b981]">Child ID 2</span>
                <span className="text-xs font-bold mt-0.5">
                  {activeEntry && activeEntry.childrenPlaced >= 2 ? "Matched (100%)" : "Waiting"}
                </span>
                <span className="text-[9px] text-[#64748b] mt-1">
                  {isUltima ? "Triggers Ultima Cashout" : `Rolls 100% to T${currentTier + 1}`}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-[#94a3b8] max-w-xs">
              Every 2 global child IDs matched beneath your node doubles the rank asset value and triggers the auto-upgrade roll forward.
            </div>
          </div>

          {/* Queue Statistics & Governance Details */}
          <div className="space-y-4">
            <div className="card-seoralink p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                Live Queue Position & Valuation
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Active Tier:</span>
                  <span className="font-bold text-white font-mono-num">Tier {currentTier} ({tierName})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Rolling Asset Holding:</span>
                  <span className="font-bold text-[#d4af37] font-mono-num">${tierValue.toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Optional Single-Exit Cashout:</span>
                  <span className="font-bold text-[#10b981] font-mono-num">
                    ${netCashout.toLocaleString()} USDT Net {isUltima ? "(10% fee)" : "(20% deduction)"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Global Units Needed to Complete:</span>
                  <span className="font-bold text-[#38bdf8] font-mono-num">{unitsNeeded} Global Units</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#94a3b8]">Total Nodes in Tier Queue:</span>
                  <span className="font-bold text-white font-mono-num">{totalInTier} Nodes</span>
                </div>
              </div>
            </div>

            {/* Protocol Governance Explainer */}
            <div className="card-seoralink p-5 border-[#38bdf8]/20 bg-[#071328]/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8]">
                <Zap size={15} />
                <span>Rolling Auto-Upgrade & Single-Exit Protocol Rules</span>
              </div>
              <ul className="text-[11px] text-[#94a3b8] space-y-2 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-white">Non-Cumulative Holding:</strong> 100% of completed cycle reward rolls directly into Tier {currentTier < 12 ? currentTier + 1 : 12} doubling asset. Prior tier amounts do not accumulate.
                </li>
                <li>
                  <strong className="text-white">Intermediate Cashout (Tier 1-11):</strong> Choosing to cash out disburses 80% Net USDT and permanently retires this ID (20% retained for protocol liquidity).
                </li>
                <li>
                  <strong className="text-white">Pinnacle Ultima (Tier 12):</strong> Completing Tier 12 pays <strong className="text-[#d4af37]">$18,432 USDT Net</strong> (10% fee) and keeps your ID <strong className="text-emerald-400">permanently ACTIVE for life</strong> with unlimited directs and 5% overrides!
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
