import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS, CUMULATIVE_REWARDS } from "@/lib/constants";
import {
  Wallet,
  ArrowUpRight,
  Users,
  Zap,
  CheckCircle2,
  Copy,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Trophy,
} from "lucide-react";

export default async function MemberDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      queueEntries: {
        orderBy: { tier: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const fundBal = parseFloat(user.fundBalance.toString());
  const incomeBal = parseFloat(user.incomeBalance.toString());
  const totalEarned = parseFloat(user.totalEarned.toString());
  const totalWithdrawn = parseFloat(user.totalWithdrawn.toString());

  // Current queue status
  const activeQueueEntry = user.queueEntries.find((q) => q.status === "WAITING");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seoralink.com";
  const referralLink = `${appUrl}/register?ref=${user.customId}`;

  return (
    <div className="space-y-8">
      {/* Account Inactive Notice */}
      {user.status === "INACTIVE" && (
        <div className="p-4 rounded-xl border border-[#d4af37]/50 bg-[#d4af37]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-[#d4af37] flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">Account Not Activated</div>
              <div className="text-xs text-[#cbd5e1] mt-0.5">
                Activate your $10 USDT Micro-Entry to enter the global single-leg queue and start earning rank rewards.
              </div>
            </div>
          </div>
          <Link
            href="/member/activate"
            className="btn-primary px-5 py-2 text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5"
          >
            Activate Now ($10) <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Wallet */}
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#10b981]/30">
          <div className="flex items-center justify-between text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Income Wallet</span>
            <ArrowUpRight size={16} className="text-[#10b981]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-[#10b981] my-2">
            ${incomeBal.toFixed(2)}
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#94a3b8]">
            <span>Withdrawable Cash</span>
            <Link href="/member/withdraw" className="text-[#10b981] font-bold hover:underline">
              Withdraw &rarr;
            </Link>
          </div>
        </div>

        {/* Fund Wallet */}
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#38bdf8]/30">
          <div className="flex items-center justify-between text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Fund Wallet</span>
            <Wallet size={16} className="text-[#38bdf8]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-[#38bdf8] my-2">
            ${fundBal.toFixed(2)}
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#94a3b8]">
            <span>For Node Activations</span>
            <Link href="/member/deposit" className="text-[#38bdf8] font-bold hover:underline">
              Deposit &rarr;
            </Link>
          </div>
        </div>

        {/* Active Directs */}
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#a855f7]/30">
          <div className="flex items-center justify-between text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Direct Referrals</span>
            <Users size={16} className="text-[#a855f7]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-white my-2">
            {user.directCount} <span className="text-xs text-[#94a3b8] font-normal">/ 6 Directs</span>
          </div>
          <div className="text-[10px] text-[#94a3b8]">
            {user.directCount >= 6 ? "All 12 Tiers Unlocked" : `${6 - user.directCount} more for complete unlock`}
          </div>
        </div>

        {/* Active Rank */}
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#d4af37]/30">
          <div className="flex items-center justify-between text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Current Rank</span>
            <Trophy size={16} className="text-[#d4af37]" />
          </div>
          <div className="text-2xl font-mono-num font-bold text-[#d4af37] my-2">
            Tier {user.currentTier} &bull; {TIER_NAMES[user.currentTier]}
          </div>
          <div className="text-[10px] text-[#94a3b8]">
            Value: ${TIER_VALUES[user.currentTier].toLocaleString()} USDT
          </div>
        </div>
      </div>

      {/* Referral Link Quick Share Card */}
      <div className="card-seoralink p-5 bg-[#0d1424] border-[#d4af37]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            Your Personal Sponsorship Referral Link
          </div>
          <p className="text-xs text-[#94a3b8]">
            Share with partners to earn 5% ($0.50) instant direct cash and recurring 5% overrides on every mentee rank upgrade.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="bg-[#0b1120] border border-[#d4af37]/30 text-white font-mono-num text-xs px-3.5 py-2 rounded-lg w-full md:w-72 focus:outline-none"
          />
          <button
            onClick={() => {
              if (typeof navigator !== "undefined") {
                navigator.clipboard.writeText(referralLink);
                alert("Referral link copied to clipboard!");
              }
            }}
            className="btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      </div>

      {/* 12-Tier Ladder Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#d4af37] rounded-full inline-block"></span>
              The 12-Rank Doubling Ladder Progress
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Cumulative potential earnings: $40,950 USDT &bull; 2:1 Tripod Single-Leg Engine
            </p>
          </div>
          <Link href="/member/queue" className="text-xs font-bold text-[#38bdf8] hover:underline flex items-center gap-1">
            Tripod Visualizer &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {TIER_NAMES.map((name, idx) => {
            const isCompleted = idx < user.currentTier;
            const isCurrent = idx === user.currentTier;
            const isLocked = idx > user.currentTier;
            const directsReq = REQUIRED_DIRECTS[idx];

            return (
              <div
                key={name}
                className={`card-seoralink p-4 flex flex-col justify-between ${
                  isCurrent
                    ? "border-2 border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                    : isCompleted
                    ? "border-[#10b981]/40 bg-[#10b981]/5"
                    : "border-[#1e293b]/50 opacity-60"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono-num">
                    <span className="text-[#94a3b8]">T{idx}</span>
                    {isCompleted && <span className="text-[#10b981] font-bold">&check; Done</span>}
                    {isCurrent && <span className="badge-gold text-[9px]">Active</span>}
                    {isLocked && <span className="text-[#64748b]">Locked</span>}
                  </div>
                  <div className="text-sm font-bold text-white mt-1">{name}</div>
                  <div className="text-xs font-mono-num font-bold text-[#d4af37] mt-0.5">
                    ${TIER_VALUES[idx].toLocaleString()}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1e293b]/60 text-[10px] text-[#94a3b8]">
                  Req: {directsReq} Directs
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
