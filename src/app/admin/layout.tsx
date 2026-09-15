import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ShieldAlert,
  Users,
  Wallet,
  ArrowUpRight,
  GitCommit,
  Settings,
  LogOut,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { AdminMobileNav } from "@/components/AdminMobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const adminNav = [
    { href: "/admin", label: "Executive Overview", icon: LayoutDashboard },
    { href: "/admin/deposits", label: "Deposit Requests", icon: Wallet },
    { href: "/admin/withdrawals", label: "Withdrawal Requests", icon: ArrowUpRight },
    { href: "/admin/users", label: "Member Directory", icon: Users },
    { href: "/admin/queue", label: "Queue Monitor", icon: GitCommit },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#040711] text-slate-900 dark:text-[#e2e8f0] flex selection:bg-[#d4af37] selection:text-black">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#070a14] border-r border-red-500/20 flex flex-col justify-between hidden md:flex fixed h-full z-30">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-red-500/20 flex items-center justify-between">
            <Link href="/admin">
              <Logo size={32} />
            </Link>
          </div>

          {/* Admin Tag */}
          <div className="px-6 py-3 border-b border-slate-200 dark:border-[#1e293b]/60 bg-red-50 dark:bg-red-950/20 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500 dark:text-red-400" />
            <span className="text-[11px] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest">
              Master Admin Mode
            </span>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {adminNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0d1424] hover:border-red-500/40 border border-transparent transition-all"
              >
                <Icon size={16} className="text-red-500 dark:text-red-400" />
                <span>{label}</span>
              </Link>
            ))}

            <Link
              href="/member/dashboard"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold text-[#0284c7] dark:text-[#38bdf8] hover:bg-[#38bdf8]/10 border border-[#38bdf8]/30 transition-all mt-6"
            >
              <span>Switch to User Portal</span>
              <ChevronRight size={14} />
            </Link>
          </nav>
        </div>

        {/* Bottom Area: Theme Switcher + Logout */}
        <div>
          <div className="p-4 border-t border-slate-200 dark:border-[#1e293b]/60">
            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94a3b8] tracking-wider mb-2">
              Theme Mode
            </div>
            <ThemeToggle variant="segmented" size="xs" className="w-full justify-between" />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-[#1e293b]/60">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-[#94a3b8] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out Admin</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-[#040711]/85 border-b border-red-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="md:hidden shrink-0">
              <AdminMobileNav fullName={session.fullName} />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="hidden sm:inline">SEORALINK Enterprise Administrator Console</span>
              <span className="sm:hidden">Admin Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle variant="compact" size="sm" showLabels={false} />
            <div className="text-xs text-slate-600 dark:text-[#94a3b8] hidden sm:block">
              Operator: <strong className="text-slate-900 dark:text-white">{session.fullName}</strong>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
