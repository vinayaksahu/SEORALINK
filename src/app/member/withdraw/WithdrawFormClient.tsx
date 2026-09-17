'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TIER_NAMES, TIER_VALUES, NET_CASHOUT_VALUES, RATES } from "@/lib/constants";
import { ArrowUpRight, ArrowRight, AlertCircle, CheckCircle2, ShieldAlert, Trophy, AlertTriangle } from "lucide-react";

interface WithdrawFormClientProps {
  incomeBalance: number;
  currentTier: number;
  isBanned?: boolean;
  savedAddress?: string;
}

export default function WithdrawFormClient({
  incomeBalance,
  currentTier,
  isBanned = false,
  savedAddress = "",
}: WithdrawFormClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"COMMISSION" | "RANK_EXIT">("COMMISSION");

  // Commission Form State
  const [amount, setAmount] = useState(incomeBalance >= 10 ? "10.00" : "0.00");
  const [toAddress, setToAddress] = useState(savedAddress);
  const [network, setNetwork] = useState("USDT_BEP20");

  // Rank Exit State
  const [rankExitConfirmed, setRankExitConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isUltima = currentTier === 12;
  const rankGross = TIER_VALUES[currentTier];
  const rankNet = NET_CASHOUT_VALUES[currentTier];
  const rankFeePercent = isUltima ? RATES.ULTIMA_DEDUCTION_PERCENT : RATES.INTERMEDIATE_DEDUCTION_PERCENT;
  const rankFeeAmount = (rankGross * rankFeePercent) / 100;

  // Commission fee calculations (flat 10%)
  const numCommAmount = parseFloat(amount) || 0;
  const commFeePercent = RATES.COMMISSION_DEDUCTION_PERCENT; // 10%
  const commFeeAmount = (numCommAmount * commFeePercent) / 100;
  const commNetAmount = Math.max(0, numCommAmount - commFeeAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (activeTab === "RANK_EXIT" && !isUltima && !rankExitConfirmed) {
      setError("You must check the confirmation box acknowledging that your account will be permanently banned.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        category: activeTab,
        amount: activeTab === "COMMISSION" ? amount : rankGross.toString(),
        toAddress: toAddress.trim(),
        network,
      };

      const res = await fetch("/api/member/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Withdrawal request failed");
      }

      setSuccess(data.message || "Withdrawal request submitted successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isBanned) {
    return (
      <div className="card-seoralink p-6 border border-red-500/50 bg-red-500/10 space-y-3 text-center">
        <ShieldAlert size={36} className="text-red-400 mx-auto" />
        <h3 className="text-sm font-bold text-red-400">Withdrawals Disabled</h3>
        <p className="text-xs text-[#cbd5e1] leading-relaxed">
          This account executed a Single-Exit rank reward cashout and has been permanently deactivated/banned. No further withdrawals or transactions are permitted.
        </p>
      </div>
    );
  }

  return (
    <div className="card-seoralink p-6 space-y-6">
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#0b1120] border border-[#1e293b]">
        <button
          type="button"
          onClick={() => { setActiveTab("COMMISSION"); setError(""); setSuccess(""); }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "COMMISSION"
              ? "bg-[#10b981] text-black shadow-md font-extrabold"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          <ArrowUpRight size={14} /> Commission Wallet (10%)
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("RANK_EXIT"); setError(""); setSuccess(""); }}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "RANK_EXIT"
              ? isUltima ? "bg-[#d4af37] text-black font-extrabold" : "bg-red-500 text-white font-extrabold"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          <Trophy size={14} /> {isUltima ? "Ultima Apex Cashout" : "Rank Exit Cashout"}
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ================= TAB 1: COMMISSION WALLET ================= */}
        {activeTab === "COMMISSION" && (
          <>
            <div className="p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#cbd5e1]">
              <span className="text-[#10b981] font-bold">Standard Commission Withdrawal:</span>
              <p className="mt-1">
                Withdraw your 5% direct referral bonuses and 5% upline mentorship overrides with a flat <strong>10% protocol fee</strong>. Your ID remains fully active and continues earning!
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex justify-between">
                <span>Withdrawal Amount (USDT)</span>
                <span className="text-[#10b981] font-mono-num font-bold">Available: ${incomeBalance.toFixed(2)}</span>
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
              <div className="text-[10px] text-[#94a3b8]">Minimum withdrawal amount: $10.00 USDT</div>
            </div>
          </>
        )}

        {/* ================= TAB 2: RANK REWARD EXIT ================= */}
        {activeTab === "RANK_EXIT" && (
          <div className="space-y-4">
            {currentTier < 1 ? (
              <div className="p-4 rounded-xl border border-[#d4af37]/40 bg-[#0d1424] text-center text-xs text-[#cbd5e1]">
                You are currently at Junior (Entry). You must complete at least Tier 1 (Zen) to qualify for a rank reward exit.
              </div>
            ) : isUltima ? (
              /* Ultima Celebration Notice */
              <div className="p-4 rounded-xl border border-[#10b981] bg-[#10b981]/10 space-y-2 text-xs text-[#cbd5e1]">
                <div className="flex items-center gap-2 text-[#10b981] font-bold text-sm">
                  <Trophy size={18} /> Apex Ultima (Tier 12) Cycle Complete!
                </div>
                <p>
                  As an Ultima cycle achiever, you unlock the exclusive <strong>10% protocol fee</strong> privilege. You will receive <strong>$18,432.00 USDT Net</strong> on your $20,480 gross rank asset.
                </p>
                <p className="text-white font-semibold">
                  ★ Your account REMAINS PERMANENTLY ACTIVE FOR LIFE to sponsor direct members and receive 5% mentorship overrides forever!
                </p>
              </div>
            ) : (
              /* Intermediate Rank Single-Exit Warning */
              <div className="p-4 rounded-xl border-2 border-red-500/80 bg-red-500/10 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle size={18} /> CRITICAL WARNING: Single-Exit Protocol Rule
                </div>
                <p className="text-[#e2e8f0] leading-relaxed">
                  Cashing out your rank reward at Tier {currentTier} ({TIER_NAMES[currentTier]}) will incur a <strong>20% protocol deduction</strong> ($gross: ${rankGross.toLocaleString()} &rarr; net: ${rankNet.toLocaleString()} USDT).
                </p>
                <div className="p-2.5 rounded bg-black/40 border border-red-500/40 text-red-300 font-semibold leading-relaxed">
                  ⚠️ UPON CONFIRMATION: Your account will be <strong>PERMANENTLY BANNED and DEACTIVATED</strong>. You CANNOT reactivate it in the future, and all future direct commissions, team overrides, and auto-upgrades are strictly forfeited forever.
                </div>

                <label className="flex items-start gap-2 pt-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={rankExitConfirmed}
                    onChange={(e) => setRankExitConfirmed(e.target.checked)}
                    className="mt-0.5 accent-red-500 rounded"
                  />
                  <span className="text-[11px] font-bold">
                    I understand that my account will be permanently banned and cannot be reactivated.
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Common Destination Address Inputs */}
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
            <span>Gross Valuation:</span>
            <span className="font-mono-num font-bold text-white">
              ${activeTab === "COMMISSION" ? numCommAmount.toFixed(2) : rankGross.toLocaleString()} USDT
            </span>
          </div>
          <div className="flex justify-between text-[#94a3b8]">
            <span>Protocol Deduction ({activeTab === "COMMISSION" ? commFeePercent : rankFeePercent}%):</span>
            <span className="font-mono-num text-red-400">
              -${activeTab === "COMMISSION" ? commFeeAmount.toFixed(2) : rankFeeAmount.toLocaleString()} USDT
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#1e293b] font-bold">
            <span className="text-white">Net Payout to Your Wallet:</span>
            <span className="font-mono-num text-[#10b981] text-sm">
              ${activeTab === "COMMISSION" ? commNetAmount.toFixed(2) : rankNet.toLocaleString()} USDT
            </span>
          </div>
        </div>

        {activeTab === "COMMISSION" ? (
          <button
            type="submit"
            disabled={loading || numCommAmount > incomeBalance || numCommAmount < 10}
            className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? "Submitting Request..." : "Request Commission Payout (10% Fee)"}
            {!loading && <ArrowRight size={14} />}
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || currentTier < 1 || (!isUltima && !rankExitConfirmed)}
            className={`w-full py-3 text-xs font-extrabold rounded-lg flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-50 ${
              isUltima
                ? "bg-[#10b981] text-black hover:bg-[#10b981]/90 shadow-lg"
                : "bg-red-600 text-white hover:bg-red-700 shadow-lg"
            }`}
          >
            {loading ? "Processing Cashout..." : isUltima ? "Cashout Ultima Apex ($18,432.00 Net)" : `Exit Single-Leg & Ban ID ($${rankNet.toLocaleString()} Net)`}
            {!loading && <ArrowRight size={14} />}
          </button>
        )}
      </form>
    </div>
  );
}
