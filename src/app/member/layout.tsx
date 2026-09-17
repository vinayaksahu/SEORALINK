import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  GitCommit,
  Wallet,
  Zap,
  ArrowUpRight,
  Users,
  FileText,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { MemberMobileNav } from "@/components/MemberMobileNav";
import { TIER_VALUES } from "@/lib/constants";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      customId: true,
      fullName: true,
      fundBalance: true,
      incomeBalance: true,
      currentTier: true,
      status: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const existingRankWithdrawal = await db.withdrawalRequest.findFirst({
    where: {
      userId: user.id,
      adminNote: { contains: "CASHOUT" },
      status: { not: "REJECTED" },
    },
  });
  const hasWithdrawnRankPool = Boolean(existingRankWithdrawal);
  const rankPoolBalance = (user.status === "ACTIVE" && !hasWithdrawnRankPool)
    ? (TIER_VALUES[user.currentTier] || 0)
    : 0;

  const navLinks = [
    { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/member/queue", label: "Tripod Queue", icon: GitCommit },
    { href: "/member/activate", label: "Activate $10", icon: Zap },
    { href: "/member/deposit", label: "Deposit USDT", icon: Wallet },
    { href: "/member/withdraw", label: "Withdraw", icon: ArrowUpRight },
    { href: "/member/team", label: "Team Network", icon: Users },
    { href: "/member/ledger", label: "Ledger History", icon: FileText },
  ];

  const serializedUser = {
    customId: user.customId,
    fullName: user.fullName,
    fundBalance: user.fundBalance ? Number(user.fundBalance) : 0,
    incomeBalance: user.incomeBalance ? Number(user.incomeBalance) : 0,
    rankPoolBalance,
    hasWithdrawnRankPool,
    status: user.status,
    role: user.role,
  };

  return (
    <div className="min-h-screen bg-[#040711] text-[#e2e8f0] flex selection:bg-[#d4af37] selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 bg-[#070a14] border-r border-[#d4af37]/20 flex flex-col justify-between hidden md:flex fixed h-full z-30">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-[#d4af37]/20 flex items-center justify-between">
            <Link href="/member/dashboard">
              <Logo size={32} />
            </Link>
          </div>

          {/* User ID Pill */}
          <div className="px-6 py-4 border-b border-[#1e293b]/60 bg-[#0b1120]">
            <div className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
              Connected Member
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono-num font-bold text-[#d4af37] text-sm">{user.customId}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}>
                {user.status}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-[#94a3b8] hover:text-white hover:bg-[#0d1424] hover:border-[#d4af37]/40 border border-transparent transition-all"
              >
                <Icon size={16} className="text-[#38bdf8]" />
                <span>{label}</span>
              </Link>
            ))}

            {/* Admin shortcut if authorized */}
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-[#d4af37] hover:bg-[#d4af37]/10 border border-[#d4af37]/30 transition-all mt-4"
              >
                <ShieldCheck size={16} />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Theme Switcher Sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1e293b]/60">
          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94a3b8] tracking-wider mb-2">
            Theme Mode
          </div>
          <ThemeToggle variant="segmented" size="xs" className="w-full justify-between" />
        </div>

        {/* Logout Bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1e293b]/60">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-[#94a3b8] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-[#040711]/85 border-b border-slate-200 dark:border-[#d4af37]/20 px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          {/* Left: Mobile menu button + Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="md:hidden shrink-0">
              <MemberMobileNav user={serializedUser} />
            </div>
            <Link href="/member/dashboard" className="flex items-center shrink-0">
              <Logo size={28} showText={false} />
            </Link>
          </div>

          <div className="text-xs text-slate-600 dark:text-[#94a3b8] hidden lg:block truncate max-w-[220px]">
            Welcome back, <strong className="text-slate-900 dark:text-white">{user.fullName}</strong>
          </div>

          {/* Live Dual Wallet Counters & Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Header Theme Switcher */}
            <ThemeToggle variant="compact" size="sm" showLabels={false} />

            {/* Commission Wallet */}
            <Link
              href="/member/withdraw"
              title="Commission Wallet (Direct & Mentorship Overrides)"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#10b981]/30 bg-white dark:bg-[#0d1424] hover:border-[#10b981] transition-all"
            >
              <span className="text-[9px] sm:text-[10px] font-mono-num uppercase text-slate-500 dark:text-[#94a3b8]">Comm:</span>
              <span className="font-mono-num font-bold text-[#059669] dark:text-[#10b981] text-xs">
                ${parseFloat(user.incomeBalance?.toString() || "0").toFixed(2)}
              </span>
            </Link>

            {/* Rank Pool Wallet */}
            <Link
              href="/member/withdraw"
              title="Rank Pool Wallet (One-Time Exit)"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#d4af37]/40 bg-white dark:bg-[#0d1424] hover:border-[#d4af37] transition-all"
            >
              <span className="text-[9px] sm:text-[10px] font-mono-num uppercase text-slate-500 dark:text-[#94a3b8]">Rank Pool:</span>
              <span className="font-mono-num font-bold text-[#b45309] dark:text-[#d4af37] text-xs">
                ${rankPoolBalance.toFixed(2)}
              </span>
            </Link>

            {/* Deposit CTA */}
            <Link
              href="/member/deposit"
              className="btn-primary text-[11px] font-bold px-3 py-1.5 hidden sm:inline-block"
            >
              + Deposit
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
