import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import WithdrawFormClient from "./WithdrawFormClient";
import { ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";

export default async function MemberWithdrawPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) redirect("/login");

  const withdrawals = await db.withdrawalRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const incomeBal = parseFloat(user.incomeBalance.toString());

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ArrowUpRight size={20} className="text-[#10b981]" />
          Withdrawal Request &bull; Income Wallet Cashout
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Withdraw accumulated rank payouts and mentorship overrides directly to your external USDT wallet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Withdrawal Form */}
        <WithdrawFormClient
          incomeBalance={incomeBal}
          currentTier={user.currentTier}
          savedAddress={user.usdtAddress || ""}
        />

        {/* Withdrawal History Table */}
        <div className="card-seoralink p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-[#d4af37]" />
            Your Recent Withdrawal Requests
          </h3>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-[#94a3b8] text-xs border border-dashed border-[#1e293b] rounded-xl">
              No withdrawal requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-num text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#94a3b8] text-[10px] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Net Payout</th>
                    <th className="py-2.5 px-3">Fee</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-[#0f172a]/30">
                      <td className="py-2.5 px-3 text-[#94a3b8] text-[11px]">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#10b981]">
                        ${parseFloat(w.netAmount.toString()).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-red-400">
                        -${parseFloat(w.feeAmount.toString()).toFixed(2)} ({parseFloat(w.feePercent.toString())}%)
                      </td>
                      <td className="py-2.5 px-3">
                        {w.status === "APPROVED" && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 size={12} /> Paid
                          </span>
                        )}
                        {w.status === "PENDING" && (
                          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {w.status === "REJECTED" && (
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
