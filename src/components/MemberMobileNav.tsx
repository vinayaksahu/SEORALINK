"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Menu,
  X,
  LayoutDashboard,
  GitCommit,
  Wallet,
  Zap,
  ArrowUpRight,
  Users,
  FileText,
  LogOut,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";

interface MemberMobileNavProps {
  user: {
    customId: string;
    fullName: string;
    fundBalance: any;
    incomeBalance: any;
    status: string;
    role: string;
  };
}

export function MemberMobileNav({ user }: MemberMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scrolling when drawer is open and handle ESC key
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

  const navLinks = [
    { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/member/queue", label: "Tripod Queue", icon: GitCommit },
    { href: "/member/activate", label: "Activate $10", icon: Zap },
    { href: "/member/deposit", label: "Deposit USDT", icon: Wallet },
    { href: "/member/withdraw", label: "Withdraw", icon: ArrowUpRight },
    { href: "/member/team", label: "Team Network", icon: Users },
    { href: "/member/ledger", label: "Ledger History", icon: FileText },
  ];

  const fundVal = parseFloat(user.fundBalance?.toString() || "0").toFixed(2);
  const incomeVal = parseFloat(user.incomeBalance?.toString() || "0").toFixed(2);

  return (
    <>
      {/* Triple-line (Hamburger) Trigger Button for Mobile */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-[#d4af37] bg-[#0d1424] border border-[#d4af37]/40 shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 shrink-0 cursor-pointer"
        aria-label="Open navigation menu"
        title="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Slide-out Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Side Menu Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] h-[100dvh] max-h-[100dvh] bg-[#070a14] border-r border-[#d4af37]/30 z-[70] flex flex-col shadow-2xl transition-all duration-300 ease-in-out md:hidden ${
          isOpen
            ? "translate-x-0 opacity-100 pointer-events-auto visible"
            : "-translate-x-full opacity-0 pointer-events-none invisible"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        {/* 1. TOP HEADER (shrink-0) */}
        <div className="shrink-0 p-4 border-b border-[#d4af37]/20 flex items-center justify-between bg-[#040711]">
          <Link href="/member/dashboard" onClick={() => setIsOpen(false)}>
            <Logo size={28} />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 border border-transparent hover:border-[#d4af37]/40 transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. SCROLLABLE MIDDLE (flex-1 min-h-0 overflow-y-auto overscroll-contain) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* User ID / Status Info Box */}
          <div className="px-4 py-3 border-b border-[#1e293b]/60 bg-[#0b1120]">
            <div className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
              Connected Member
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono-num font-bold text-[#d4af37] text-sm">
                {user.customId}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  user.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}
              >
                {user.status}
              </span>
            </div>
            <div className="text-xs text-[#cbd5e1] font-semibold mt-1 truncate">
              {user.fullName}
            </div>
          </div>

          {/* Quick Balances Compact Box */}
          <div className="p-3 border-b border-[#1e293b]/60 bg-[#070a14]">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg border border-[#38bdf8]/30 bg-[#0d1424]">
                <div className="text-[9px] font-mono-num uppercase text-[#94a3b8]">Fund Wallet</div>
                <div className="font-mono-num font-bold text-[#38bdf8] text-xs mt-0.5">
                  ${fundVal}
                </div>
              </div>
              <div className="p-2 rounded-lg border border-[#10b981]/30 bg-[#0d1424]">
                <div className="text-[9px] font-mono-num uppercase text-[#94a3b8]">Income Wallet</div>
                <div className="font-mono-num font-bold text-[#10b981] text-xs mt-0.5">
                  ${incomeVal}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Navigation
            </div>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "text-white bg-[#0d1424] border border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                      : "text-[#94a3b8] hover:text-white hover:bg-[#0d1424] border border-transparent hover:border-[#d4af37]/30"
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? "text-[#d4af37]" : "text-[#38bdf8]"}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}

            {/* Admin console link if authorized */}
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <div className="pt-2">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-[#d4af37] bg-[#d4af37]/5 hover:bg-[#d4af37]/15 border border-[#d4af37]/40 transition-all"
                >
                  <ShieldCheck size={16} />
                  <span>Admin Console</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* 3. PERMANENTLY DOCKED BOTTOM FOOTER (shrink-0) */}
        <div className="shrink-0 border-t border-[#1e293b]/80 bg-[#040711] p-3 space-y-2.5 pb-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Theme Mode
            </span>
            <ThemeToggle variant="segmented" size="xs" showLabels={false} />
          </div>

          <form action="/api/auth/logout" method="POST" className="m-0 p-0">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 hover:border-red-500/60 transition-colors cursor-pointer active:scale-98 shadow-sm"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
