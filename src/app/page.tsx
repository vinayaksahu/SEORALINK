import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS, CUMULATIVE_REWARDS } from "@/lib/constants";
import { ArrowRight, ShieldCheck, Zap, Users, Trophy, ChevronRight, CheckCircle2 } from "lucide-react";
import { LandingMobileNav } from "@/components/LandingMobileNav";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#040711] text-[#e2e8f0] flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#040711]/85 border-b border-[#d4af37]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo size={38} />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
            <a href="#about" className="hover:text-[#d4af37] transition-colors">Enterprise</a>
            <a href="#ladder" className="hover:text-[#d4af37] transition-colors">12 Tiers</a>
            <a href="#queue" className="hover:text-[#d4af37] transition-colors">Tripod Queue</a>
            <a href="#rewards" className="hover:text-[#d4af37] transition-colors">Overrides</a>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-white hover:text-[#d4af37] transition-colors border border-transparent hover:border-[#d4af37]/30 rounded-lg"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              Register <ArrowRight size={14} />
            </Link>
          </div>

          <LandingMobileNav />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-28 px-6 overflow-hidden">
          {/* Subtle Glow Accents */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#d4af37]/5 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#38bdf8]/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37] text-xs font-bold uppercase tracking-widest">
              <span>SEOUL, SOUTH KOREA &bull; GLOBAL AFFILIATE ECOSYSTEM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
              SEORA<span className="text-[#d4af37]">LINK</span>
            </h1>

            <p className="text-base sm:text-xl font-bold uppercase tracking-widest text-[#38bdf8] max-w-3xl mx-auto">
              Korean Business Network &bull; Global Single-Leg Architecture
            </p>

            <p className="text-sm sm:text-base text-[#cbd5e1] max-w-2xl mx-auto leading-relaxed">
              A premier international business platform engineered on universal queue progression, predictable mathematical advancement, and high-performance dual-tier rewards.
            </p>

            {/* 4 Core Pillars Badges (Slide 01) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-4xl mx-auto">
              <div className="card-seoralink p-5 text-center border-[#d4af37]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#d4af37]">$10 USDT</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Micro-Entry</div>
              </div>

              <div className="card-seoralink p-5 text-center border-[#38bdf8]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#38bdf8]">12 Tiers</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Doubling Ladder</div>
              </div>

              <div className="card-seoralink p-5 text-center border-[#10b981]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#10b981]">5% + 5%</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Dual Overrides</div>
              </div>

              <div className="card-seoralink p-5 text-center border-[#a855f7]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#a855f7]">$40,950</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Rank Rewards</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="btn-primary px-8 py-4 text-sm font-extrabold flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Join Global Network <ChevronRight size={18} />
              </Link>
              <Link
                href="/login"
                className="btn-secondary px-8 py-4 text-sm font-bold w-full sm:w-auto justify-center text-center"
              >
                Member Portal Access
              </Link>
            </div>
          </div>
        </section>

        {/* 12-Tier Ladder Table Section */}
        <section id="ladder" className="py-20 px-6 bg-[#070a14] border-t border-b border-[#d4af37]/15">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="badge-gold">Predictable Mathematical Logic</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">The 12-Rank Doubling Ladder</h2>
              <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl mx-auto">
                Deterministic 2:1 progression. Every rank doubles in value, culminating in the $20,480 Ultima pinnacle tier.
              </p>
            </div>

            <div className="overflow-x-auto card-seoralink border-[#d4af37]/25 p-2">
              <table className="w-full text-left font-mono-num text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d4af37]/30 text-[#d4af37] bg-[#0d1424] text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Tier #</th>
                    <th className="py-3 px-4">Rank Name</th>
                    <th className="py-3 px-4">Entry / Value</th>
                    <th className="py-3 px-4">Directs Req.</th>
                    <th className="py-3 px-4">Gross Reward</th>
                    <th className="py-3 px-4">Reserve Fee</th>
                    <th className="py-3 px-4 text-[#10b981]">Net Payout</th>
                    <th className="py-3 px-4 text-[#38bdf8]">5% Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60 text-[#cbd5e1]">
                  {TIER_NAMES.map((name, idx) => {
                    const val = TIER_VALUES[idx];
                    const directs = REQUIRED_DIRECTS[idx];
                    const deductionRate = idx === 12 ? "10%" : "20%";
                    const net = idx === 0 ? "—" : `$${(val * (idx === 12 ? 0.9 : 0.8)).toLocaleString()}`;
                    const override = idx === 0 ? "$0.50 (Direct)" : `$${(val * 0.05).toFixed(2)}`;

                    return (
                      <tr key={name} className="hover:bg-[#0f172a]/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{idx}</td>
                        <td className="py-3 px-4 font-bold text-[#d4af37]">{name}</td>
                        <td className="py-3 px-4 font-bold text-white">${val.toLocaleString()}</td>
                        <td className="py-3 px-4 text-[#94a3b8]">{directs} Directs</td>
                        <td className="py-3 px-4 font-bold text-white">{idx === 0 ? "—" : `$${val.toLocaleString()}`}</td>
                        <td className="py-3 px-4 text-[#94a3b8]">{idx === 0 ? "—" : deductionRate}</td>
                        <td className="py-3 px-4 font-bold text-[#10b981]">{net}</td>
                        <td className="py-3 px-4 text-[#38bdf8] font-semibold">{override}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 2:1 Tripod Single-Leg Queue Section */}
        <section id="queue" className="py-20 px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="badge-cyan">Proprietary Queue Algorithm</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Signature Tripod Model (2:1 Law)</h2>
              <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl mx-auto">
                Zero structural balancing. Every rank requires exactly 2 matching units to trigger net reward payout and automatic promotion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-seoralink p-6 space-y-4 border-l-4 border-l-[#d4af37]">
                <div className="text-lg font-bold text-white">1. Single Global Line</div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  All participants enter a single, unified FIFO sequence. No left/right leg splits, no weak-leg requirements, and zero point flushing.
                </p>
              </div>

              <div className="card-seoralink p-6 space-y-4 border-l-4 border-l-[#38bdf8]">
                <div className="text-lg font-bold text-white">2. Two-ID Matching Law</div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Unit 1 funds the member's net cashout. Unit 2 funds the entry into the next doubling tier. Deterministic velocity guaranteed.
                </p>
              </div>

              <div className="card-seoralink p-6 space-y-4 border-l-4 border-l-[#10b981]">
                <div className="text-lg font-bold text-white">3. Four Global Streams</div>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Queue movement powered by direct upline teams, global spillover, international crossline growth, and lower-tier compounding.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d4af37]/20 bg-[#070a14] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size={32} />
          <div className="text-xs text-[#94a3b8] text-center md:text-right space-y-1">
            <p className="font-semibold text-white">SEORALINK &bull; Korean Business Network</p>
            <p>Seoul Corporate Headquarters &bull; Global Operations</p>
            <p className="text-[#64748b] text-[10px]">&copy; 2026 SEORALINK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
