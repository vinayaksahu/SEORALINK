import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS, NET_CASHOUT_VALUES } from "@/lib/constants";
import { ReferralShareCard } from "@/components/ReferralShareCard";
import {
  Wallet,
  ArrowUpRight,
  Users,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Trophy,
  ShieldCheck,
  ShieldAlert,
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

  const fundBal = parseFloat(user.fundBalance?.toString() || "0");
  const commissionBal = parseFloat(user.incomeBalance?.toString() || "0");
  const currentTier = user.currentTier;
  const isUltima = currentTier === 12;
  const isBanned = user.status === "BLOCKED";
  const rankValuation = TIER_VALUES[currentTier];
  const netCashoutVal = NET_CASHOUT_VALUES[currentTier];

  const existingRankWithdrawal = await db.withdrawalRequest.findFirst({
    where: {
      userId: session.userId,
      adminNote: { contains: "CASHOUT" },
      status: { not: "REJECTED" },
    },
  });
  const hasWithdrawnRankPool = Boolean(existingRankWithdrawal);
  const rankPoolBalance = (user.status === "ACTIVE" && !hasWithdrawnRankPool) ? rankValuation : 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seoralink.com";
  const referralLink = `${appUrl}/register?ref=${user.customId}`;

  return (
    <div className="space-y-8">
      {/* Account Banned / Single-Exit Warning */}
      {isBanned && (
        <div className="p-4 rounded-xl border border-red-500/60 bg-red-500/10 flex items-start sm:items-center gap-3">
          <ShieldAlert size={28} className="text-red-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-bold text-red-400">Account Permanently Deactivated (Single-Exit Executed)</div>
            <div className="text-xs text-[#cbd5e1] mt-0.5">
              An intermediate rank reward cashout was initiated. As per protocol rules, this ID is permanently closed, forfeiting all future queue advancements, direct commissions, and team overrides. It cannot be reactivated.
            </div>
          </div>
        </div>
      )}

      {/* Ultima VIP Celebration Banner */}
      {isUltima && !isBanned && (
        <div className="p-5 rounded-xl border-2 border-[#10b981] bg-[#10b981]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-3">
            <Trophy size={32} className="text-[#10b981] flex-shrink-0" />
            <div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-[#10b981]">★</span> Ultima VIP &bull; Lifetime Active Status Unlocked
              </div>
              <div className="text-xs text-[#cbd5e1] mt-0.5">
                You have reached the pinnacle Rank 12 (Ultima)! Your ID has completed the rank queue and permanently maintains active standing to sponsor unlimited direct members ($0.50) and earn continuous 5% team mentorship overrides for life.
              </div>
            </div>
          </div>
          <Link
            href="/member/withdraw"
            className="px-5 py-2.5 rounded-lg bg-[#10b981] text-black font-extrabold text-xs whitespace-nowrap hover:bg-[#10b981]/90 transition-all flex items-center gap-1.5 shadow-lg"
          >
            Cashout Ultima ($18,432 Net) &rarr;
          </Link>
        </div>
      )}

      {/* Account Inactive Notice */}
      {user.status === "INACTIVE" && (
        <div className="p-4 rounded-xl border border-[#d4af37]/50 bg-[#d4af37]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-[#d4af37] flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">Account Not Activated</div>
              <div className="text-xs text-[#cbd5e1] mt-0.5">
                Activate your $10 USDT Micro-Entry to enter the global single-leg queue and start earning rank rewards and mentorship commissions.
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
        {/* Commission Wallet */}
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#10b981]/30">
          <div className="flex items-center justify-between text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Commission Wallet</span>
            <ArrowUpRight size={16} className="text-[#10b981]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-[#10b981] my-2">
            ${commissionBal.toFixed(2)}
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#94a3b8]">
            <span>10% Fee &bull; ID Stays Active</span>
            <Link href="/member/withdraw" className="text-[#10b981] font-bold hover:underline">
              Withdraw &rarr;
            </Link>
          </div>
        </div>

        {/* Rank Pool Wallet */}
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#d4af37]/40">
          <div className="flex items-center justify-between text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Rank Pool Wallet</span>
            <Trophy size={16} className="text-[#d4af37]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-[#d4af37] my-2">
            ${rankPoolBalance.toLocaleString()}
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#94a3b8]">
            <span>
              {hasWithdrawnRankPool
                ? "Claimed (Single-Exit)"
                : `Tier ${currentTier} (${TIER_NAMES[currentTier]})`}
            </span>
            <Link href="/member/withdraw" className="text-[#d4af37] font-bold hover:underline">
              {hasWithdrawnRankPool ? "History &rarr;" : "Cashout &rarr;"}
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

        {/* Direct Referrals */}
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#a855f7]/30">
          <div className="flex items-center justify-between text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Direct Referrals</span>
            <Users size={16} className="text-[#a855f7]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-white my-2">
            {user.directCount} <span className="text-xs text-[#94a3b8] font-normal">/ 6 Directs</span>
          </div>
          <div className="text-[10px] text-[#94a3b8]">
            {user.directCount >= 6 ? "All 12 Tiers Unlocked" : `${6 - user.directCount} more to unlock all tiers`}
          </div>
        </div>
      </div>

      {/* Referral Link Quick Share Card (Disabled if Banned) */}
      {!isBanned ? (
        <ReferralShareCard referralLink={referralLink} />
      ) : (
        <div className="card-seoralink p-4 border border-red-500/30 bg-red-500/5 text-center text-xs text-[#94a3b8]">
          Referral link disabled for deactivated accounts.
        </div>
      )}

      {/* 12-Tier Ladder Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#d4af37] rounded-full inline-block"></span>
              The 12-Rank Doubling Ladder (Rolling Auto-Upgrade)
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Holding rewards rolls 100% forward into the next doubling tier &bull; Peak Net Cashout: <strong>$18,432.00 USDT (Ultima)</strong>
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
            const netCashout = NET_CASHOUT_VALUES[idx];
            const isUltimaTier = idx === 12;

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
                    {isCompleted && <span className="text-[#10b981] font-bold">&check; Passed</span>}
                    {isCurrent && <span className="badge-gold text-[9px]">Active</span>}
                    {isLocked && <span className="text-[#64748b]">Locked</span>}
                  </div>
                  <div className="text-sm font-bold text-white mt-1 flex items-center gap-1">
                    {isUltimaTier && <span className="text-[#10b981]">★</span>}
                    {name}
                  </div>
                  <div className="text-xs font-mono-num font-bold text-[#d4af37] mt-0.5">
                    ${TIER_VALUES[idx].toLocaleString()} <span className="text-[9px] text-[#94a3b8] font-normal">Holding</span>
                  </div>
                  <div className="text-[10px] font-mono-num text-[#10b981] font-semibold mt-0.5">
                    Net: ${netCashout.toLocaleString()}
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
