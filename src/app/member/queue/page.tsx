import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES, TIER_VALUES } from "@/lib/constants";
import { GitCommit, ShieldCheck, AlertCircle } from "lucide-react";

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
          Signature Tripod Model &bull; 2:1 Single-Leg Queue
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Universal FIFO queue progression. Each active rank completes when 2 units join below in the international queue.
        </p>
      </div>

      {user.status === "INACTIVE" ? (
        <div className="card-seoralink p-8 text-center space-y-4 border-[#d4af37]/40">
          <AlertCircle size={36} className="mx-auto text-[#d4af37]" />
          <h3 className="text-lg font-bold text-white">Queue Entry Requires $10 Activation</h3>
          <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
            Your account is currently inactive. Activate your $10 USDT Micro-Entry to secure your timestamped queue position.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Tripod Visual Graphic */}
          <div className="card-seoralink p-8 bg-[#0b1120] border-[#d4af37]/40 flex flex-col items-center justify-center relative">
            <div className="absolute top-3 left-3">
              <span className="badge-gold text-[10px]">Deterministic Matching</span>
            </div>

            {/* Top Node (Active Position) */}
            <div className="w-full max-w-[280px] p-4 rounded-xl border-2 border-[#d4af37] bg-[#0d1424] shadow-lg flex flex-col items-center text-center">
              <div className="text-[11px] font-mono-num text-[#94a3b8] uppercase tracking-wider">
                Tier {currentTier} Node
              </div>
              <div className="text-lg font-bold text-white mt-0.5">{tierName}</div>
              <div className="text-sm font-mono-num font-bold text-[#d4af37] mt-1">
                ${tierValue.toLocaleString()} USDT Value
              </div>
              <div className="mt-2 text-[10px] px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-mono-num font-semibold">
                {activeEntry ? `Queue Index #${activeEntry.queueIndex}` : "Promoted"}
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
            <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
              {/* Unit 1 */}
              <div className={`p-3 rounded-lg border text-center flex flex-col items-center ${
                activeEntry && activeEntry.childrenPlaced >= 1
                  ? "border-[#10b981] bg-[#10b981]/10 text-white"
                  : "border-[#1e293b] bg-[#0d1424] text-[#94a3b8]"
              }`}>
                <span className="text-[10px] font-mono-num font-bold text-[#38bdf8]">Child ID 1</span>
                <span className="text-xs font-bold mt-0.5">
                  {activeEntry && activeEntry.childrenPlaced >= 1 ? "Placed (50%)" : "Waiting"}
                </span>
                <span className="text-[9px] text-[#64748b] mt-1">Funds Net Cashout</span>
              </div>

              {/* Unit 2 */}
              <div className={`p-3 rounded-lg border text-center flex flex-col items-center ${
                activeEntry && activeEntry.childrenPlaced >= 2
                  ? "border-[#10b981] bg-[#10b981]/10 text-white"
                  : "border-[#1e293b] bg-[#0d1424] text-[#94a3b8]"
              }`}>
                <span className="text-[10px] font-mono-num font-bold text-[#10b981]">Child ID 2</span>
                <span className="text-xs font-bold mt-0.5">
                  {activeEntry && activeEntry.childrenPlaced >= 2 ? "Placed (100%)" : "Waiting"}
                </span>
                <span className="text-[9px] text-[#64748b] mt-1">Auto-Promotes to T{currentTier + 1}</span>
              </div>
            </div>
          </div>

          {/* Queue Statistics & Details */}
          <div className="space-y-4">
            <div className="card-seoralink p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                Live Queue Advancement Status
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Active Tier:</span>
                  <span className="font-bold text-white font-mono-num">Tier {currentTier} ({tierName})</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Gross Cycle Value:</span>
                  <span className="font-bold text-[#d4af37] font-mono-num">${tierValue.toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Net Member Cashout (80%):</span>
                  <span className="font-bold text-[#10b981] font-mono-num">
                    ${(tierValue * (currentTier === 12 ? 0.9 : 0.8)).toLocaleString()} USDT
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1e293b]">
                  <span className="text-[#94a3b8]">Units Needed to Complete:</span>
                  <span className="font-bold text-[#38bdf8] font-mono-num">{unitsNeeded} Global Units</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#94a3b8]">Total Nodes in Tier Queue:</span>
                  <span className="font-bold text-white font-mono-num">{totalInTier} Units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
