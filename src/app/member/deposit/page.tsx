import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DepositFormClient from "./DepositFormClient";
import { Wallet, Clock, CheckCircle2, XCircle } from "lucide-react";

export default async function MemberDepositPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch user deposits
  const deposits = await db.depositRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Fetch deposit address from system config (or fallback)
  const depositAddressConfig = await db.systemConfig.findUnique({
    where: { key: "USDT_DEPOSIT_ADDRESS" },
  });
  const depositAddress = depositAddressConfig?.value || "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet size={20} className="text-[#38bdf8]" />
          Deposit USDT &bull; Fund Wallet Top-Up
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Deposit USDT (BEP-20) to your Fund Wallet to activate accounts or register downline partners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Deposit Submission Form Component */}
        <DepositFormClient depositAddress={depositAddress} />

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
