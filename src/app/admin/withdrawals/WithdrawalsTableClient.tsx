'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Copy, ExternalLink, Check } from "lucide-react";

interface WithdrawalItem {
  id: string;
  amount: string;
  feePercent: string;
  feeAmount: string;
  netAmount: string;
  toAddress: string;
  network: string;
  txHash: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  user: {
    customId: string;
    fullName: string;
    email: string;
    status: string;
    currentTier: number;
  };
}

export default function WithdrawalsTableClient({ initialWithdrawals }: { initialWithdrawals: WithdrawalItem[] }) {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  useEffect(() => {
    setWithdrawals(initialWithdrawals);
  }, [initialWithdrawals]);

  const filtered = withdrawals.filter((w) => {
    if (filter === "ALL") return true;
    return w.status === filter;
  });

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (id: string) => {
    const txHash = prompt("Enter blockchain payout Transaction Hash (optional):", "");
    if (txHash === null) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: txHash.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("already been")) {
          setWithdrawals((prev) =>
            prev.map((w) => (w.id === id ? { ...w, status: "APPROVED" } : w))
          );
        }
        throw new Error(data.error);
      }
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: "APPROVED" } : w))
      );
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter reason for rejection (funds will be refunded to user):", "Invalid wallet address");
    if (reason === null) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("already been")) {
          setWithdrawals((prev) =>
            prev.map((w) => (w.id === id ? { ...w, status: "REJECTED" } : w))
          );
        }
        throw new Error(data.error);
      }
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: "REJECTED" } : w))
      );
      alert(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === tab
                ? "bg-red-500 text-white"
                : "bg-[#0d1424] text-[#94a3b8] hover:text-white border border-[#1e293b]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#94a3b8] text-xs border border-dashed border-[#1e293b] rounded-xl">
          No {filter.toLowerCase()} withdrawal requests found.
        </div>
      ) : (
        <div className="overflow-x-auto card-seoralink border-[#1e293b]">
          <table className="w-full text-left font-mono-num text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] text-[#94a3b8] bg-[#0b1120] text-[10px] uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Fee / Deduction</th>
                <th className="py-3 px-4">Destination Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50">
              {filtered.map((w) => {
                const isRankExit = w.adminNote?.includes("[RANK_EXIT_CASHOUT") || parseFloat(w.feePercent) === 20;
                const isUltimaExit = w.adminNote?.includes("[ULTIMA_APEX_CASHOUT");
                const isCommission = !isRankExit && !isUltimaExit;

                return (
                  <tr key={w.id} className="hover:bg-[#0f172a]/40">
                    <td className="py-3 px-4 text-[#94a3b8] text-[11px] whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{w.user.fullName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#d4af37]">{w.user.customId}</span>
                        {w.user.status === "BLOCKED" && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/30">
                            BANNED (EXIT)
                          </span>
                        )}
                        {w.user.status === "ACTIVE" && w.user.currentTier === 12 && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[#d4af37] text-[9px] font-bold border border-amber-500/30">
                            ULTIMA VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isRankExit && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          Rank Exit (20%)
                        </span>
                      )}
                      {isUltimaExit && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                          Ultima Apex (10%)
                        </span>
                      )}
                      {isCommission && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Commission (10%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#10b981] text-sm">
                      ${parseFloat(w.netAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-red-400">
                      -${parseFloat(w.feeAmount).toFixed(2)} ({parseFloat(w.feePercent)}%)
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#38bdf8]">
                        <span className="truncate max-w-[130px]">{w.toAddress}</span>
                        <button
                          onClick={() => handleCopy(w.toAddress, w.id)}
                          className="text-[#94a3b8] hover:text-white"
                        >
                          {copiedId === w.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="text-[10px] text-[#64748b]">{w.network}</div>
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-right">
                      {w.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(w.id)}
                            disabled={loadingId === w.id}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-[11px] font-bold"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleReject(w.id)}
                            disabled={loadingId === w.id}
                            className="px-2.5 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 rounded text-[11px] font-bold"
                          >
                            Reject & Refund
                          </button>
                        </div>
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
  );
}
