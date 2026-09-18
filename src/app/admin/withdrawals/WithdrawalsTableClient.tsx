'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  ExternalLink,
  Check,
  QrCode,
  X,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  Send
} from "lucide-react";
import QRCode from "qrcode";

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

  // QR Modal state
  const [qrModalItem, setQrModalItem] = useState<{
    address: string;
    customId: string;
    fullName: string;
    netAmount: string;
    network: string;
  } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Approve Modal state
  const [approveModalItem, setApproveModalItem] = useState<WithdrawalItem | null>(null);
  const [approveTxHash, setApproveTxHash] = useState("");
  const [approveRemark, setApproveRemark] = useState("Payout completed successfully via BSC BEP-20");
  const [approveQrUrl, setApproveQrUrl] = useState<string>("");

  // Reject Modal state
  const [rejectModalItem, setRejectModalItem] = useState<WithdrawalItem | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  useEffect(() => {
    setWithdrawals(initialWithdrawals);
  }, [initialWithdrawals]);

  // Generate QR for standalone QR modal
  useEffect(() => {
    if (qrModalItem?.address) {
      QRCode.toDataURL(qrModalItem.address, {
        width: 260,
        margin: 1.5,
        color: { dark: "#070a14", light: "#ffffff" },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    } else {
      setQrCodeDataUrl("");
    }
  }, [qrModalItem]);

  // Generate QR for Approve modal
  useEffect(() => {
    if (approveModalItem?.toAddress) {
      QRCode.toDataURL(approveModalItem.toAddress, {
        width: 220,
        margin: 1.5,
        color: { dark: "#070a14", light: "#ffffff" },
      })
        .then(setApproveQrUrl)
        .catch(console.error);
    } else {
      setApproveQrUrl("");
    }
  }, [approveModalItem]);

  const filtered = withdrawals.filter((w) => {
    if (filter === "ALL") return true;
    return w.status === filter;
  });

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const submitApprove = async () => {
    if (!approveModalItem) return;
    const id = approveModalItem.id;
    setLoadingId(id);

    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: approveTxHash.trim() || null,
          adminNote: approveRemark.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("already been")) {
          setWithdrawals((prev) =>
            prev.map((w) => (w.id === id ? { ...w, status: "APPROVED", adminNote: approveRemark } : w))
          );
        }
        throw new Error(data.error);
      }

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                status: "APPROVED",
                txHash: approveTxHash.trim() || null,
                adminNote: approveRemark.trim(),
              }
            : w
        )
      );
      setApproveModalItem(null);
      setApproveTxHash("");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectModalItem) return;
    const id = rejectModalItem.id;

    if (!rejectRemark.trim()) {
      alert("Please enter a rejection remark / reason for the member.");
      return;
    }

    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: rejectRemark.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("already been")) {
          setWithdrawals((prev) =>
            prev.map((w) => (w.id === id ? { ...w, status: "REJECTED", adminNote: rejectRemark } : w))
          );
        }
        throw new Error(data.error);
      }

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                status: "REJECTED",
                adminNote: rejectRemark.trim(),
              }
            : w
        )
      );
      setRejectModalItem(null);
      setRejectRemark("");
      router.refresh();
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
                <th className="py-3 px-4">Destination Address (BEP-20)</th>
                <th className="py-3 px-4">Status &amp; Remark</th>
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
                        <span className="truncate max-w-[120px] font-mono select-all" title={w.toAddress}>
                          {w.toAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(w.toAddress, w.id)}
                          className="text-[#94a3b8] hover:text-white p-1 rounded hover:bg-[#1e293b]"
                          title="Copy Address"
                        >
                          {copiedId === w.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQrModalItem({
                              address: w.toAddress,
                              customId: w.user.customId,
                              fullName: w.user.fullName,
                              netAmount: w.netAmount,
                              network: w.network,
                            })
                          }
                          className="text-[#d4af37] hover:text-[#f3e5ab] p-1 rounded hover:bg-[#d4af37]/10 flex items-center gap-0.5"
                          title="View Auto-Generated QR Code"
                        >
                          <QrCode size={13} />
                          <span className="text-[9px] font-bold">QR</span>
                        </button>
                      </div>
                      <div className="text-[10px] text-[#64748b]">USDT &bull; BEP-20 (BSC)</div>
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

                      {/* Admin Note / Remark Display */}
                      {w.adminNote && (
                        <div
                          className="text-[10px] text-[#94a3b8] mt-1 truncate max-w-[160px] flex items-center gap-1 bg-[#0b1120] px-1.5 py-0.5 rounded border border-[#1e293b]"
                          title={w.adminNote}
                        >
                          <MessageSquare size={10} className="text-[#d4af37] flex-shrink-0" />
                          <span className="truncate">{w.adminNote}</span>
                        </div>
                      )}

                      {w.txHash && (
                        <a
                          href={`https://bscscan.com/tx/${w.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 mt-0.5 truncate max-w-[150px]"
                          title={`TxID: ${w.txHash}`}
                        >
                          <ExternalLink size={10} />
                          <span className="truncate">Tx: {w.txHash}</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {w.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setApproveModalItem(w);
                              setApproveTxHash("");
                              setApproveRemark("Payout completed via BSC BEP-20");
                            }}
                            disabled={loadingId === w.id}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-[11px] font-bold flex items-center gap-1"
                          >
                            <CheckCircle2 size={11} /> Mark Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalItem(w);
                              setRejectRemark("Invalid or unverified BEP-20 address. Funds refunded.");
                            }}
                            disabled={loadingId === w.id}
                            className="px-2.5 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 rounded text-[11px] font-bold flex items-center gap-1"
                          >
                            <XCircle size={11} /> Reject
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

      {/* ================= MODAL 1: STANDALONE QR CODE MODAL ================= */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-[#0b1120] border border-[#d4af37]/40 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setQrModalItem(null)}
              className="absolute right-4 top-4 text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1">
              <div className="text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center justify-center gap-1.5">
                <QrCode size={16} /> Destination Wallet QR Code
              </div>
              <h4 className="text-sm font-bold text-white">{qrModalItem.fullName}</h4>
              <p className="text-[11px] text-[#38bdf8] font-mono">{qrModalItem.customId}</p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-xl flex items-center justify-center mx-auto shadow-inner w-56 h-56">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Member Wallet QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-zinc-400 text-xs">Generating QR...</div>
              )}
            </div>

            <div className="space-y-1 text-center">
              <div className="text-xs text-[#94a3b8]">Net Payout Amount</div>
              <div className="text-lg font-bold text-[#10b981] font-mono-num">
                ${parseFloat(qrModalItem.netAmount).toFixed(2)} USDT
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#94a3b8] uppercase font-mono">
                BEP-20 Wallet Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrModalItem.address}
                  className="w-full bg-[#070a14] border border-[#1e293b] text-white font-mono-num text-[11px] px-3 py-2 rounded-lg select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(qrModalItem.address, "modal")}
                  className="btn-primary px-3 py-2 text-xs font-bold flex items-center gap-1 flex-shrink-0"
                >
                  {copiedId === "modal" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === "modal" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setQrModalItem(null)}
                className="w-full py-2.5 rounded-lg bg-[#1e293b] text-white hover:bg-[#334155] text-xs font-bold"
              >
                Close QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: APPROVAL MODAL WITH QR & REMARK ================= */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-[#0b1120] border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setApproveModalItem(null)}
              className="absolute right-4 top-4 text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Approve &amp; Mark Withdrawal as Paid</h3>
                <p className="text-[11px] text-[#94a3b8]">
                  Confirm blockchain payout for {approveModalItem.user.fullName} ({approveModalItem.user.customId})
                </p>
              </div>
            </div>

            {/* Payout Details & QR Code Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#070a14] border border-[#1e293b] items-center">
              <div className="bg-white p-2 rounded-lg flex items-center justify-center w-36 h-36 mx-auto shadow">
                {approveQrUrl ? (
                  <img src={approveQrUrl} alt="Scan to pay" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-zinc-400 text-[10px]">Loading QR...</div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#94a3b8] text-[10px] uppercase">Net Payout:</span>
                  <div className="text-xl font-bold text-[#10b981] font-mono-num">
                    ${parseFloat(approveModalItem.netAmount).toFixed(2)} USDT
                  </div>
                </div>
                <div>
                  <span className="text-[#94a3b8] text-[10px] uppercase">Network:</span>
                  <div className="text-[#38bdf8] font-bold">BNB Smart Chain (BEP-20)</div>
                </div>
                <div>
                  <span className="text-[#94a3b8] text-[10px] uppercase">Destination Address:</span>
                  <div className="font-mono text-[10px] text-white truncate max-w-[190px] select-all">
                    {approveModalItem.toAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain TxID Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                Blockchain Transaction Hash (TxID)
              </label>
              <input
                type="text"
                placeholder="0x... (from Binance, Trust Wallet, or BscScan)"
                value={approveTxHash}
                onChange={(e) => setApproveTxHash(e.target.value)}
                className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2.5 text-xs font-mono-num focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Approval Remark / Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={13} className="text-[#d4af37]" />
                Approval Remark / Admin Note *
              </label>
              <textarea
                rows={2}
                value={approveRemark}
                onChange={(e) => setApproveRemark(e.target.value)}
                placeholder="Enter payout remark (e.g. Paid from Binance Master Wallet #1)"
                className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 resize-none"
              />
              <p className="text-[10px] text-[#94a3b8]">
                This remark will be stored on the record and visible in payout history.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                className="px-4 py-2 rounded-lg text-xs text-[#94a3b8] hover:text-white border border-[#1e293b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApprove}
                disabled={loadingId === approveModalItem.id}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black flex items-center gap-1.5 shadow-lg disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {loadingId === approveModalItem.id ? "Processing..." : "Confirm & Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: REJECTION MODAL WITH REMARK ================= */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-[#0b1120] border border-red-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setRejectModalItem(null)}
              className="absolute right-4 top-4 text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <XCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reject Withdrawal &amp; Refund Member</h3>
                <p className="text-[11px] text-[#94a3b8]">
                  Funds will be credited back to {rejectModalItem.user.fullName}&apos;s Commission Wallet.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
              <div className="flex justify-between">
                <span>Refund Gross Amount:</span>
                <strong className="font-mono-num">${parseFloat(rejectModalItem.amount).toFixed(2)} USDT</strong>
              </div>
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>Destination Wallet:</span>
                <span className="font-mono truncate max-w-[180px]">{rejectModalItem.toAddress}</span>
              </div>
            </div>

            {/* Rejection Remark Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={13} className="text-red-400" />
                Rejection Remark / Reason *
              </label>
              <textarea
                rows={3}
                required
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                placeholder="Enter clear reason (e.g. Invalid BEP-20 address, wallet not on BSC network, etc.)"
                className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-red-500 resize-none"
              />
              <p className="text-[10px] text-[#94a3b8]">
                The member and audit ledger will display this remark.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-lg text-xs text-[#94a3b8] hover:text-white border border-[#1e293b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={loadingId === rejectModalItem.id || !rejectRemark.trim()}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-lg disabled:opacity-50"
              >
                <XCircle size={14} />
                {loadingId === rejectModalItem.id ? "Processing..." : "Confirm Reject & Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
