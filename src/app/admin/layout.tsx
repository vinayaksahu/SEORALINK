import React from "react";
import Link from "next/link";
import { getSession, isAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
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
  UserCheck,
} from "lucide-react";
import { AdminMobileNav } from "@/components/AdminMobileNav";
import { LanguageSelector } from "@/components/LanguageSelector";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/adminlogin");
  }

  const cookieStore = await cookies();
  const isSuperImpersonating = Boolean(cookieStore.get("sl_super_session")?.value);

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
    { href: "/admin/profile", label: "My Profile", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#040711] text-slate-900 dark:text-[#e2e8f0] flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* Super Root Impersonation Banner */}
      {isSuperImpersonating && (
        <div className="bg-gradient-to-r from-rose-950 via-amber-950 to-rose-950 border-b border-rose-500/40 text-amber-300 px-4 py-2 text-xs font-mono flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span>
              <strong className="text-white uppercase tracking-wider">Super Root Master Console:</strong> Impersonating Branch Admin{" "}
              <span className="text-amber-400 font-bold">{session.fullName} ({session.customId})</span>
            </span>
          </div>
          <form action="/api/superadmin/impersonate/exit" method="POST">
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow cursor-pointer"
            >
              Exit to Super Root Admin &rarr;
            </button>
          </form>
        </div>
      )}

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
            <Link
              href="/member/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-500 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all"
              title="Switch to User Portal"
            >
              <span>User Portal</span>
              <ArrowUpRight size={13} />
            </Link>

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
