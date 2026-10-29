"use client";

import React from "react";
import { Megaphone, Bell, Sparkles } from "lucide-react";

interface MemberNoticeTickerProps {
  text: string;
}

export function MemberNoticeTicker({ text }: MemberNoticeTickerProps) {
  if (!text || !text.trim()) return null;

  const cleanText = text.trim();

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#070b14] to-amber-500/10 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.1)] p-1.5 sm:p-2 flex items-center gap-2.5 sm:gap-3 transition-all hover:border-amber-500/50 group">
      {/* Capsule Label / Badge (Shrink 0) */}
      <div className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
        <Bell size={13} className="text-amber-300" />
        <span className="hidden xs:inline">Announcement</span>
        <span className="xs:hidden">Notice</span>
      </div>

      {/* Marquee Viewport */}
      <div className="flex-1 min-w-0 overflow-hidden relative cursor-default">
        {/* Subtle Gradient Fade Edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#070b14] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#070b14] to-transparent z-10" />

        {/* Scrolling text track (repeats twice for seamless infinite loop) */}
        <div className="animate-ticker-marquee text-xs sm:text-sm font-medium text-slate-200 tracking-wide select-none">
          <span className="inline-block pr-12">
            {cleanText}
          </span>
          <span className="inline-block pr-12 text-amber-300 font-bold">
            &bull;
          </span>
          <span className="inline-block pr-12">
            {cleanText}
          </span>
          <span className="inline-block pr-12 text-amber-300 font-bold">
            &bull;
          </span>
        </div>
      </div>

      {/* Live Badge (Shrink 0) */}
      <div className="hidden sm:flex items-center gap-1 shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>LIVE</span>
      </div>
    </div>
  );
}
