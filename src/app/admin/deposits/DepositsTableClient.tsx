'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

interface DepositItem {
  id: string;
  amount: string;
  txHash: string;
  network: string;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  user: {
    customId: string;
    fullName: string;
    email: string;
  };
}

export default function DepositsTableClient({ initialDeposits }: { initialDeposits: DepositItem[] }) {
  const router = useRouter();
  const [deposits, setDeposits] = useState(initialDeposits);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  useEffect(() => {
    setDeposits(initialDeposits);
  }, [initialDeposits]);

  const filteredDeposits = deposits.filter((d) => {
    if (filter === "ALL") return true;
    return d.status === filter;
  });

  const handleApprove = async (id: string) => {
    if (!confirm("Confirm approval of this deposit? Funds will be credited to user's Fund Wallet.")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("already been approved")) {
          setDeposits((prev) =>
            prev.map((d) => (d.id === id ? { ...d, status: "APPROVED" } : d))
          );
        }
        throw new Error(data.error);
      }
      setDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "APPROVED" } : d))
      );
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter reason for rejection (optional):", "Unverified transaction on explorer");
    if (reason === null) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("already been")) {
          setDeposits((prev) =>
            prev.map((d) => (d.id === id ? { ...d, status: "REJECTED" } : d))
          );
        }
        throw new Error(data.error);
      }
      setDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "REJECTED" } : d))
      );
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === tab
                ? "bg-[#d4af37] text-black"
                : "bg-[#0d1424] text-[#94a3b8] hover:text-white border border-[#1e293b]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredDeposits.length === 0 ? (
        <div className="text-center py-12 text-[#94a3b8] text-xs border border-dashed border-[#1e293b] rounded-xl">
          No {filter.toLowerCase()} deposits found.
        </div>
      ) : (
        <div className="overflow-x-auto card-seoralink border-[#1e293b]">
          <table className="w-full text-left font-mono-num text-xs">
            <thead>
              <tr className="border-b border-[#1e293b] text-[#94a3b8] bg-[#0b1120] text-[10px] uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">TxID / Network</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50">
              {filteredDeposits.map((d) => (
                <tr key={d.id} className="hover:bg-[#0f172a]/40">
                  <td className="py-3 px-4 text-[#94a3b8] text-[11px] whitespace-nowrap">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{d.user.fullName}</div>
                    <div className="text-[10px] text-[#d4af37]">{d.user.customId}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#10b981] text-sm">
                    ${parseFloat(d.amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <a
                        href={
                          d.txHash.trim().startsWith("http")
                            ? d.txHash.trim()
                            : `https://bscscan.com/tx/${d.txHash.trim()}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#38bdf8] hover:text-sky-300 hover:underline transition-colors max-w-[210px]"
                        title={`Click to verify ${d.txHash} on BscScan`}
                      >
                        <span className="truncate">{d.txHash}</span>
                        <ExternalLink size={12} className="shrink-0 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                      <a
                        href={
                          d.txHash.trim().startsWith("http")
                            ? d.txHash.trim()
                            : `https://bscscan.com/tx/${d.txHash.trim()}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-400 text-sky-400 hover:text-sky-300 text-[10px] font-bold font-sans transition-all"
                        title="Open directly in BscScan blockchain explorer"
                      >
                        BscScan ↗
                      </a>
                    </div>
                    <div className="text-[10px] text-[#64748b] flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-slate-400 font-semibold">{d.network}</span>
                      {d.adminNote && (
                        <span className="text-[#d4af37] truncate max-w-[180px]" title={d.adminNote}>
                          &bull; {d.adminNote}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4 text-right">
                    {d.status === "PENDING" && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(d.id)}
                          disabled={loadingId === d.id}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-[11px] font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(d.id)}
                          disabled={loadingId === d.id}
                          className="px-2.5 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 rounded text-[11px] font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
