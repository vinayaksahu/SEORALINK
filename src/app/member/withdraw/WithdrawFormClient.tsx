'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface WithdrawFormClientProps {
  incomeBalance: number;
  currentTier: number;
  savedAddress?: string;
}

export default function WithdrawFormClient({
  incomeBalance,
  currentTier,
  savedAddress = "",
}: WithdrawFormClientProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("50.00");
  const [toAddress, setToAddress] = useState(savedAddress);
  const [network, setNetwork] = useState("USDT_BEP20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const feePercent = currentTier === 12 ? 10 : 20;
  const numAmount = parseFloat(amount) || 0;
  const feeAmount = (numAmount * feePercent) / 100;
  const netAmount = Math.max(0, numAmount - feeAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/member/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, toAddress, network }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Withdrawal failed");
      }

      setSuccess(data.message || "Withdrawal request submitted successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-seoralink p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
          Request Payout
        </h3>
        <span className="text-xs font-mono-num text-[#94a3b8]">
          Available: <strong className="text-[#10b981]">${incomeBalance.toFixed(2)} USDT</strong>
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex justify-between">
            <span>Withdrawal Amount (USDT)</span>
            <span className="text-[#94a3b8] font-normal">Min: $10.00</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="10"
            max={incomeBalance}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num font-bold focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Payout Network
          </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num font-medium focus:outline-none focus:border-[#d4af37]"
          >
            <option value="USDT_BEP20">USDT &bull; BNB Smart Chain (BEP-20)</option>
            <option value="USDT_TRC20">USDT &bull; TRON (TRC-20)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Destination USDT Wallet Address
          </label>
          <input
            type="text"
            required
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x... or T..."
            className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Live Calculation Preview */}
        <div className="p-4 rounded-xl border border-[#1e293b] bg-[#0b1120] space-y-2 text-xs">
          <div className="flex justify-between text-[#94a3b8]">
            <span>Gross Amount:</span>
            <span className="font-mono-num font-bold text-white">${numAmount.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between text-[#94a3b8]">
            <span>Protocol Reserve Fee ({feePercent}%):</span>
            <span className="font-mono-num text-red-400">-${feeAmount.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#1e293b] font-bold">
            <span className="text-white">Net Payout to Wallet:</span>
            <span className="font-mono-num text-[#10b981] text-sm">${netAmount.toFixed(2)} USDT</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || numAmount > incomeBalance || numAmount < 10}
          className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {loading ? "Submitting Request..." : "Request Payout Now"}
          {!loading && <ArrowRight size={14} />}
        </button>
      </form>
    </div>
  );
}
