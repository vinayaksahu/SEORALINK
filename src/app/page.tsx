import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS, CUMULATIVE_REWARDS } from "@/lib/constants";
import { ArrowRight, ShieldCheck, Zap, Users, Trophy, ChevronRight, CheckCircle2 } from "lucide-react";
import { LandingMobileNav } from "@/components/LandingMobileNav";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#040711] text-slate-900 dark:text-[#e2e8f0] flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#040711]/85 border-b border-slate-200 dark:border-[#d4af37]/20 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <Logo size={34} />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8]">
            <a href="#about" className="hover:text-[#d4af37] transition-colors">Enterprise</a>
            <a href="#ladder" className="hover:text-[#d4af37] transition-colors">12 Tiers</a>
            <a href="#queue" className="hover:text-[#d4af37] transition-colors">Tripod Queue</a>
            <a href="#rewards" className="hover:text-[#d4af37] transition-colors">Overrides</a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {/* Desktop Language + Theme Switcher + Auth CTAs */}
            <div className="hidden sm:flex items-center gap-3">
              <LanguageSelector variant="compact" />
              <ThemeToggle variant="segmented" size="xs" />
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold text-slate-800 dark:text-white hover:text-[#d4af37] transition-colors border border-transparent hover:border-[#d4af37]/30 rounded-lg"
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

            {/* Mobile Actions: Language + Compact Theme Switcher + Mobile Drawer */}
            <div className="sm:hidden flex items-center gap-2 shrink-0">
              <LanguageSelector variant="compact" />
              <ThemeToggle variant="compact" size="sm" showLabels={false} />
              <LandingMobileNav />
            </div>
            <div className="hidden sm:max-md:block md:hidden shrink-0">
              <LandingMobileNav />
            </div>
          </div>
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

            {/* 4 Core Pillars Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-4xl mx-auto">
              <div className="card-seoralink p-5 text-center border-[#d4af37]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#d4af37]">$10 USDT</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Micro-Entry</div>
              </div>

              <div className="card-seoralink p-5 text-center border-[#38bdf8]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#38bdf8]">12 Tiers</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Doubling Ladder</div>
              </div>

              <div className="card-seoralink p-5 text-center border-[#a855f7]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#a855f7]">5% + 5%</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Dual Overrides</div>
              </div>

              <div className="card-seoralink p-5 text-center border-[#10b981]/40">
                <div className="text-2xl sm:text-3xl font-mono-num font-bold text-[#10b981]">$18,432</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">Ultima Peak Net</div>
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

        {/* 12-Tier Master Progression Ladder Section */}
        <section id="ladder" className="py-20 px-6 bg-[#070a14] border-t border-b border-[#d4af37]/15">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="badge-gold">Rolling Auto-Upgrade &bull; Single-Exit Engine</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">The 12-Rank Doubling Ladder</h2>
              <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl mx-auto">
                Deterministic 2:1 progression. Holding rewards rolls 100% forward into the next doubling rank. Exit cashout at any tier or hold to Ultima peak ($18,432.00 Net).
              </p>
            </div>

            <div className="overflow-x-auto card-seoralink border-[#d4af37]/25 p-2">
              <table className="w-full text-left font-mono-num text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d4af37]/30 text-[#d4af37] bg-[#0d1424] text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Rank Tier</th>
                    <th className="py-3.5 px-4">Directs Req.</th>
                    <th className="py-3.5 px-4">Rank Value</th>
                    <th className="py-3.5 px-4 text-[#10b981]">Net Cashout (Exit)</th>
                    <th className="py-3.5 px-4 text-[#fbbf24]">If Held (Auto-Upgrade)</th>
                    <th className="py-3.5 px-4 text-[#38bdf8]">5% Override</th>
                    <th className="py-3.5 px-4">Queue Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60 text-[#cbd5e1]">
                  {TIER_NAMES.map((name, idx) => {
                    const val = TIER_VALUES[idx];
                    const directs = REQUIRED_DIRECTS[idx];
                    const isUltima = idx === 12;
                    const net = idx === 0 ? "—" : isUltima ? "$18,432.00 (90% 🔥)" : `$${(val * 0.8).toFixed(2)} (80%)`;
                    const autoUpgrade = idx === 0 ? "Enters Zen ($10)" : isUltima ? "Cycle Complete (Apex)" : `Rolls 100% to ${TIER_NAMES[idx + 1]} ($${TIER_VALUES[idx + 1]})`;
                    const override = idx === 0 ? "$0.50 (Direct)" : `$${(val * 0.05).toFixed(2)}`;
                    const status = idx === 0 ? "Account Active" : isUltima ? "Pinnacle Exit" : "2 IDs Below";

                    return (
                      <tr
                        key={name}
                        className={`transition-colors ${
                          isUltima
                            ? "bg-[#10b981]/15 font-bold text-white hover:bg-[#10b981]/25"
                            : "hover:bg-[#0f172a]/50"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-[#d4af37] flex items-center gap-1.5">
                          {isUltima && <span className="text-[#10b981]">★</span>}
                          {name} {idx > 0 && <span className="text-[#94a3b8] text-[10px] font-normal">(Tier {idx})</span>}
                        </td>
                        <td className="py-3.5 px-4 text-white font-semibold">{directs} Directs</td>
                        <td className="py-3.5 px-4 font-bold text-white font-mono-num">${val.toLocaleString()}</td>
                        <td className={`py-3.5 px-4 font-bold ${isUltima ? "text-[#00f2fe] text-sm" : "text-[#10b981]"}`}>{net}</td>
                        <td className="py-3.5 px-4 text-[#fbbf24] font-semibold">{autoUpgrade}</td>
                        <td className="py-3.5 px-4 text-[#38bdf8] font-bold">{override}</td>
                        <td className="py-3.5 px-4 text-[#94a3b8]">{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="p-4 bg-[#0d1424] border-t border-[#d4af37]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                <span className="text-[#cbd5e1] leading-relaxed">
                  <strong className="text-white">*Withdrawal &amp; ID Governance Policy:</strong> Cashout at Ranks 1–11 incurs a <strong>20% deduction</strong> and <strong>Permanently Bans/Deactivates the ID</strong> (cannot be reactivated; all future commissions &amp; upgrades forfeited). Ultima (Rank 12) cashout incurs only a <strong>10% fee ($18,432.00 Net)</strong>; rank queue ends, but the ID <strong>remains permanently ACTIVE for life</strong> to sponsor directs and earn 5% team mentorship overrides forever (<strong>exclusive to Ultima</strong>). All Commission withdrawals incur a flat <strong>10% deduction</strong>.
                </span>
                <span className="shrink-0 text-[#10b981] font-bold">
                  Pinnacle Ultima Net: <strong className="text-[#00f2fe] text-sm">$18,432.00 USDT</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Protocol Economics & Governance Rules (Slide 17 & 21) */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <span className="badge-gold">Capital Reserve &amp; Operating Rules</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Institutional Protocol Governance</h2>
              <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl mx-auto">
                Deterministic rules protecting global queue momentum, capital liquidity, and participant equity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: Ranks 1-11 */}
              <div className="card-seoralink p-6 border-t-4 border-t-red-500 bg-[#0b1120] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Ranks 1 to 11 (Zen to Legend)</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold border border-red-500/40 text-red-400 bg-red-500/10">SINGLE-EXIT</span>
                </div>
                <h3 className="text-xl font-bold text-white">20% Deduction &bull; Permanent ID Ban</h3>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  Withdrawing rank rewards at intermediate tiers terminates account participation permanently to protect global queue sustainability.
                </p>

                <div className="grid grid-cols-3 gap-3 py-2">
                  <div className="p-2.5 rounded-lg bg-[#070a14] border border-[#38bdf8]/30 text-center">
                    <div className="text-lg font-bold text-[#38bdf8]">80%</div>
                    <div className="text-[9px] uppercase text-[#94a3b8] font-semibold">Net Cashout</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070a14] border border-red-500/30 text-center">
                    <div className="text-lg font-bold text-red-400">20%</div>
                    <div className="text-[9px] uppercase text-[#94a3b8] font-semibold">Protocol Reserve</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070a14] border border-red-500/40 text-center">
                    <div className="text-lg font-bold text-red-500">BANNED</div>
                    <div className="text-[9px] uppercase text-[#94a3b8] font-semibold">ID Terminated</div>
                  </div>
                </div>

                <ul className="text-xs text-[#cbd5e1] space-y-2 border-t border-[#1e293b] pt-3">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">&bull;</span>
                    <span><strong>80% Net Payout:</strong> Credited immediately in USDT to wallet upon intermediate rank withdrawal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">&bull;</span>
                    <span><strong>Permanent Ban:</strong> ID is permanently deactivated and CANNOT be reactivated in the future.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">&bull;</span>
                    <span><strong>Forfeited Rights:</strong> Forfeits all direct sponsoring commissions, team overrides &amp; rank upgrades forever.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Rank 12 Ultima */}
              <div className="card-seoralink p-6 border-t-4 border-t-[#10b981] bg-[#10b981]/5 border-[#10b981]/30 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#10b981] uppercase tracking-wider">Rank 12 Only (Ultima Exclusive)</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold border border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10">LIFETIME ACTIVE</span>
                </div>
                <h3 className="text-xl font-bold text-[#10b981]">10% Fee &bull; Lifetime Active ID</h3>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  Rank queue finishes, but your ID remains permanently ACTIVE for unlimited direct sponsoring &amp; 5% team mentorship overrides!
                </p>

                <div className="grid grid-cols-3 gap-3 py-2">
                  <div className="p-2.5 rounded-lg bg-[#070a14] border border-[#10b981]/40 text-center">
                    <div className="text-lg font-bold text-[#10b981]">90%</div>
                    <div className="text-[9px] uppercase text-[#94a3b8] font-semibold">Net Cashout</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070a14] border border-[#d4af37]/30 text-center">
                    <div className="text-lg font-bold text-white">10%</div>
                    <div className="text-[9px] uppercase text-[#94a3b8] font-semibold">Minimal Fee</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070a14] border border-[#d4af37]/40 text-center">
                    <div className="text-lg font-bold text-[#d4af37]">$18,432</div>
                    <div className="text-[9px] uppercase text-[#94a3b8] font-semibold">Net USDT</div>
                  </div>
                </div>

                <ul className="text-xs text-[#cbd5e1] space-y-2 border-t border-[#1e293b] pt-3">
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold">&bull;</span>
                    <span><strong>10% Fee Payout:</strong> Only 10% fee ($18,432.00 USDT net on $20,480 gross rank value).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold">&bull;</span>
                    <span><strong>Lifetime Active ID:</strong> Rank queue ends, but account stays ACTIVE for life (Ultima only)!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold">&bull;</span>
                    <span><strong>Perpetual Income:</strong> Direct sponsor bonus (5%) + 5% team mentorship overrides ($2,047.50/direct)!</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Commission Policy Banner */}
            <div className="card-seoralink p-4 border border-[#d4af37]/40 bg-[#0d1424] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold">
              <span className="text-[#d4af37]">⚡ COMMISSION WITHDRAWALS: Flat 10% fee on all Direct Sponsor &amp; 5% Team Mentorship overrides.</span>
              <span className="text-[#38bdf8]">Ranks 1–11: 20% Fee (Permanent Ban) &bull; Ultima: 10% Fee (Lifetime Active ID)</span>
            </div>
          </div>
        </section>

        {/* 2:1 Tripod Single-Leg Queue Section */}
        <section id="queue" className="py-20 px-6 bg-[#070a14] border-t border-[#d4af37]/15">
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
                  Unit 1 provides the liquidity for intermediate cashout (80% net). Unit 2 provides capital to roll 100% into the next doubling rank.
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
