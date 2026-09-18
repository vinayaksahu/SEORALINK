"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Menu, X, ArrowRight, LogIn, UserPlus } from "lucide-react";

export function LandingMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
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
    { href: "#about", label: "Enterprise" },
    { href: "#ladder", label: "12 Tiers" },
    { href: "#queue", label: "Tripod Queue" },
    { href: "#rewards", label: "Overrides" },
  ];

  return (
    <>
      {/* Triple line button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-[#d4af37] bg-white dark:bg-[#0d1424] border border-slate-300 dark:border-[#d4af37]/40 shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 shrink-0 cursor-pointer"
        aria-label="Open Navigation Menu"
        title="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-72 max-w-[85vw] h-[100dvh] max-h-[100dvh] bg-white dark:bg-[#070a14] border-l border-slate-200 dark:border-[#d4af37]/30 z-[70] flex flex-col shadow-2xl transition-all duration-300 ease-in-out md:hidden ${
          isOpen
            ? "translate-x-0 opacity-100 pointer-events-auto visible"
            : "translate-x-full opacity-0 pointer-events-none invisible"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site Navigation"
      >
        {/* 1. Header (shrink-0) */}
        <div className="shrink-0 p-4 border-b border-slate-200 dark:border-[#d4af37]/20 flex items-center justify-between bg-slate-50 dark:bg-[#040711]">
          <Link href="/" onClick={() => setIsOpen(false)}>
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

        {/* 2. Scrollable Middle Links */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-1.5">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-[#94a3b8] uppercase tracking-wider">
            Explore
          </div>
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] hover:text-[#d4af37] dark:hover:text-[#d4af37] hover:bg-slate-100 dark:hover:bg-[#0d1424] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* 3. Docked Footer Actions & Theme (shrink-0) */}
        <div className="shrink-0 p-4 border-t border-slate-200 dark:border-[#1e293b]/60 bg-slate-50 dark:bg-[#040711] space-y-3 pb-6">
          <div className="px-1">
            <LanguageSelector variant="drawer" />
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider">
              Theme Mode
            </span>
            <ThemeToggle variant="segmented" size="xs" showLabels={false} />
          </div>

          <div className="space-y-2 pt-1">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-slate-800 dark:text-white border border-[#d4af37]/40 hover:bg-[#d4af37]/10 transition-colors"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-extrabold btn-primary"
            >
              <UserPlus size={15} />
              <span>Register Account</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
