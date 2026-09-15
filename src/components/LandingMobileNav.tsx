"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
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
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[#d4af37] hover:text-white hover:bg-[#0d1424] border border-[#d4af37]/30 transition-all focus:outline-none"
        aria-label="Open Navigation Menu"
        title="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 bottom-0 right-0 w-72 max-w-[85vw] bg-[#070a14] border-l border-[#d4af37]/30 z-[70] flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site Navigation"
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-[#d4af37]/20 flex items-center justify-between bg-[#040711]">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <Logo size={28} />
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e293b]/60 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Links */}
          <nav className="p-4 space-y-2">
            <div className="px-2 py-1 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Explore
            </div>
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#94a3b8] hover:text-[#d4af37] hover:bg-[#0d1424] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-[#1e293b]/60 bg-[#040711] space-y-2">
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white border border-[#d4af37]/40 hover:bg-[#d4af37]/10 transition-colors"
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
    </>
  );
}
