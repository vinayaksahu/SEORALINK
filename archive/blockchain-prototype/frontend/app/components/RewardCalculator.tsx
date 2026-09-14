'use client';

import React, { useState } from 'react';
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS, CUMULATIVE_REWARDS } from '../lib/constants';

export default function RewardCalculator() {
  const [targetTier, setTargetTier] = useState<number>(12); // Ultima by default
  const [menteesCount, setMenteesCount] = useState<number>(6); // 6 directs standard

  const tierName = TIER_NAMES[targetTier];
  const grossRankReward = TIER_VALUES[targetTier];
  const cumulativeGross = CUMULATIVE_REWARDS[targetTier];
  
  // Calculate deduction
  const deductionRate = targetTier === 12 ? 0.10 : 0.20;
  const netRankReward = grossRankReward * (1 - deductionRate);

  // Direct sponsor commission ($0.50 per mentee)
  const directCommission = menteesCount * 0.50;

  // Calculate cumulative overrides per mentee up to targetTier
  let overridePerMentee = 0;
  for (let i = 1; i <= targetTier; i++) {
    overridePerMentee += TIER_VALUES[i] * 0.05;
  }
  const totalOverrides = overridePerMentee * menteesCount;

  // Cumulative net rewards across all completed tiers
  let cumulativeNet = 0;
  for (let i = 1; i <= targetTier; i++) {
    const rate = i === 12 ? 0.10 : 0.20;
    cumulativeNet += TIER_VALUES[i] * (1 - rate);
  }

  const grandTotalEarnings = cumulativeNet + directCommission + totalOverrides;

  return (
    <div className="card-seoralink border-seoralink-border-gold/30 bg-seoralink-bg-card/90 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-seoralink-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-seoralink-gold rounded-full inline-block"></span>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Ecosystem Economics &bull; Interactive Calculator
            </h3>
          </div>
          <p className="text-xs text-seoralink-text-muted mt-1">
            Simulate your earnings potential across the 12-tier doubling ladder, 5% direct cash, and compounding 5% mentor overrides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-gold text-xs">Micro-Entry: $10 USDT</span>
        </div>
      </div>

      {/* Input Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slider 1: Target Tier */}
        <div className="card-seoralink bg-seoralink-bg-surface/50 p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white font-bold">Target Rank Ladder</span>
            <span className="font-mono text-seoralink-cyan font-bold">
              Tier {targetTier}: {tierName} (${grossRankReward.toLocaleString()})
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            value={targetTier}
            onChange={(e) => setTargetTier(Number(e.target.value))}
            className="w-full h-2 bg-seoralink-bg-surface rounded-lg appearance-none cursor-pointer accent-seoralink-cyan"
          />
          <div className="flex justify-between text-[10px] font-mono text-seoralink-text-muted">
            <span>T1 (Zen)</span>
            <span>T6 (Orbit)</span>
            <span>T12 (Ultima)</span>
          </div>
          <div className="text-[11px] text-seoralink-text-muted">
            Directs required for this rank: <strong className="text-white">{REQUIRED_DIRECTS[targetTier]} Cumulative Directs</strong>
          </div>
        </div>

        {/* Slider 2: Number of Sponsored Mentees */}
        <div className="card-seoralink bg-seoralink-bg-surface/50 p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white font-bold">Personally Sponsored Mentees</span>
            <span className="font-mono text-seoralink-purple font-bold">
              {menteesCount} Active Partners
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="50"
            value={menteesCount}
            onChange={(e) => setMenteesCount(Number(e.target.value))}
            className="w-full h-2 bg-seoralink-bg-surface rounded-lg appearance-none cursor-pointer accent-seoralink-purple"
          />
          <div className="flex justify-between text-[10px] font-mono text-seoralink-text-muted">
            <span>2 Directs (Min)</span>
            <span>6 (Full Ladder Unlock)</span>
            <span>50 Partners</span>
          </div>
          <div className="text-[11px] text-seoralink-text-muted">
            Full 12-rank override per mentee: <strong className="text-seoralink-purple font-mono">$2,047.50 USDT</strong>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Net Rank Payout */}
        <div className="p-4 rounded-xl border border-seoralink-border-subtle bg-seoralink-bg-surface/60 flex flex-col justify-between">
          <span className="text-xs font-mono text-seoralink-text-muted uppercase">
            Net Rank Payout (T{targetTier})
          </span>
          <div className="text-2xl font-mono font-bold text-seoralink-gold my-2">
            ${netRankReward.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-seoralink-text-muted">
            {targetTier === 12 ? '10% Ultima Reserve Fee' : '20% Protocol Reserve'}
          </span>
        </div>

        {/* Metric 2: Cumulative Rank Payouts */}
        <div className="p-4 rounded-xl border border-seoralink-border-subtle bg-seoralink-bg-surface/60 flex flex-col justify-between">
          <span className="text-xs font-mono text-seoralink-text-muted uppercase">
            Cumulative Rank Cashouts
          </span>
          <div className="text-2xl font-mono font-bold text-seoralink-cyan my-2">
            ${cumulativeNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-seoralink-text-muted">
            Gross pool: ${cumulativeGross.toLocaleString()}
          </span>
        </div>

        {/* Metric 3: Mentorship Overrides */}
        <div className="p-4 rounded-xl border border-seoralink-border-subtle bg-seoralink-bg-surface/60 flex flex-col justify-between">
          <span className="text-xs font-mono text-seoralink-text-muted uppercase">
            5% Upline Overrides
          </span>
          <div className="text-2xl font-mono font-bold text-seoralink-purple my-2">
            ${totalOverrides.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-seoralink-text-muted">
            ${overridePerMentee.toFixed(2)} &times; {menteesCount} mentees
          </span>
        </div>

        {/* Metric 4: Direct Commissions */}
        <div className="p-4 rounded-xl border border-seoralink-border-subtle bg-seoralink-bg-surface/60 flex flex-col justify-between">
          <span className="text-xs font-mono text-seoralink-text-muted uppercase">
            5% Direct Sponsor Cash
          </span>
          <div className="text-2xl font-mono font-bold text-seoralink-green my-2">
            ${directCommission.toFixed(2)}
          </div>
          <span className="text-[10px] text-seoralink-text-muted">
            $0.50 &times; {menteesCount} direct entries
          </span>
        </div>
      </div>

      {/* Grand Total Callout */}
      <div className="p-5 rounded-xl border-2 border-seoralink-gold/50 bg-gradient-to-r from-seoralink-bg-surface to-seoralink-bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-seoralink-gold uppercase tracking-wider font-bold">
            Projected Total Liquidity Output
          </div>
          <div className="text-sm text-seoralink-text-muted mt-0.5">
            Combined return across single-leg queues, direct activations, and dual override tiers.
          </div>
        </div>
        <div className="text-3xl md:text-4xl font-mono font-bold text-white">
          ${grandTotalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-sm text-seoralink-gold font-normal">USDT</span>
        </div>
      </div>
    </div>
  );
}
