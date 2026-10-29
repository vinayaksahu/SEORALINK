"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Megaphone } from "lucide-react";

interface MemberLoginPopupProps {
  title?: string;
  imageUrl: string;
  userId: string;
}

export function MemberLoginPopup({ title, imageUrl, userId }: MemberLoginPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    try {
      // Create session key based on image URL so a new image will pop up again even in the same session
      const storageKey = `login_popup_seen_${userId}_${encodeURIComponent(imageUrl)}`;
      const hasSeen = sessionStorage.getItem(storageKey);

      if (!hasSeen) {
        // Slight delay for smooth entrance after page hydration
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case sessionStorage is blocked, default to opening
      setIsOpen(true);
    }
  }, [imageUrl, userId]);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      const storageKey = `login_popup_seen_${userId}_${encodeURIComponent(imageUrl)}`;
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-300"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl sm:max-w-2xl bg-[#0b101b] border-2 border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-amber-500/25 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white truncate tracking-wide">
              {title || "Special Member Announcement"}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close Announcement"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Poster Image */}
        <div className="p-3 sm:p-4 bg-[#040711] flex items-center justify-center max-h-[72vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={title || "Announcement Poster"}
            className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition hover:scale-[1.01]"
          />
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/70 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 hidden xs:inline">
            Official System Notice
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full xs:w-auto bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-lg transition-all active:scale-95 cursor-pointer ml-auto"
          >
            Continue to Dashboard &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
