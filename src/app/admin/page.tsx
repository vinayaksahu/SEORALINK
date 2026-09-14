import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Users,
  Wallet,
  ArrowUpRight,
  GitCommit,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  // Aggregate stats
  const totalUsers = await db.user.count();
  const activeUsers = await db.user.count({ where: { status: "ACTIVE" } });
  
  const pendingDeposits = await db.depositRequest.count({ where: { status: "PENDING" } });
  const approvedDeposits = await db.depositRequest.aggregate({
    where: { status: "APPROVED" },
    _sum: { amount: true },
  });

  const pendingWithdrawals = await db.withdrawalRequest.count({ where: { status: "PENDING" } });
  const processedWithdrawals = await db.withdrawalRequest.aggregate({
    where: { status: "APPROVED" },
    _sum: { amount: true, feeAmount: true, netAmount: true },
  });

  const totalDepositVolume = parseFloat(approvedDeposits._sum.amount?.toString() || "0");
  const totalWithdrawalVolume = parseFloat(processedWithdrawals._sum.netAmount?.toString() || "0");
  const totalReserveCollected = parseFloat(processedWithdrawals._sum.feeAmount?.toString() || "0");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert size={20} className="text-red-400" />
          Enterprise Telemetry &bull; Executive Command
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          High-level operational overview across platform liquidity, active nodes, and queue dynamics.
        </p>
      </div>

      {/* Pending Action Alerts */}
      {(pendingDeposits > 0 || pendingWithdrawals > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingDeposits > 0 && (
            <Link
              href="/admin/deposits"
              className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between hover:bg-amber-500/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Pending Deposits</div>
                  <div className="text-[11px] text-amber-300">{pendingDeposits} requests awaiting verification</div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400">&rarr; Review</span>
            </Link>
          )}

          {pendingWithdrawals > 0 && (
            <Link
              href="/admin/withdrawals"
              className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 flex items-center justify-between hover:bg-red-500/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-400" />
                <div>
                  <div className="text-xs font-bold text-white">Pending Withdrawals</div>
                  <div className="text-[11px] text-red-300">{pendingWithdrawals} requests awaiting payout</div>
                </div>
              </div>
              <span className="text-xs font-bold text-red-400">&rarr; Process</span>
            </Link>
          )}
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="card-seoralink p-5 border-[#38bdf8]/30">
          <div className="flex justify-between items-center text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Total Members</span>
            <Users size={16} className="text-[#38bdf8]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-white my-2">
            {totalUsers}
          </div>
          <div className="text-[10px] text-emerald-400">
            {activeUsers} Active ($10 Node Activated)
          </div>
        </div>

        {/* Deposit Volume */}
        <div className="card-seoralink p-5 border-[#10b981]/30">
          <div className="flex justify-between items-center text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Deposits Approved</span>
            <Wallet size={16} className="text-[#10b981]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-[#10b981] my-2">
            ${totalDepositVolume.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#94a3b8]">
            Credited to Member Fund Wallets
          </div>
        </div>

        {/* Withdrawal Volume */}
        <div className="card-seoralink p-5 border-[#a855f7]/30">
          <div className="flex justify-between items-center text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Withdrawals Paid</span>
            <ArrowUpRight size={16} className="text-[#a855f7]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-[#a855f7] my-2">
            ${totalWithdrawalVolume.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#94a3b8]">
            Net Member Payouts Distributed
          </div>
        </div>

        {/* Protocol Reserve Fund */}
        <div className="card-seoralink p-5 border-[#d4af37]/30">
          <div className="flex justify-between items-center text-xs font-mono-num uppercase text-[#94a3b8]">
            <span>Protocol Reserve</span>
            <CheckCircle2 size={16} className="text-[#d4af37]" />
          </div>
          <div className="text-3xl font-mono-num font-bold text-[#d4af37] my-2">
            ${totalReserveCollected.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#94a3b8]">
            Accumulated 20% & 10% Reserve Deductions
          </div>
        </div>
      </div>
    </div>
  );
}
