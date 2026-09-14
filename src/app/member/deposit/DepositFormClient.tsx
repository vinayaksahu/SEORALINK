'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Copy, Check, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function DepositFormClient({ depositAddress }: { depositAddress: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("10.00");
  const [txHash, setTxHash] = useState("");
  const [network, setNetwork] = useState("USDT_BEP20");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/member/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, txHash, network }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deposit submission failed");
      }

      setSuccess("Deposit request submitted successfully! Funds will be credited after admin review.");
      setTxHash("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-seoralink p-6 space-y-6">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
        Deposit Instructions
      </h3>

      {/* Company Address Box */}
      <div className="p-4 rounded-xl border border-[#d4af37]/30 bg-[#0b1120] space-y-3">
        <div className="text-[10px] font-mono-num uppercase text-[#94a3b8] flex justify-between">
          <span>Official Company Deposit Address</span>
          <span className="text-[#38bdf8] font-bold">USDT (BEP-20 / BSC)</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={depositAddress}
            className="w-full bg-[#070a14] border border-[#1e293b] text-white font-mono-num text-xs px-3 py-2 rounded-lg focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="btn-primary px-3 py-2 text-xs font-bold flex items-center gap-1 flex-shrink-0"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <p className="text-[10px] text-[#94a3b8]">
          Send only USDT via BNB Smart Chain (BEP-20) to this address. Minimum deposit is $10 USDT.
        </p>
      </div>

      {/* Submission Form */}
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
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Deposit Amount (USDT)
          </label>
          <input
            type="number"
            step="0.01"
            min="10"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num font-bold focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Network
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
            Blockchain Transaction Hash (TxID)
          </label>
          <input
            type="text"
            required
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {loading ? "Submitting Request..." : "Submit Deposit for Verification"}
          {!loading && <ArrowRight size={14} />}
        </button>
      </form>
    </div>
  );
}
