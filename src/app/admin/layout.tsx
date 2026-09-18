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
  Zap,
  LifeBuoy,
  Database,
  GitBranch,
} from "lucide-react";
import { AdminMobileNav } from "@/components/AdminMobileNav";
import { LanguageSelector } from "@/components/LanguageSelector";

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
    { href: "/admin/tickets", label: "Support Tickets", icon: LifeBuoy },
    { href: "/admin/users", label: "Member Directory", icon: Users },
    { href: "/admin/tree", label: "Network Tree View", icon: GitBranch },
    { href: "/admin/queue", label: "Queue Monitor", icon: GitCommit },
    { href: "/admin/simulator", label: "Simulation Engine", icon: Zap },
    { href: "/admin/backup", label: "Database Backup", icon: Database },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#040711] text-slate-900 dark:text-[#e2e8f0] flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-[#040711]/85 border-b border-red-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <AdminMobileNav fullName={session.fullName} />
            <Link href="/admin" className="flex items-center shrink-0">
              <div className="sm:hidden">
                <Logo size={28} showText={false} />
              </div>
              <div className="hidden sm:block">
                <Logo size={32} showText={true} />
              </div>
            </Link>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider hidden lg:flex items-center gap-2 border-l border-red-500/30 pl-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>Enterprise Admin Console</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSelector variant="compact" />
            <ThemeToggle variant="compact" size="sm" showLabels={false} />
            <div className="text-xs text-slate-600 dark:text-[#94a3b8] hidden sm:block">
              Operator: <strong className="text-slate-900 dark:text-white">{session.fullName}</strong>
            </div>
            <form action="/api/auth/logout?redirect=/adminlogin" method="POST" className="m-0 p-0 hidden sm:block">
              <input type="hidden" name="redirect" value="/adminlogin" />
              <button
                type="submit"
                title="Sign Out Admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-500 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
