import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 36, showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: size, height: size }} className="flex-shrink-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <polygon
            points="50,8 86,28 86,72 50,92 14,72 14,28"
            stroke="#d4af37"
            strokeWidth="4"
            className="fill-white dark:fill-[#0d1424] transition-colors"
          />
          <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" stroke="#38bdf8" strokeWidth="2.5" fill="none" opacity="0.8" />
          <circle cx="50" cy="50" r="9" fill="#d4af37" />
          <circle cx="50" cy="22" r="4" fill="#38bdf8" />
          <circle cx="74" cy="36" r="4" fill="#d4af37" />
          <circle cx="74" cy="64" r="4" fill="#38bdf8" />
          <circle cx="50" cy="78" r="4" fill="#d4af37" />
          <circle cx="26" cy="64" r="4" fill="#38bdf8" />
          <circle cx="26" cy="36" r="4" fill="#d4af37" />
          <line x1="50" y1="50" x2="50" y2="22" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="50" y1="50" x2="74" y2="36" stroke="#d4af37" strokeWidth="1.8" />
          <line x1="50" y1="50" x2="74" y2="64" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="50" y1="50" x2="50" y2="78" stroke="#d4af37" strokeWidth="1.8" />
          <line x1="50" y1="50" x2="26" y2="64" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="50" y1="50" x2="26" y2="36" stroke="#d4af37" strokeWidth="1.8" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-widest text-slate-900 dark:text-white leading-none transition-colors">
            SEORA<span className="text-[#d4af37]">LINK</span>
          </span>
          <span className="text-[9px] font-bold text-[#0284c7] dark:text-[#38bdf8] uppercase tracking-wider mt-0.5">
            Korean Business Network
          </span>
        </div>
      )}
    </div>
  );
}
