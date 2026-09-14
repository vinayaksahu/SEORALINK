'use client';

import React, { useState } from 'react';
import { TIER_NAMES, TIER_VALUES, TIER_COLORS } from '../lib/constants';

interface QueueVisualizerProps {
  currentTier?: number; // 1 to 13
  queuePosition?: number;
  totalInQueue?: number;
}

export default function QueueVisualizer({
  currentTier = 1,
  queuePosition = 1,
  totalInQueue = 5,
}: QueueVisualizerProps) {
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const tierName = TIER_NAMES[selectedTier - 1] || 'Zen';
  const tierValue = TIER_VALUES[selectedTier - 1] || 10;
  const accentColor = TIER_COLORS[tierName as keyof typeof TIER_COLORS] || '#d4af37';

  return (
    <div className="card-seoralink border-seoralink-border-gold/30 bg-seoralink-bg-card/90 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-seoralink-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 bg-seoralink-cyan-bright rounded-full inline-block"></span>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Global Single-Leg Queue &bull; 2:1 Tripod Engine
            </h3>
          </div>
          <p className="text-xs text-seoralink-text-muted mt-1">
            Universal FIFO queue execution. 2 matching IDs below your position trigger net payout and automated rank escalation.
          </p>
        </div>

        {/* Tier Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-seoralink-text-muted uppercase">Inspect Tier:</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(Number(e.target.value))}
            className="bg-seoralink-bg-surface border border-seoralink-border-gold/40 text-white font-mono text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-seoralink-gold"
          >
            {TIER_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                T{idx} - {name} (${TIER_VALUES[idx]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Signature Tripod Model Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: The Tripod Graphic */}
        <div className="flex flex-col items-center justify-center p-6 bg-seoralink-bg-surface/60 rounded-xl border border-seoralink-border-subtle/50 relative">
          <div className="absolute top-3 left-3">
            <span className="badge-gold text-[10px]">Deterministic Matching</span>
          </div>

          {/* Top Node (Active ID) */}
          <div className="w-full max-w-[280px] p-4 rounded-xl border-2 bg-seoralink-bg-card shadow-lg flex flex-col items-center text-center transition-all"
               style={{ borderColor: accentColor }}>
            <div className="text-[11px] font-mono text-seoralink-text-muted uppercase tracking-wider">
              Target Position [Tier {selectedTier - 1}]
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {tierName} Node
            </div>
            <div className="text-sm font-mono font-bold mt-1" style={{ color: accentColor }}>
              ${tierValue} USDT Value
            </div>
            <div className="mt-2 text-[10px] px-2.5 py-0.5 rounded-full bg-seoralink-gold/20 text-seoralink-gold font-mono font-semibold">
              Queue Position #0 &bull; Front of Line
            </div>
          </div>

          {/* Connection Lines (SVG) */}
          <div className="w-full max-w-[280px] h-10 flex justify-center items-center my-1">
            <svg viewBox="0 0 200 40" className="w-full h-full stroke-seoralink-cyan/60" fill="none">
              <line x1="100" y1="0" x2="40" y2="40" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="100" y1="0" x2="160" y2="40" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="100" cy="0" r="3" fill="#38bdf8" />
              <circle cx="40" cy="40" r="3" fill="#10b981" />
              <circle cx="160" cy="40" r="3" fill="#10b981" />
            </svg>
          </div>

          {/* Bottom Row (2 Matching Units) */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
            {/* Unit 1 */}
            <div className="p-3 rounded-lg border border-seoralink-cyan/50 bg-seoralink-bg-card/80 flex flex-col items-center text-center">
              <span className="text-[10px] font-mono text-seoralink-cyan font-bold">Matching ID 1</span>
              <span className="text-xs font-bold text-white mt-0.5">50% Complete</span>
              <span className="text-[10px] text-seoralink-text-muted mt-1">Funds Net Cashout</span>
              <div className="w-full bg-seoralink-bg-surface h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-seoralink-cyan h-full w-full"></div>
              </div>
            </div>

            {/* Unit 2 */}
            <div className="p-3 rounded-lg border border-seoralink-green/50 bg-seoralink-bg-card/80 flex flex-col items-center text-center">
              <span className="text-[10px] font-mono text-seoralink-green font-bold">Matching ID 2</span>
              <span className="text-xs font-bold text-white mt-0.5">100% Complete</span>
              <span className="text-[10px] text-seoralink-text-muted mt-1">Auto-Promotes to T{selectedTier}</span>
              <div className="w-full bg-seoralink-bg-surface h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-seoralink-green h-full w-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Queue Stream Explanation */}
        <div className="space-y-4">
          <div className="card-seoralink bg-seoralink-bg-surface/40 p-4 space-y-2 border-seoralink-border-subtle">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-seoralink-green animate-pulse"></span>
              Universal Single-Leg Queue Mechanics
            </h4>
            <ul className="text-xs text-seoralink-text-body space-y-2 pl-2">
              <li className="flex items-start gap-2">
                <span className="text-seoralink-gold font-mono font-bold">&bull;</span>
                <span><strong>No Binary Balancing:</strong> Zero weak-leg bottlenecks, no matrix splits, no point flushing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-seoralink-cyan font-mono font-bold">&bull;</span>
                <span><strong>Global Collective Flow:</strong> Units originate from direct teams, crossline spillover, and lower-tier rank upgrades worldwide.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-seoralink-green font-mono font-bold">&bull;</span>
                <span><strong>Timestamp FIFO Priority:</strong> All placements strictly ordered by EVM block timestamp.</span>
              </li>
            </ul>
          </div>

          {/* Queue Stream Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-seoralink-text-muted">
              <span>Queue Line (FIFO Progression)</span>
              <span>Next Match: 2 Units Needed</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {['#0 Active (You)', '#1 Matched', '#2 Matched', '#3 Waiting', '#4 Waiting', '#5 Incoming'].map((label, idx) => (
                <div
                  key={label}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg font-mono text-xs text-center border ${
                    idx === 0
                      ? 'bg-seoralink-gold/15 border-seoralink-gold text-seoralink-gold font-bold'
                      : idx <= 2
                      ? 'bg-seoralink-green/10 border-seoralink-green/50 text-seoralink-green'
                      : 'bg-seoralink-bg-surface border-seoralink-border-subtle text-seoralink-text-muted'
                  }`}
                >
                  <div>{label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {idx === 0 ? 'Front' : idx <= 2 ? 'Processed' : `Pos +${idx}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
