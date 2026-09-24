'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  RotateCcw,
  AlertTriangle,
  Info,
  Check,
} from "lucide-react";

interface DepositItem {
  id: string;
  amount: string;
  amountInUsdt?: string;
  txHash: string;
  network: string;
  tokenContract?: string | null;
  fromAddress?: string | null;
  toAddress?: string | null;
  blockNumber?: string | null;
  confirmations?: number;
  processingMode?: string;
  status: string;
  adminNote?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  user: {
    customId: string;
    fullName: string;
    email: string;
    adminId?: string | null;
  };
}

export default function DepositsTableClient({ initialDeposits }: { initialDeposits: DepositItem[] }) {
  const router = useRouter();
  const [deposits, setDeposits] = useState(initialDeposits);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");
  const [verifyReport, setVerifyReport] = useState<{ id: string; data: any } | null>(null);

  useEffect(() => {
    setDeposits(initialDeposits);
  }, [initialDeposits]);

  const filteredDeposits = deposits.filter((d) => {
    const status = d.status.toUpperCase();
    if (filter === "PENDING") {
      if (status !== "PENDING" && status !== "PENDING_REVIEW" && status !== "CONFIRMING") return false;
    } else if (filter === "APPROVED") {
      if (status !== "APPROVED" && status !== "CREDITED") return false;
    } else if (filter === "REJECTED") {
      if (status !== "REJECTED" && status !== "FAILED") return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchHash = d.txHash?.toLowerCase().includes(q);
      const matchId = d.user?.customId?.toLowerCase().includes(q);
      const matchName = d.user?.fullName?.toLowerCase().includes(q);
      const matchEmail = d.user?.email?.toLowerCase().includes(q);
      return matchHash || matchId || matchName || matchEmail;
    }

    return true;
  });

  const handleApprove = async (id: string) => {
    if (!confirm("Confirm approval of this deposit? Funds will be atomically credited to user's Fund Wallet.")) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/crypto-deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "APPROVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      setDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "APPROVED" } : d))
      );
      alert(data.message || "Deposit successfully approved and credited!");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter reason for rejection:", "Invalid transaction or unverified on BNB Smart Chain");
    if (reason === null) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/crypto-deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "REJECT", rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "REJECTED", rejectionReason: reason } : d))
      );
      alert(data.message || "Deposit rejected.");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReVerify = async (id: string) => {
    setLoadingId(id);
    setVerifyReport(null);
    try {
      const res = await fetch("/api/admin/crypto-deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "RE_VERIFY" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setVerifyReport({ id, data: data.verification });
    } catch (err: any) {
      alert(`Verification check error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === tab
                  ? "bg-[#38bdf8] text-[#0b1120]"
                  : "bg-[#0b1325] text-[#94a3b8] hover:text-white border border-[#1e293b]"
              }`}
            >
              {tab === "PENDING" ? "PENDING REVIEW" : tab}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Member ID, Name, TxID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0b1325] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8]"
          />
        </div>
      </div>

      {/* On-Chain Re-Verification Modal / Banner */}
      {verifyReport && (
        <div className="p-4 rounded-xl border border-sky-500/40 bg-sky-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <ShieldCheck size={16} /> Live On-Chain Verification Report (BNB Smart Chain)
            </span>
            <button
              onClick={() => setVerifyReport(null)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-num text-slate-300">
            <div>
              <span className="text-slate-500 block text-[9px]">Status:</span>
              <span className={verifyReport.data?.valid ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {verifyReport.data?.valid ? "VALID & CONFIRMED" : "UNVERIFIED / INVALID"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Confirmations:</span>
              <span className="text-white font-bold">{verifyReport.data?.confirmations ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Verified Amount:</span>
              <span className="text-emerald-300 font-bold">${verifyReport.data?.amountInUsdt ?? "0.00"} USDT</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">Sender Address:</span>
              <span className="text-[#38bdf8] truncate block" title={verifyReport.data?.fromAddress}>
                {verifyReport.data?.fromAddress?.slice(0, 10)}...
              </span>
            </div>
          </div>
          {verifyReport.data?.error && (
            <p className="text-xs text-red-400 mt-1">{verifyReport.data.error}</p>
          )}
        </div>
      )}

      {/* Deposits Table */}
      <div className="card-seoralink overflow-hidden border border-[#1e293b]">
        {filteredDeposits.length === 0 ? (
          <div className="text-center py-14 text-[#94a3b8] text-xs">
            No deposits matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-num">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#070e1b] text-[#94a3b8] text-[10px] uppercase">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">TxID / Explorer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {filteredDeposits.map((d) => {
                  const status = d.status.toUpperCase();
                  const isPending = status === "PENDING" || status === "PENDING_REVIEW";
                  const isApproved = status === "APPROVED" || status === "CREDITED";
                  const isRejected = status === "REJECTED" || status === "FAILED";
                  const isConfirming = status === "CONFIRMING";
                  const isPaused = status === "CREDIT_PENDING_PAUSED";
                  const amount = d.amountInUsdt || d.amount || "0";

                  return (
                    <tr key={d.id} className="hover:bg-[#0f172a]/40 transition-colors">
                      <td className="py-3 px-4 text-[#94a3b8] text-[11px] whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString()}{" "}
                        <span className="text-[10px] text-slate-500">
                          {new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{d.user?.fullName}</div>
                        <div className="text-[11px] text-[#d4af37] font-mono">{d.user?.customId}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-white">${parseFloat(amount).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">USDT BEP-20</span>
                      </td>

                      <td className="py-3 px-4 text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold ${
                            d.processingMode === "AUTOMATIC"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {d.processingMode === "AUTOMATIC" ? "AUTO" : "MANUAL"}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-[170px]">
                        <a
                          href={`https://bscscan.com/tx/${d.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#38bdf8] hover:text-sky-300 hover:underline font-mono text-[11px] flex items-center gap-1 truncate"
                          title={d.txHash}
                        >
                          <span className="truncate">{d.txHash.slice(0, 10)}...</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                        {d.blockNumber && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Block #{d.blockNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isApproved && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 size={13} /> {status === "CREDITED" ? "Auto-Credited" : "Approved"}
                          </span>
                        )}
                        {isPending && (
                          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                            <Clock size={13} /> Pending Review
                          </span>
                        )}
                        {isConfirming && (
                          <span className="text-sky-400 font-bold flex items-center gap-1 text-[11px]">
                            <RotateCcw size={13} className="animate-spin" /> Confirming ({d.confirmations || 0}/3)
                          </span>
                        )}
                        {isPaused && (
                          <span className="text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle size={13} /> Credit Paused
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                            <XCircle size={13} /> Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReVerify(d.id)}
                            disabled={loadingId === d.id}
                            className="px-2 py-1 text-[11px] rounded bg-sky-500/10 hover:bg-sky-500/20 text-[#38bdf8] border border-sky-500/30 transition-colors disabled:opacity-50"
                            title="Verify on BSC blockchain"
                          >
                            Verify
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(d.id)}
                                disabled={loadingId === d.id}
                                className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(d.id)}
                                disabled={loadingId === d.id}
                                className="px-2.5 py-1 text-[11px] font-bold rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
