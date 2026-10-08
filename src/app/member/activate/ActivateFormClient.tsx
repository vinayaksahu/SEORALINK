'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, CheckCircle, AlertCircle, Wallet, RefreshCw } from "lucide-react";

interface ActivateFormClientProps {
  initialUser: {
    id: string;
    customId: string;
    fullName: string;
    status: string;
    currentTier: number;
    fundBalance: number;
  };
}

export default function ActivateFormClient({ initialUser }: ActivateFormClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setUser({
          id: data.user.id,
          customId: data.user.customId,
          fullName: data.user.fullName,
          status: data.user.status,
          currentTier: data.user.currentTier,
          fundBalance: parseFloat(data.user.fundBalance || "0"),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/member/activate", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Activation failed");
      }

      setSuccess(data.message || "Account activated successfully!");
      fetchUser();
      setTimeout(() => {
        router.push("/member/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fundBal = user.fundBalance || 0;
  const isFundSufficient = fundBal >= 10.0;

  return (
    <div className="card-seoralink p-8 space-y-6 bg-[#0d1424] border-[#d4af37]/40 shadow-2xl">
      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Balance Overview */}
        <div className="p-4 rounded-xl border border-[#38bdf8]/30 bg-[#0b1120] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono-num uppercase text-[#94a3b8]">Available Fund Wallet Balance</div>
            <div className="text-2xl font-mono-num font-bold text-[#38bdf8] mt-1">
              ${fundBal.toFixed(2)} USDT
            </div>
          </div>

          {!isFundSufficient && (
            <Link href="/member/deposit" className="btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1">
              <Wallet size={14} /> Top Up Balance
            </Link>
          )}
        </div>

        {/* Micro-Entry Breakdown */}
        <div className="space-y-3 text-xs bg-[#0b1120]/60 p-4 rounded-xl border border-[#1e293b]">
          <div className="flex justify-between py-1 text-[#94a3b8]">
            <span>Activation Fee:</span>
            <span className="font-bold text-white font-mono-num">$10.00 USDT</span>
          </div>
          <div className="flex justify-between py-1 text-[#94a3b8]">
            <span>Direct Sponsor Commission (5%):</span>
            <span className="font-bold text-[#10b981] font-mono-num">$0.50 USDT (Instant)</span>
          </div>
          <div className="flex justify-between py-1 text-[#94a3b8]">
            <span>Queue Placement:</span>
            <span className="font-bold text-[#d4af37]">Tier 0 (Junior FIFO Line)</span>
          </div>
        </div>

        {/* Activate CTA */}
        {isFundSufficient ? (
          <button
            onClick={handleActivate}
            disabled={loading}
            className="btn-primary w-full py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg cursor-pointer disabled:cursor-wait transition-all duration-150 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin text-black" />
                <span>Processing Queue Placement...</span>
              </>
            ) : (
              <>
                <span>Confirm & Activate ($10 USDT)</span>
                <Zap size={15} />
              </>
            )}
          </button>
        ) : (
          <div className="text-center space-y-3 pt-2">
            <p className="text-xs text-amber-400 font-medium">
              You need at least $10.00 in your Fund Wallet to activate.
            </p>
            <Link
              href="/member/deposit"
              className="btn-primary w-full py-3 text-xs font-bold inline-flex items-center justify-center gap-2"
            >
              Deposit Funds ($10 USDT) &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
