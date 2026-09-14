'use client';

import React, { useState } from 'react';
import TierCard from '../components/TierCard';
import QueueVisualizer from '../components/QueueVisualizer';
import RewardCalculator from '../components/RewardCalculator';
import ReferralSystem from '../components/ReferralSystem';
import { TIER_NAMES, TIER_VALUES } from '../lib/constants';
import { Layers, GitCommit, Calculator, Users, Clock, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'queue' | 'calculator' | 'referrals'>('all');

  // Realistic sample user data
  const currentTier = 3; // Tier 3: Nova ($40)
  const queuePos = 14;
  const totalEarnings = 190.00;
  const directs = 4;
  const walletAddress = '0x71C...49Ae';

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Core KPI Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Badge */}
        <div className="lg:col-span-1 card-seoralink bg-gradient-to-br from-seoralink-bg-card to-seoralink-bg-surface border-seoralink-gold/40 flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-seoralink-text-muted uppercase tracking-wider">Active Partner</span>
              <span className="w-2 h-2 rounded-full bg-seoralink-green animate-ping"></span>
            </div>
            <div className="text-xl font-bold text-white mt-2 flex items-center gap-2">
              <span className="font-mono text-sm text-seoralink-gold">{walletAddress}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-seoralink-border-subtle flex items-center justify-between">
            <span className="text-xs text-seoralink-text-muted">Rank Status:</span>
            <span className="badge-gold">T{currentTier - 1} &bull; {TIER_NAMES[currentTier - 1]}</span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card-seoralink border-seoralink-border-subtle bg-seoralink-bg-card/80 flex flex-col justify-between p-5">
            <div className="flex justify-between items-center text-xs font-mono text-seoralink-text-muted uppercase">
              <span>Total Protocol Earnings</span>
              <ArrowUpRight size={16} className="text-seoralink-green" />
            </div>
            <div className="text-3xl font-mono text-seoralink-green font-bold my-2">
              ${totalEarnings.toFixed(2)}{' '}
              <span className="text-xs font-normal text-seoralink-text-muted">USDT</span>
            </div>
            <span className="text-[10px] text-seoralink-text-muted font-mono">Net non-custodial payouts</span>
          </div>

          <div className="card-seoralink border-seoralink-border-subtle bg-seoralink-bg-card/80 flex flex-col justify-between p-5">
            <div className="flex justify-between items-center text-xs font-mono text-seoralink-text-muted uppercase">
              <span>Global Queue Rank</span>
              <GitCommit size={16} className="text-seoralink-cyan" />
            </div>
            <div className="text-3xl font-mono text-seoralink-cyan font-bold my-2">
              #{queuePos}
            </div>
            <span className="text-[10px] text-seoralink-text-muted font-mono">Moving via 2-ID global spillover</span>
          </div>

          <div className="card-seoralink border-seoralink-border-subtle bg-seoralink-bg-card/80 flex flex-col justify-between p-5">
            <div className="flex justify-between items-center text-xs font-mono text-seoralink-text-muted uppercase">
              <span>Direct Team Network</span>
              <Users size={16} className="text-seoralink-purple" />
            </div>
            <div className="text-3xl font-mono text-white font-bold my-2">
              {directs} <span className="text-xs font-normal text-seoralink-text-muted">/ 6 Directs</span>
            </div>
            <span className="text-[10px] text-seoralink-text-muted font-mono">Unlocks up to Tier 8 (Elite)</span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-seoralink-border-subtle pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'Ecosystem Overview', icon: Layers },
          { id: 'queue', label: 'Tripod Queue Engine', icon: GitCommit },
          { id: 'calculator', label: 'Rewards Calculator', icon: Calculator },
          { id: 'referrals', label: 'Partner Hub', icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-seoralink-gold text-black shadow-md'
                : 'bg-seoralink-bg-surface/80 text-seoralink-text-muted hover:text-white border border-seoralink-border-subtle'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* 12-Tier Escalation Ladder */}
      {(activeTab === 'all' || activeTab === 'queue') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-seoralink-gold rounded-full inline-block"></span>
              The 12-Rank Doubling Ladder
            </h2>
            <span className="text-xs font-mono text-seoralink-text-muted">Cumulative Pool: $40,950 USDT</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {TIER_NAMES.map((name, idx) => {
              const tierNum = idx + 1;
              const isCompleted = tierNum < currentTier;
              const isActive = tierNum === currentTier;
              return (
                <TierCard
                  key={tierNum}
                  tierNumber={tierNum}
                  tierName={name}
                  value={TIER_VALUES[idx]}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Queue Visualizer Engine */}
      {(activeTab === 'all' || activeTab === 'queue') && (
        <QueueVisualizer
          currentTier={currentTier}
          queuePosition={queuePos}
          totalInQueue={88}
        />
      )}

      {/* Reward Calculator Section */}
      {(activeTab === 'all' || activeTab === 'calculator') && (
        <RewardCalculator />
      )}

      {/* Referral Hub Section */}
      {(activeTab === 'all' || activeTab === 'referrals') && (
        <ReferralSystem
          walletAddress={walletAddress}
          directCount={directs}
          currentTier={currentTier}
          totalOverrideEarned={32.00}
        />
      )}

      {/* Real-time Ledger Stream */}
      <div className="card-seoralink border-seoralink-border-subtle bg-seoralink-bg-card/90 space-y-4">
        <div className="flex items-center justify-between border-b border-seoralink-border-subtle pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-seoralink-gold" />
            Verified Smart Contract Event Log
          </h3>
          <span className="text-[11px] font-mono text-seoralink-cyan">BSC Testnet &bull; Block #42891004</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-seoralink-border-subtle text-seoralink-text-muted text-[10px] uppercase">
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Recipient Address</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-seoralink-border-subtle/50 text-seoralink-text-body">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-seoralink-green">QueueMatched</td>
                <td className="py-2.5 px-3">Tier 2 (Alpha)</td>
                <td className="py-2.5 px-3 text-white">$20.00</td>
                <td className="py-2.5 px-3 text-seoralink-cyan">0x71C...49Ae</td>
                <td className="py-2.5 px-3"><span className="text-seoralink-green font-bold">&bull; Settled</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-seoralink-purple">OverridePaid</td>
                <td className="py-2.5 px-3">Tier 2 (Alpha)</td>
                <td className="py-2.5 px-3 text-white">$1.00</td>
                <td className="py-2.5 px-3 text-seoralink-purple">0x92B...31Fa</td>
                <td className="py-2.5 px-3"><span className="text-seoralink-green font-bold">&bull; Settled</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-seoralink-gold">RankUpgrade</td>
                <td className="py-2.5 px-3">Tier 2 &rarr; Tier 3</td>
                <td className="py-2.5 px-3 text-white">Auto-Promote</td>
                <td className="py-2.5 px-3 text-seoralink-cyan">0x71C...49Ae</td>
                <td className="py-2.5 px-3"><span className="text-seoralink-green font-bold">&bull; In Queue</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-seoralink-cyan-bright">UserRegistered</td>
                <td className="py-2.5 px-3">Tier 0 (Junior)</td>
                <td className="py-2.5 px-3 text-white">$10.00</td>
                <td className="py-2.5 px-3 text-white">0xE4A...82Cc</td>
                <td className="py-2.5 px-3"><span className="text-seoralink-green font-bold">&bull; Activated</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
