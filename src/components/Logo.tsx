import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  useFullLogo?: boolean;
}

export function Logo({ size = 36, showText = true, className = "", useFullLogo = false }: LogoProps) {
  if (useFullLogo) {
    return (
      <div className={`flex items-center ${className}`}>
        <Image
          src="/logo.png"
          alt="SEORALINK Korean Business Network"
          width={size * 3}
          height={size * 2}
          className="h-auto object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-transform duration-200 hover:scale-105"
          style={{ maxHeight: size * 1.5 }}
          priority
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="flex-shrink-0 relative flex items-center justify-center"
      >
        <Image
          src="/logo-icon.png"
          alt="SEORALINK Emblem"
          width={size * 2}
          height={size * 2}
          className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)] transition-transform duration-200 hover:scale-105"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col select-none">
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

