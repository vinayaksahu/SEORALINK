"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage, Language } from "./LanguageProvider";
import { Globe, Check, Search, ChevronDown, X, Sparkles } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "compact" | "drawer" | "button";
  className?: string;
}

export function LanguageSelector({ variant = "compact", className = "" }: LanguageSelectorProps) {
  const { currentLang, setLanguage, languages, currentLanguageObj } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredLanguages = languages.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const featured = filteredLanguages.filter((l) => l.isFeatured);
  const otherLanguages = filteredLanguages.filter((l) => !l.isFeatured);

  const handleSelect = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
    setSearch("");
  };

  // 1. DRAWER VARIANT (For slide-in mobile/desktop navigation drawer)
  if (variant === "drawer") {
    return (
      <div ref={dropdownRef} className={`relative w-full ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0d1424] border border-[#d4af37]/30 hover:border-[#d4af37]/60 text-xs font-bold text-white transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base leading-none">{currentLanguageObj.flag}</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] text-[#d4af37] font-extrabold leading-none">
                {currentLanguageObj.nativeName}
              </span>
              <span className="text-[9px] text-[#94a3b8] mt-0.5">{currentLanguageObj.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[#94a3b8] group-hover:text-white">
            <Globe size={14} className="text-[#d4af37]" />
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="mt-2 w-full rounded-xl bg-[#080d1a] border border-[#d4af37]/40 shadow-2xl p-2.5 space-y-2 z-50">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#040711] border border-[#1e293b] text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {featured.length > 0 && (
                <div className="text-[9px] font-black uppercase tracking-wider text-[#d4af37] px-2 py-1 flex items-center gap-1">
                  <Sparkles size={10} /> Focus Languages
                </div>
              )}
              {featured.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    currentLang.toLowerCase() === l.code.toLowerCase()
                      ? "bg-[#d4af37]/20 text-[#d4af37] font-bold border border-[#d4af37]/40"
                      : "text-slate-300 hover:bg-[#0d1424] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{l.flag}</span>
                    <span className="font-semibold">{l.nativeName}</span>
                    <span className="text-[10px] text-slate-400">({l.name})</span>
                  </span>
                  {currentLang.toLowerCase() === l.code.toLowerCase() && (
                    <Check size={13} className="text-[#d4af37]" />
                  )}
                </button>
              ))}

              {otherLanguages.length > 0 && (
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 pt-2 pb-1 border-t border-[#1e293b]">
                  Worldwide Languages
                </div>
              )}
              {otherLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    currentLang.toLowerCase() === l.code.toLowerCase()
                      ? "bg-[#d4af37]/20 text-[#d4af37] font-bold border border-[#d4af37]/40"
                      : "text-slate-300 hover:bg-[#0d1424] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{l.flag}</span>
                    <span className="font-semibold">{l.nativeName}</span>
                    <span className="text-[10px] text-slate-400">({l.name})</span>
                  </span>
                  {currentLang.toLowerCase() === l.code.toLowerCase() && (
                    <Check size={13} className="text-[#d4af37]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. COMPACT HEADER VARIANT (For top navbar on Landing, Member, and Admin)
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-[#0d1424] border border-slate-300/80 dark:border-[#d4af37]/35 hover:border-[#d4af37] hover:text-[#d4af37] shadow-sm transition-all cursor-pointer select-none"
        title="Switch Worldwide Language"
        aria-label="Language Selector"
      >
        <span className="text-sm leading-none">{currentLanguageObj.flag}</span>
        <span className="hidden sm:inline font-bold tracking-wide uppercase text-[11px]">
          {currentLanguageObj.code.split("-")[0]}
        </span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-[#d4af37]/40 shadow-2xl p-3 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              <Globe size={14} className="text-[#d4af37]" />
              <span>Worldwide Language</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (e.g. Korean, Spanish, বাংলা)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#040711] border border-slate-200 dark:border-[#1e293b] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none focus:border-[#d4af37]"
              autoFocus
            />
          </div>

          {/* Scrollable Language List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {featured.length > 0 && (
              <div className="text-[10px] font-black uppercase tracking-wider text-[#d4af37] px-2 py-1 flex items-center gap-1">
                <Sparkles size={11} /> Primary & Focus
              </div>
            )}
            {featured.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  currentLang.toLowerCase() === l.code.toLowerCase()
                    ? "bg-[#d4af37]/15 text-[#d4af37] font-bold border border-[#d4af37]/40 shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131d33] hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{l.flag}</span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-[12px]">{l.nativeName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#94a3b8]">{l.name}</span>
                  </div>
                </div>
                {currentLang.toLowerCase() === l.code.toLowerCase() && (
                  <Check size={15} className="text-[#d4af37]" />
                )}
              </button>
            ))}

            {otherLanguages.length > 0 && (
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 pt-2.5 pb-1 border-t border-slate-100 dark:border-[#1e293b]">
                More Worldwide Languages
              </div>
            )}
            {otherLanguages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  currentLang.toLowerCase() === l.code.toLowerCase()
                    ? "bg-[#d4af37]/15 text-[#d4af37] font-bold border border-[#d4af37]/40 shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131d33] hover:text-slate-950 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{l.flag}</span>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-[12px]">{l.nativeName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#94a3b8]">{l.name}</span>
                  </div>
                </div>
                {currentLang.toLowerCase() === l.code.toLowerCase() && (
                  <Check size={15} className="text-[#d4af37]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
