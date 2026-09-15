"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ReferralShareCardProps {
  referralLink: string;
}

export function ReferralShareCard({ referralLink }: ReferralShareCardProps) {
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
