'use client';

import React, { useState } from 'react';
import { Copy, Check, QrCode, Users, ArrowUpRight } from 'lucide-react';
import { REQUIRED_DIRECTS } from '../lib/constants';

interface ReferralSystemProps {
  walletAddress?: string;
  directCount?: number;
  currentTier?: number;
  totalOverrideEarned?: number;
}

export default function ReferralSystem({
  walletAddress = '0x3F8a7c...89Ae',
  directCount = 4,
  currentTier = 3,
  totalOverrideEarned = 38.50,
}: ReferralSystemProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://seoralink.com/join?ref=${walletAddress}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nextTier = currentTier + 1;
  const nextTierRequiredDirects = nextTier <= 12 ? REQUIRED_DIRECTS[nextTier] : 6;
  const directsNeededForNext = Math.max(0, nextTierRequiredDirects - directCount);

  return (
    <div className="card-seoralink border-seoralink-border-gold/30 bg-seoralink-bg-card/90 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-seoralink-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-seoralink-purple rounded-full inline-block"></span>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Partner Hub &bull; Referral Telemetry
            </h3>
          </div>
          <p className="text-xs text-seoralink-text-muted mt-1">
            Unlimited frontline referral engine. Earn instant 5% direct cash and recurring 5% overrides on every mentee rank upgrade.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-gold text-xs">Direct Referral Law: Max 6 Needed</span>
        </div>
      </div>

      {/* Referral Link & Share Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Link Box (2 cols) */}
        <div className="lg:col-span-2 card-seoralink bg-seoralink-bg-surface/50 p-5 space-y-4">
          <span className="text-xs font-mono text-seoralink-text-muted uppercase">
            Your Unique Cryptographic Referral Link
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-seoralink-bg-surface border border-seoralink-border-gold/40 text-white font-mono text-sm px-4 py-2.5 rounded-lg focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm whitespace-nowrap"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Directs Progress Tracker */}
          <div className="space-y-2 pt-2 border-t border-seoralink-border-subtle/50">
            <div className="flex justify-between text-xs">
              <span className="text-seoralink-text-muted">Direct Referral Qualification Ladder:</span>
              <span className="font-mono text-seoralink-gold font-bold">
                {directCount} / 6 Lifetime Directs
              </span>
            </div>
            <div className="w-full bg-seoralink-bg-surface h-2.5 rounded-full overflow-hidden border border-seoralink-border-subtle">
              <div
                className="bg-gradient-to-r from-seoralink-gold to-seoralink-cyan h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (directCount / 6) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-seoralink-text-muted flex items-center justify-between">
              <span>{directsNeededForNext > 0 ? `${directsNeededForNext} more needed to qualify for Tier ${nextTier}` : 'Fully qualified for upcoming tiers!'}</span>
              <span className="text-seoralink-cyan font-mono">6 Directs = Full 12 Tiers Unlocked</span>
            </div>
          </div>
        </div>

        {/* QR & Mobile Share (1 col) */}
        <div className="card-seoralink bg-seoralink-bg-surface/50 p-5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-24 h-24 rounded-lg bg-white p-2 flex items-center justify-center shadow-md">
            {/* SVG QR Code Simulation */}
            <QrCode size={80} className="text-black" />
          </div>
          <div className="text-xs font-bold text-white">Scan to Join Network</div>
          <div className="text-[10px] text-seoralink-text-muted font-mono">Instant $10 BEP-20 Activation</div>
        </div>
      </div>

      {/* Network Cascade Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-seoralink-border-subtle bg-seoralink-bg-surface/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-seoralink-text-muted uppercase">Active Frontline</span>
            <Users size={16} className="text-seoralink-cyan" />
          </div>
          <div className="text-3xl font-mono font-bold text-white my-2">
            {directCount} <span className="text-xs text-seoralink-text-muted font-normal">Partners</span>
          </div>
          <span className="text-[11px] text-seoralink-green font-medium flex items-center gap-1">
            <ArrowUpRight size={12} /> Earned ${(directCount * 0.5).toFixed(2)} direct cash
          </span>
        </div>

        <div className="p-4 rounded-xl border border-seoralink-border-subtle bg-seoralink-bg-surface/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-seoralink-text-muted uppercase">Mentorship Overrides</span>
            <ArrowUpRight size={16} className="text-seoralink-purple" />
          </div>
          <div className="text-3xl font-mono font-bold text-seoralink-purple my-2">
            ${totalOverrideEarned.toFixed(2)} <span className="text-xs text-seoralink-text-muted font-normal">USDT</span>
          </div>
          <span className="text-[11px] text-seoralink-text-muted font-mono">
            5% automatic upline upgrade bonus
          </span>
        </div>

        <div className="p-4 rounded-xl border border-seoralink-border-subtle bg-seoralink-bg-surface/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-seoralink-text-muted uppercase">Cumulative Max Potential</span>
            <span className="badge-gold text-[9px]">12 Tiers</span>
          </div>
          <div className="text-3xl font-mono font-bold text-seoralink-gold my-2">
            ${(directCount * 2047.5).toLocaleString()} <span className="text-xs text-seoralink-text-muted font-normal">USDT</span>
          </div>
          <span className="text-[11px] text-seoralink-text-muted">
            If all {directCount} partners complete full 12-rank cycle
          </span>
        </div>
      </div>
    </div>
  );
}
