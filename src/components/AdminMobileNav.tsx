"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
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
      {/* Triple line button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
        aria-label="Open Admin Menu"
        title="Admin Menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-[#070a14] border-r border-red-500/30 z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation"
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-red-500/20 flex items-center justify-between bg-[#040711]">
            <Link href="/admin" onClick={() => setIsOpen(false)}>
              <Logo size={28} />
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 border border-transparent transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Admin badge */}
          <div className="px-5 py-3 border-b border-[#1e293b]/60 bg-red-950/25 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                Master Admin Mode
              </span>
              {fullName && (
                <span className="text-xs text-white font-semibold">{fullName}</span>
              )}
            </div>
          </div>

          {/* Nav items */}
          <nav className="p-3 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Management
            </div>
            {adminNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "text-white bg-[#0d1424] border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      : "text-[#94a3b8] hover:text-white hover:bg-[#0d1424] border border-transparent hover:border-red-500/30"
                  }`}
                >
                  <Icon size={17} className="text-red-400" />
                  <span>{label}</span>
                </Link>
              );
            })}

            <div className="pt-4">
              <Link
                href="/member/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 transition-all"
              >
                <span>Switch to User Portal</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-[#1e293b]/60 bg-[#040711]">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 transition-colors"
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
