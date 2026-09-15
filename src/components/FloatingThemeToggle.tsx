'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function FloatingThemeToggle() {
  const { theme, setTheme, mounted, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!mounted) return null;

  const ActiveIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-1 font-sans"
    >
      {/* Expanded Mode Selector Pill */}
      {isOpen && (
        <div className="flex items-center gap-1 p-1.5 rounded-full border border-slate-300/80 dark:border-[#d4af37]/40 bg-white/95 dark:bg-[#0d1424]/95 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-right-2 duration-150">
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            title="Light Mode"
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun size={15} />
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            title="Dark Mode"
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Moon size={15} />
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            title="System Default Mode"
            className={`p-2 rounded-full transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-[#d4af37] text-slate-950 font-bold shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Monitor size={15} />
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Theme mode switcher"
        title={`Theme: ${theme.toUpperCase()} (Click to change)`}
        className="flex items-center justify-center w-11 h-11 rounded-full border border-slate-300 dark:border-[#d4af37]/50 bg-white/90 dark:bg-[#0d1424]/90 backdrop-blur-md text-[#d4af37] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
      >
        <ActiveIcon size={18} className="group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}
