'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from './ThemeProvider';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'segmented' | 'compact' | 'dropdown';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showLabels?: boolean;
}

export function ThemeToggle({
  variant = 'segmented',
  size = 'sm',
  className = '',
  showLabels = true,
}: ThemeToggleProps) {
  const { theme, setTheme, mounted, resolvedTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Avoid hydration mismatch by rendering a stable placeholder until mounted
  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center rounded-lg border border-slate-300/40 dark:border-[#1e293b] bg-slate-100/80 dark:bg-[#0b1120] opacity-60 p-1 ${className}`}
        style={{ minWidth: variant === 'compact' ? '36px' : '96px', minHeight: '32px' }}
      />
    );
  }

  const options: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  // Compact / Dropdown view
  if (variant === 'compact' || variant === 'dropdown') {
    const ActiveIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-300/70 dark:border-[#d4af37]/30 bg-white dark:bg-[#0d1424] text-slate-700 dark:text-[#cbd5e1] hover:text-[#d4af37] dark:hover:text-[#d4af37] hover:border-[#d4af37]/60 shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40"
          title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (Click to switch)`}
          aria-label="Toggle theme mode"
          aria-expanded={dropdownOpen}
        >
          <ActiveIcon size={16} className="text-[#d4af37]" />
          {showLabels && (
            <span className="text-xs font-semibold capitalize hidden sm:inline">
              {theme}
            </span>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 dark:border-[#d4af37]/30 bg-white/95 dark:bg-[#0d1424]/95 backdrop-blur-md shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94a3b8]">
              Theme Mode
            </div>
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-[#d4af37] bg-[#d4af37]/10 font-bold'
                      : 'text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-[#0b1120]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={isSelected ? 'text-[#d4af37]' : 'text-slate-400 dark:text-[#94a3b8]'} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check size={13} className="text-[#d4af37]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Segmented Pill view (Default)
  const isXs = size === 'xs';
  const isSm = size === 'sm';

  const iconSize = isXs ? 12 : isSm ? 14 : 16;
  const paddingClass = isXs ? 'p-0.5' : 'p-1';
  const itemPadding = isXs ? 'px-1.5 py-0.5 text-[10px]' : isSm ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs';

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode selector"
      className={`inline-flex items-center rounded-lg border border-slate-200 dark:border-[#1e293b] bg-slate-100/90 dark:bg-[#070a14] ${paddingClass} shadow-inner ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(opt.id)}
            title={`${opt.label} Mode`}
            className={`flex items-center gap-1.5 rounded-md font-semibold transition-all cursor-pointer select-none ${itemPadding} ${
              isSelected
                ? 'bg-white dark:bg-[#0d1424] text-[#d4af37] shadow-sm border border-slate-200/80 dark:border-[#d4af37]/40 scale-[1.02]'
                : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#0b1120]/50'
            }`}
          >
            <Icon size={iconSize} className={isSelected ? 'text-[#d4af37]' : ''} />
            {showLabels && (
              <span className="capitalize">{opt.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
