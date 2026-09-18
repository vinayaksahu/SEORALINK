import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
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
  LifeBuoy,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { MemberMobileNav } from "@/components/MemberMobileNav";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TIER_VALUES } from "@/lib/constants";
import { checkPendingRankPromotions } from "@/lib/queueEngine";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Ensure rank upgrades are applied
  await checkPendingRankPromotions(session.userId);

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
  const rankPoolBalance = (user.status === "ACTIVE" && !hasWithdrawnRankPool && user.currentTier > 0)
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
    { href: "/member/support", label: "Support Tickets", icon: LifeBuoy },
  ];

  const cookieStore = await cookies();
  const isImpersonating = Boolean(cookieStore.get("sl_admin_session")?.value);

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
    <div className="min-h-screen bg-[#040711] text-[#e2e8f0] flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* Admin Impersonation Notice Banner */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 text-white text-xs font-bold px-3 sm:px-6 py-2 flex items-center justify-between shadow-xl sticky top-0 z-50 border-b border-white/20">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 animate-pulse text-amber-200" />
            <span>
              Admin Impersonation Active: Viewing portal as <strong className="underline text-white">{user.fullName}</strong> ({user.customId})
            </span>
          </div>
          <form action="/api/admin/impersonate/exit" method="POST" className="m-0 p-0">
            <button
              type="submit"
              className="bg-black/60 hover:bg-black/80 border border-white/40 text-white px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
            >
              <ArrowLeft size={13} />
              <span>Return to Admin Console</span>
            </button>
          </form>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-[#040711]/85 border-b border-slate-200 dark:border-[#d4af37]/20 px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          {/* Left: Navigation Drawer Button + Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <MemberMobileNav user={serializedUser} isImpersonating={isImpersonating} />
            <Link href="/member/dashboard" className="flex items-center shrink-0">
              <div className="sm:hidden">
                <Logo size={28} showText={false} />
              </div>
              <div className="hidden sm:block">
                <Logo size={32} showText={true} />
              </div>
            </Link>
          </div>

          <div className="text-xs text-slate-600 dark:text-[#94a3b8] hidden lg:block truncate max-w-[220px]">
            Welcome back, <strong className="text-slate-900 dark:text-white">{user.fullName}</strong>
          </div>

          {/* Live Dual Wallet Counters, Language & Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Header Language & Theme Switchers */}
            <LanguageSelector variant="compact" />
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
