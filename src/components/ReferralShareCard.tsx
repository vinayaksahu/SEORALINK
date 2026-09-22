"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Lock, ArrowRight } from "lucide-react";

interface ReferralShareCardProps {
  referralLink: string;
  isLocked?: boolean;
}

export function ReferralShareCard({ referralLink, isLocked = false }: ReferralShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  if (isLocked) {
    return (
      <div className="card-seoralink p-5 bg-[#0d1424] border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Lock size={14} className="text-amber-400 shrink-0" />
            <span>Referral Sponsorship Locked — Account Activation Required</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              INACTIVE ID
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Your account is currently inactive. In accordance with system policy, account activation ($10 USDT) is required before new members can register using your referral link.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <Link
            href="/member/activate"
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
          >
            Activate Account ($10 USDT) <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card-seoralink p-5 bg-[#0d1424] border-[#d4af37]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
          Your Personal Sponsorship Referral Link
        </div>
        <p className="text-xs text-[#94a3b8]">
          Share with partners to earn 5% ($0.50) instant direct cash and recurring 5% overrides on every mentee rank upgrade.
        </p>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <input
          type="text"
          readOnly
          value={referralLink}
          className="bg-[#0b1120] border border-[#d4af37]/30 text-white font-mono-num text-xs px-3.5 py-2 rounded-lg w-full md:w-72 focus:outline-none select-all"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" /> Copied!
            </>
          ) : (
            <>
              <Copy size={14} /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
