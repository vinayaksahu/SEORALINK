"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Menu,
  X,
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

interface AdminMobileNavProps {
  fullName?: string;
}

export function AdminMobileNav({ fullName }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const adminNav = [
    { href: "/admin", label: "Executive Overview", icon: LayoutDashboard },
    { href: "/admin/deposits", label: "Deposit Requests", icon: Wallet },
    { href: "/admin/withdrawals", label: "Withdrawal Requests", icon: ArrowUpRight },
    { href: "/admin/users", label: "Member Directory", icon: Users },
    { href: "/admin/queue", label: "Queue Monitor", icon: GitCommit },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
  ];

  return (
    <>
      {/* Menu Toggle Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-red-500 dark:text-red-400 bg-white dark:bg-[#0d1424] border border-red-500/40 shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500/50 shrink-0 cursor-pointer"
        aria-label="Open Admin Menu"
        title="Open Admin menu"
      >
        <Menu size={22} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] h-[100dvh] max-h-[100dvh] bg-white dark:bg-[#070a14] border-r border-red-500/30 z-[70] flex flex-col shadow-2xl transition-all duration-300 ease-in-out md:hidden ${
          isOpen
            ? "translate-x-0 opacity-100 pointer-events-auto visible"
            : "-translate-x-full opacity-0 pointer-events-none invisible"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation"
      >
        {/* 1. Header (shrink-0) */}
        <div className="shrink-0 p-4 border-b border-red-500/20 flex items-center justify-between bg-slate-50 dark:bg-[#040711]">
          <Link href="/admin" onClick={() => setIsOpen(false)}>
            <Logo size={28} />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1e293b]/60 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Scrollable Middle */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Admin Badge */}
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-[#1e293b]/60 bg-red-50 dark:bg-red-950/20 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500 dark:text-red-400" />
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest">
              Master Admin Console
            </span>
          </div>

          {/* Operator info */}
          {fullName && (
            <div className="px-4 py-2 border-b border-slate-200 dark:border-[#1e293b]/40 text-xs text-slate-500 dark:text-[#94a3b8]">
              Operator: <strong className="text-slate-900 dark:text-white">{fullName}</strong>
            </div>
          )}

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {adminNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "text-red-600 dark:text-white bg-red-50 dark:bg-[#0d1424] border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0d1424] border border-transparent hover:border-red-500/30"
                  }`}
                >
                  <Icon size={16} className="text-red-500 dark:text-red-400" />
                  <span>{label}</span>
                </Link>
              );
            })}

            <div className="pt-2">
              <Link
                href="/member/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-[#0284c7] dark:text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 transition-all"
              >
                <span>Switch to User Portal</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </nav>
        </div>

        {/* 3. Docked Footer (shrink-0) */}
        <div className="shrink-0 border-t border-slate-200 dark:border-[#1e293b]/60 bg-slate-50 dark:bg-[#040711] p-3 space-y-2.5 pb-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider">
              Theme Mode
            </span>
            <ThemeToggle variant="segmented" size="xs" showLabels={false} />
          </div>

          <form action="/api/auth/logout" method="POST" className="m-0 p-0">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-red-500 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer active:scale-98 shadow-sm"
            >
              <LogOut size={16} />
              <span>Sign Out Admin</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
