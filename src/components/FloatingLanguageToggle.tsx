"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import { Globe, Check, Search, X, Sparkles } from "lucide-react";

export function FloatingLanguageToggle() {
  const { currentLang, setLanguage, languages, currentLanguageObj } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-20 z-40 flex items-center font-sans"
    >
      {/* Floating Modal Popover */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0a0f1d] border border-slate-300 dark:border-[#d4af37]/45 shadow-2xl p-3 space-y-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
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
              placeholder="Search (Korean, Chinese, Spanish, বাংলা)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#040711] border border-slate-200 dark:border-[#1e293b] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none focus:border-[#d4af37]"
              autoFocus
            />
          </div>

          {/* Scrollable List */}
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

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Language Selector"
        title={`Current Language: ${currentLanguageObj.nativeName} (${currentLanguageObj.name}). Click to switch.`}
        className="flex items-center justify-center gap-1 h-11 px-3 rounded-full border border-slate-300 dark:border-[#d4af37]/50 bg-white/90 dark:bg-[#0d1424]/90 backdrop-blur-md text-slate-800 dark:text-[#d4af37] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
      >
        <Globe size={18} className="text-[#d4af37] group-hover:rotate-45 transition-transform" />
        <span className="text-sm">{currentLanguageObj.flag}</span>
        <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white hidden sm:inline tracking-wider">
          {currentLanguageObj.code.split("-")[0]}
        </span>
      </button>
    </div>
  );
}
