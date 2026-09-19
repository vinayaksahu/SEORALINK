import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS, NET_CASHOUT_VALUES } from "@/lib/constants";
import { checkPendingRankPromotions } from "@/lib/queueEngine";
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

  // Automatically check and promote if directs qualification is satisfied
  await checkPendingRankPromotions(session.userId);

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
  const rankValuation = TIER_VALUES[currentTier];
  const netCashoutVal = NET_CASHOUT_VALUES[currentTier];

  const existingRankWithdrawal = await db.withdrawalRequest.findFirst({
    where: {
      userId: session.userId,
      OR: [
        { feePercent: 20 },
        { adminNote: { contains: "CASHOUT" } },
        { adminNote: { contains: "RANK_EXIT" } },
        { amount: 20480 },
      ],
      status: { not: "REJECTED" },
    },
  });
  const hasWithdrawnRankPool = Boolean(existingRankWithdrawal);
  const isBanned = user.status === "BLOCKED" && !hasWithdrawnRankPool;
  const rankPoolBalance = (user.status === "ACTIVE" && !hasWithdrawnRankPool && currentTier > 0) ? rankValuation : 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seoralink.com";
  const referralLink = `${appUrl}/register?ref=${user.customId}`;

  return (
    <div className="space-y-8">
      {/* Single-Exit Settlement Notice */}
      {hasWithdrawnRankPool && (
        <div className="p-5 rounded-xl border-2 border-purple-500/60 bg-purple-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 size={30} className="text-purple-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-purple-300">System Exited &bull; Single-Exit Protocol Finalized</div>
              <div className="text-xs text-[#cbd5e1] mt-0.5 leading-relaxed">
                Your account has concluded its Single-Exit settlement. Under protocol rules, this ID is permanently retired: <strong>deposits</strong>, <strong>withdrawals</strong>, and <strong>referring new downline members</strong> are disabled.
              </div>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
            ID Retired (Single-Exit)
          </span>
        </div>
      )}

      {/* Account Blocked by Administration (with Contact Support option) */}
      {isBanned && (
        <div className="p-5 rounded-xl border-2 border-rose-500/60 bg-rose-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldAlert size={32} className="text-rose-400 flex-shrink-0" />
            <div>
              <div className="text-base font-bold text-rose-400">Account Blocked by Administration</div>
              <div className="text-xs text-[#cbd5e1] mt-1 leading-relaxed">
                Your account has been administratively blocked. Please reach out to customer support to resolve this issue and restore your account access.
              </div>
            </div>
          </div>
          <Link
            href="/member/support"
            className="px-4 py-2 rounded-lg bg-rose-600 text-white font-extrabold text-xs whitespace-nowrap hover:bg-rose-500 transition-all flex items-center gap-1.5 shadow"
          >
            Contact Support &rarr;
          </Link>
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

      {/* USDT Address Missing Setup Notice */}
      {!user.usdtAddress && (
        <div className="p-4 rounded-xl border border-[#38bdf8]/40 bg-[#38bdf8]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <Wallet size={22} className="text-[#38bdf8] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Setup Your USDT Withdrawal Wallet</div>
              <div className="text-[11px] text-[#cbd5e1] mt-0.5">
                Add your USDT BEP-20 payout address in your profile to enable fast Commission Wallet &amp; Rank Pool payouts.
              </div>
            </div>
          </div>
          <Link
            href="/member/profile"
            className="px-4 py-1.5 rounded-lg bg-[#38bdf8] text-black font-extrabold text-xs whitespace-nowrap hover:bg-[#38bdf8]/90 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            Setup Wallet &rarr;
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
            {user.status !== "ACTIVE" ? (
              <Link href="/member/deposit" className="text-[#38bdf8] font-bold hover:underline">
                Deposit &rarr;
              </Link>
            ) : (
              <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Activated
              </span>
            )}
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

      {/* Referral Link Quick Share Card (Disabled if Banned or System Exited) */}
      {!isBanned && !hasWithdrawnRankPool ? (
        <ReferralShareCard referralLink={referralLink} />
      ) : (
        <div className="card-seoralink p-4 border border-purple-500/40 bg-purple-500/5 text-center text-xs text-[#cbd5e1]">
          {hasWithdrawnRankPool
            ? "Referral program permanently disabled: This account has exited the network under the Single-Exit protocol."
            : "Referral link disabled for deactivated accounts."}
        </div>
      )}

      {/* 12-Tier Ladder Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#d4af37] rounded-full inline-block"></span>
              The 12-Rank Doubling Ladder (Rolling Auto-Upgrade)
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Holding rewards rolls 100% forward into the next doubling tier &bull; Peak Net Cashout: <strong>$18,432.00 USDT (Ultima)</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Color Legend */}
            <div className="flex items-center gap-2 text-[10px] font-bold bg-[#0b1120] border border-[#1e293b] px-2.5 py-1 rounded-lg">
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                Passed
              </span>
              <span className="text-[#334155]">&bull;</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Current
              </span>
              <span className="text-[#334155]">&bull;</span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400/80"></span>
                Upcoming
              </span>
            </div>
            <Link href="/member/queue" className="text-xs font-bold text-[#38bdf8] hover:underline flex items-center gap-1">
              Tripod Visualizer &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {TIER_NAMES.map((name, idx) => {
            const isCompleted = idx < user.currentTier;
            const isCurrent = idx === user.currentTier;
            const isLocked = idx > user.currentTier;
            const directsReq = REQUIRED_DIRECTS[idx];
            const netCashout = NET_CASHOUT_VALUES[idx];
            const isUltimaTier = idx === 12;
            const isDirectsMet = user.directCount >= directsReq;
            const waitingQueueEntry = user.queueEntries.find((q) => q.tier === idx && q.status === "WAITING");

            return (
              <div
                key={name}
                className={`card-seoralink p-4 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "border-2 border-emerald-500 bg-emerald-950/25 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02] z-10"
                    : isCompleted
                    ? "border border-red-500/35 hover:border-red-500/55 bg-red-950/20 shadow-sm"
                    : "border border-amber-500/25 hover:border-amber-500/45 bg-amber-950/10 opacity-90"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono-num">
                    <span
                      className={
                        isCurrent
                          ? "text-emerald-400 font-bold"
                          : isCompleted
                          ? "text-red-400/80"
                          : "text-amber-400/70"
                      }
                    >
                      T{idx}
                    </span>
                    {isCompleted && (
                      <span className="text-red-400 bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-1">
                        ✓ Passed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                        ACTIVE
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-amber-400/75 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded text-[9px] font-medium">
                        Locked
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-sm font-bold mt-1 flex items-center gap-1 ${
                      isCurrent
                        ? "text-white font-black text-base"
                        : isCompleted
                        ? "text-slate-200"
                        : "text-slate-300 font-bold"
                    }`}
                  >
                    {isUltimaTier && <span className={isCurrent ? "text-emerald-400" : isCompleted ? "text-red-400" : "text-amber-400"}>★</span>}
                    {name}
                  </div>
                  <div
                    className={`text-xs font-mono-num font-bold mt-0.5 ${
                      isCurrent
                        ? "text-emerald-300"
                        : isCompleted
                        ? "text-red-300/85"
                        : "text-amber-300/85"
                    }`}
                  >
                    ${TIER_VALUES[idx].toLocaleString()}{" "}
                    <span
                      className={`text-[9px] font-normal ${
                        isCurrent
                          ? "text-emerald-400/70"
                          : isCompleted
                          ? "text-red-400/60"
                          : "text-amber-400/60"
                      }`}
                    >
                      Holding
                    </span>
                  </div>
                  <div
                    className={`text-[10px] font-mono-num font-semibold mt-0.5 ${
                      isCurrent
                        ? "text-emerald-400 font-bold"
                        : isCompleted
                        ? "text-red-400/90"
                        : "text-amber-400/70"
                    }`}
                  >
                    Net: ${netCashout.toLocaleString()}
                  </div>

                  {isCurrent && waitingQueueEntry && (
                    <div className="mt-2 py-1 px-2 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9.5px] text-emerald-300 font-bold flex items-center justify-between">
                      <span>Tripod Match:</span>
                      <span>{waitingQueueEntry.childrenPlaced}/2 Units</span>
                    </div>
                  )}
                </div>

                <div
                  className={`mt-3 pt-2 border-t text-[10px] ${
                    isCurrent
                      ? "border-emerald-500/30"
                      : isCompleted
                      ? "border-red-500/20 text-red-300/80"
                      : "border-amber-500/20 text-amber-400/75"
                  }`}
                >
                  {isCompleted ? (
                    <div className="flex items-center justify-between text-red-300/80">
                      <span className="font-semibold flex items-center gap-1">✓ Completed</span>
                      <span className="font-mono-num text-[9.5px]">{directsReq} Directs</span>
                    </div>
                  ) : directsReq === 0 ? (
                    <div
                      className={`flex items-center justify-between ${
                        isCurrent ? "text-emerald-300" : "text-amber-400/70"
                      }`}
                    >
                      <span>Requirement:</span>
                      <span className="font-bold">0 Directs</span>
                    </div>
                  ) : isDirectsMet ? (
                    <div
                      className={`flex items-center justify-between ${
                        isCurrent ? "text-emerald-400" : "text-amber-400/90"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Qualified
                      </span>
                      <span className="font-mono-num font-bold">
                        {user.directCount}/{directsReq} Directs
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          isCurrent
                            ? "text-amber-400 font-semibold"
                            : "text-amber-400/80 font-medium"
                        }
                      >
                        {directsReq - user.directCount} more needed
                      </span>
                      <span className="opacity-80 font-mono-num">
                        {user.directCount}/{directsReq}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
