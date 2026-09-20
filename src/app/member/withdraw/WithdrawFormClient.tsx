'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TIER_NAMES, TIER_VALUES, NET_CASHOUT_VALUES, RATES } from "@/lib/constants";
import {
  ArrowUpRight,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Trophy,
  AlertTriangle,
  KeyRound,
  Mail,
  X,
  Shield,
  RefreshCw,
} from "lucide-react";

interface WithdrawFormClientProps {
  incomeBalance: number;
  currentTier: number;
  isBanned?: boolean;
  isInactive?: boolean;
  hasWithdrawnRankPool?: boolean;
  savedAddress?: string;
  userEmail?: string;
}

export default function WithdrawFormClient({
  incomeBalance,
  currentTier,
  isBanned = false,
  isInactive = false,
  hasWithdrawnRankPool = false,
  savedAddress = "",
  userEmail = "",
}: WithdrawFormClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"COMMISSION" | "RANK_EXIT">("COMMISSION");

  // Commission Form State
  const [amount, setAmount] = useState(
    hasWithdrawnRankPool
      ? (incomeBalance > 0 ? incomeBalance.toFixed(2) : "0.00")
      : (incomeBalance >= 10 ? "10.00" : "0.00")
  );
  const [toAddress, setToAddress] = useState(savedAddress);
  const [network, setNetwork] = useState("USDT_BEP20");

  // Rank Exit State
  const [rankExitConfirmed, setRankExitConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  React.useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

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

  const sendWithdrawalOtp = async () => {
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "WITHDRAWAL" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send withdrawal OTP code.");
      }
      setOtpCooldown(60);
    } catch (err: any) {
      setOtpError(err.message || "Failed to send verification code.");
    } finally {
      setOtpSending(false);
    }
  };

  const executeWithdrawal = async (payloadWithOtp: any) => {
    const res = await fetch("/api/member/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithOtp),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Withdrawal request failed");
    }

    setSuccess(data.message || "Withdrawal request submitted successfully!");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (hasWithdrawnRankPool) {
      setError("This account has exited the system under the Single-Exit protocol and cannot initiate withdrawals.");
      return;
    }

    if (isInactive) {
      setError("Account activation ($10 USDT) is required before requesting withdrawals. Please activate your account first.");
      return;
    }

    if (activeTab === "COMMISSION") {
      const num = parseFloat(amount);
      const minAmount = 10;
      if (isNaN(num) || num < minAmount) {
        setError(`Minimum withdrawal amount is $${minAmount.toFixed(2)} USDT.`);
        return;
      }
      if (num % 5 !== 0) {
        setError("Withdrawal amount must be in multiples of $5 USDT (e.g. $10, $15, $20, $25, $30, etc.).");
        return;
      }
      if (num > incomeBalance) {
        setError(`Insufficient Commission Wallet balance. Available: $${incomeBalance.toFixed(2)} USDT.`);
        return;
      }
    }

    const cleanAddress = toAddress.trim();
    if (!cleanAddress.startsWith("0x") || cleanAddress.length !== 42) {
      setError("Please enter a valid BNB Smart Chain (BEP-20) wallet address starting with 0x (42 characters).");
      return;
    }

    if (activeTab === "RANK_EXIT" && !isUltima && !rankExitConfirmed) {
      setError("You must check the confirmation box acknowledging that your account will be permanently banned.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        category: activeTab,
        amount: activeTab === "COMMISSION" ? amount : rankGross.toString(),
        toAddress: cleanAddress,
        network: "USDT_BEP20",
      };

      // Check if WITHDRAWAL OTP is enabled in system settings
      const statusRes = await fetch("/api/auth/otp/status?purpose=WITHDRAWAL");
      const statusData = await statusRes.json();
      const isOtpRequired = statusData.enabled !== false && statusData.settings?.WITHDRAWAL !== false;

      if (isOtpRequired) {
        setPendingPayload(payload);
        setShowOtpModal(true);
        setOtpCode("");
        setOtpError("");
        await sendWithdrawalOtp();
        setLoading(false);
        return;
      }

      // If OTP disabled by admin, execute directly
      await executeWithdrawal(payload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtpWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP verification code.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      await executeWithdrawal({ ...pendingPayload, otpCode: otpCode.trim() });
      setShowOtpModal(false);
      setPendingPayload(null);
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (hasWithdrawnRankPool) {
    return (
      <div className="card-seoralink p-6 border-2 border-purple-500/50 bg-purple-500/10 space-y-4 text-center">
        <ShieldAlert size={36} className="text-purple-400 mx-auto" />
        <div>
          <h3 className="text-base font-bold text-purple-300">Withdrawals Disabled &bull; System Exited</h3>
          <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider">
            Single-Exit Protocol Settlement
          </span>
        </div>
        <p className="text-xs text-[#cbd5e1] leading-relaxed max-w-md mx-auto">
          This account has concluded its participation in the SEORALINK network under the Single-Exit protocol. Both Commission Wallet and Rank Pool withdrawals are permanently disabled for retired IDs.
        </p>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="card-seoralink p-6 border border-red-500/50 bg-red-500/10 space-y-3 text-center">
        <ShieldAlert size={36} className="text-red-400 mx-auto" />
        <h3 className="text-sm font-bold text-red-400">Account Blocked</h3>
        <p className="text-xs text-[#cbd5e1] leading-relaxed">
          This account has been blocked by administration. Withdrawals and transactions are disabled.
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
              ? isUltima
                ? "bg-[#d4af37] text-black font-extrabold"
                : hasWithdrawnRankPool
                ? "bg-[#1e293b] text-[#94a3b8] font-bold"
                : "bg-red-500 text-white font-extrabold"
              : "text-[#94a3b8] hover:text-white"
          }`}
        >
          <Trophy size={14} /> {hasWithdrawnRankPool ? "Rank Pool (Cashed Out)" : "Rank Pool Wallet (One-Time Exit)"}
        </button>
      </div>

      {isInactive && (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Account Activation Required ($10 USDT)</div>
            <div className="text-[11px] text-[#cbd5e1] mt-1 leading-relaxed">
              You must activate your account with the $10 USDT Micro-Entry fee before you can initiate withdrawals from your Commission Wallet or Rank Pool.
            </div>
            <a
              href="/member/activate"
              className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg bg-[#d4af37] text-black font-extrabold text-[10px] uppercase tracking-wider hover:bg-[#d4af37]/90 transition-all shadow"
            >
              Activate Account Now ($10) &rarr;
            </a>
          </div>
        </div>
      )}

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
            {hasWithdrawnRankPool ? (
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-[#cbd5e1]">
                <span className="text-amber-400 font-bold">Commission Wallet Settlement:</span>
                <p className="mt-1">
                  Your Rank Pool has concluded under the Single-Exit protocol. You can withdraw your remaining Commission Wallet balance below (flat <strong>10% protocol fee</strong>).
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#cbd5e1]">
                <span className="text-[#10b981] font-bold">Standard Commission Withdrawal:</span>
                <p className="mt-1">
                  Withdraw your 5% direct referral bonuses and 5% upline mentorship overrides with a flat <strong>10% protocol fee</strong>. Your ID remains fully active and continues earning!
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex justify-between items-center">
                <span>Withdrawal Amount (USDT)</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#10b981] font-mono-num font-bold">Available: ${incomeBalance.toFixed(2)}</span>
                  {hasWithdrawnRankPool && incomeBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(incomeBalance.toFixed(2))}
                      className="text-[10px] text-amber-400 font-bold underline hover:text-amber-300 cursor-pointer"
                    >
                      Withdraw All (${incomeBalance.toFixed(2)})
                    </button>
                  )}
                </div>
              </label>
              <input
                type="number"
                step={hasWithdrawnRankPool ? "0.01" : "5"}
                min={hasWithdrawnRankPool ? "1" : "10"}
                max={hasWithdrawnRankPool ? incomeBalance : Math.floor(incomeBalance / 5) * 5}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num font-bold focus:outline-none focus:border-[#d4af37]"
              />
              <div className="text-[10px] text-[#94a3b8] flex justify-between items-center">
                <span>
                  {hasWithdrawnRankPool
                    ? "Minimum: $1.00 USDT • Full remaining balance cashout supported"
                    : "Minimum: $10.00 USDT • Must be in multiples of $5 ($10, $15, $20, $25...)"}
                </span>
                {!hasWithdrawnRankPool && numCommAmount > 0 && numCommAmount % 5 !== 0 && (
                  <span className="text-amber-400 font-bold">Must be multiple of 5</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================= TAB 2: RANK POOL WALLET ================= */}
        {activeTab === "RANK_EXIT" && (
          <div className="space-y-4">
            {hasWithdrawnRankPool ? (
              <div className="p-5 rounded-xl border border-[#d4af37]/40 bg-[#0d1424] space-y-2 text-center text-xs">
                <CheckCircle2 size={32} className="text-[#10b981] mx-auto" />
                <div className="text-sm font-bold text-white">Rank Pool Wallet Claimed</div>
                <p className="text-[#94a3b8] leading-relaxed">
                  You have already executed your one-time Rank Pool Wallet withdrawal. Under the Single-Exit Protocol, only one lifetime withdrawal is permitted from the Rank Pool.
                </p>
                {isUltima && (
                  <div className="text-xs text-[#10b981] font-semibold pt-1">
                    ★ Your account remains permanently ACTIVE for life to continue earning and withdrawing direct &amp; mentorship commissions!
                  </div>
                )}
              </div>
            ) : currentTier < 1 ? (
              <div className="p-4 rounded-xl border border-[#d4af37]/40 bg-[#0d1424] text-center text-xs text-[#cbd5e1]">
                You are currently at Junior (Entry). You must complete at least Tier 1 (Zen) to qualify for a rank pool cashout.
              </div>
            ) : isUltima ? (
              /* Ultima Celebration Notice */
              <div className="p-4 rounded-xl border border-[#10b981] bg-[#10b981]/10 space-y-2 text-xs text-[#cbd5e1]">
                <div className="flex items-center gap-2 text-[#10b981] font-bold text-sm">
                  <Trophy size={18} /> Apex Ultima (Tier 12) Rank Pool Complete!
                </div>
                <p>
                  As an Ultima cycle achiever, you unlock the exclusive <strong>10% protocol fee</strong> privilege. You will receive <strong>$18,432.00 USDT Net</strong> on your $20,480 Rank Pool holding.
                </p>
                <p className="text-white font-semibold">
                  ★ Your account REMAINS PERMANENTLY ACTIVE FOR LIFE to sponsor direct members ($0.50) and receive 5% mentorship overrides forever! (No account ban on Ultima).
                </p>
              </div>
            ) : (
              /* Intermediate Rank Single-Exit Warning */
              <div className="p-4 rounded-xl border-2 border-red-500/80 bg-red-500/10 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle size={18} /> CRITICAL WARNING: Rank Pool Single-Exit Protocol Rule
                </div>
                <p className="text-[#e2e8f0] leading-relaxed">
                  Cashing out your Rank Pool Wallet at Tier {currentTier} ({TIER_NAMES[currentTier]}) will incur a <strong>20% protocol deduction</strong> ($gross: ${rankGross.toLocaleString()} &rarr; net: ${rankNet.toLocaleString()} USDT).
                </p>
                <div className="p-2.5 rounded bg-black/40 border border-red-500/40 text-red-300 font-semibold leading-relaxed">
                  ⚠️ UPON CASHOUT: Your ID will be <strong>PERMANENTLY BANNED and DEACTIVATED</strong>. You can only withdraw from the Rank Pool Wallet once in your lifetime. Future direct commissions, team overrides, and auto-upgrades are strictly forfeited forever.
                </div>

                <label className="flex items-start gap-2 pt-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={rankExitConfirmed}
                    onChange={(e) => setRankExitConfirmed(e.target.checked)}
                    className="mt-0.5 accent-red-500 rounded"
                  />
                  <span className="text-[11px] font-bold">
                    I understand that this Rank Pool withdrawal is ONE-TIME only and my ID will be permanently banned.
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Common Destination Address Inputs - Fixed to BEP-20 only */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
            <span>Payout Network</span>
            <span className="text-[10px] text-[#38bdf8] font-mono font-bold">Only BEP-20 Supported</span>
          </label>
          <div className="w-full bg-[#0b1120] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 text-xs font-mono-num flex items-center justify-between">
            <span className="font-bold text-[#38bdf8]">USDT &bull; BNB Smart Chain (BEP-20)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
              BSC
            </span>
          </div>
          <p className="text-[10px] text-[#94a3b8]">
            Withdrawals are processed exclusively in USDT via the BNB Smart Chain (BEP-20).
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Destination USDT Wallet Address (BEP-20) *
          </label>
          <input
            type="text"
            required
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num focus:outline-none focus:border-[#d4af37]"
          />
          <p className="text-[10px] text-[#94a3b8]">
            Ensure this is your correct Binance Smart Chain BEP-20 address starting with 0x.
          </p>
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
            disabled={
              loading ||
              isInactive ||
              numCommAmount > incomeBalance ||
              (hasWithdrawnRankPool ? numCommAmount < 1 : (numCommAmount < 10 || numCommAmount % 5 !== 0))
            }
            className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer disabled:cursor-wait transition-all duration-150 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : isInactive ? (
              "Account Activation ($10) Required to Withdraw"
            ) : (
              <>
                <span>Request Commission Payout (10% Fee)</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || isInactive || hasWithdrawnRankPool || currentTier < 1 || (!isUltima && !rankExitConfirmed)}
            className={`w-full py-3 text-xs font-extrabold rounded-lg flex items-center justify-center gap-2 mt-2 transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:cursor-wait disabled:opacity-50 ${
              isUltima
                ? "bg-[#10b981] text-black hover:bg-[#10b981]/90 shadow-lg"
                : "bg-red-600 text-white hover:bg-red-700 shadow-lg"
            }`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Cashout...</span>
              </>
            ) : isInactive ? (
              "Account Activation ($10) Required"
            ) : hasWithdrawnRankPool ? (
              "Rank Pool Already Cashed Out"
            ) : isUltima ? (
              <>
                <span>Cashout Ultima Rank Pool ($18,432.00 Net)</span>
                <ArrowRight size={14} />
              </>
            ) : (
              <>
                <span>Exit Rank Pool & Ban ID (${rankNet.toLocaleString()} Net)</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        )}
      </form>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e1726] border border-[#d4af37]/40 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowOtpModal(false);
                setPendingPayload(null);
                setOtpError("");
              }}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Withdrawal Authorization</h3>
                <p className="text-[11px] text-[#94a3b8]">Security Verification Required</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b1120] border border-[#1e293b] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#94a3b8]">
                <span>Type:</span>
                <span className="font-bold text-white">
                  {pendingPayload?.category === "RANK_EXIT" ? "Rank Pool Cashout" : "Commission Payout"}
                </span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Gross Amount:</span>
                <span className="font-bold text-[#d4af37] font-mono-num">${pendingPayload?.amount} USDT</span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Destination (BEP-20):</span>
                <span className="font-mono text-white text-[11px] truncate max-w-[200px]" title={pendingPayload?.toAddress}>
                  {pendingPayload?.toAddress}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#cbd5e1] leading-relaxed">
              <p>
                A 6-digit one-time security passcode (OTP) has been dispatched to your registered email:
              </p>
              <div className="flex items-center gap-1.5 text-[#38bdf8] font-bold text-xs">
                <Mail size={14} />
                <span>{userEmail || "your registered email"}</span>
              </div>
            </div>

            {otpError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmOtpWithdrawal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
                  <span>6-Digit Verification Code</span>
                  <button
                    type="button"
                    onClick={sendWithdrawalOtp}
                    disabled={otpCooldown > 0 || otpSending}
                    className="text-[11px] text-[#d4af37] hover:underline disabled:text-[#64748b] disabled:no-underline font-semibold flex items-center gap-1"
                  >
                    {otpSending && <RefreshCw size={12} className="animate-spin" />}
                    {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : "Resend code"}
                  </button>
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-[#0b1120] border border-[#d4af37]/40 text-white rounded-lg pl-10 pr-4 py-2.5 text-base font-mono-num font-extrabold tracking-widest text-center focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setPendingPayload(null);
                    setOtpError("");
                  }}
                  className="py-2.5 rounded-lg border border-[#1e293b] text-[#94a3b8] hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="btn-primary py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Confirm & Payout"}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
