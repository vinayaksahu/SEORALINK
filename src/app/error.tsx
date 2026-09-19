"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, AlertCircle, ShieldAlert, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  const isServerRenderError =
    error.message?.includes("#441") ||
    error.message?.includes("Minified React error") ||
    Boolean(error.digest);

  const handleRetry = () => {
    setRetrying(true);
    reset();
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#040711] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="card-seoralink p-8 max-w-lg border-amber-500/40 bg-[#0d1424] space-y-5 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <AlertCircle size={26} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {isServerRenderError ? "Connection Standby Notice" : "Application Error"}
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">
            {isServerRenderError
              ? "The cloud database was in standby sleep mode or experienced a brief network handshake delay. Reconnecting now."
              : "A momentary server glitch occurred while loading this page."}
          </p>
        </div>

        <div className="text-xs text-[#cbd5e1] font-mono bg-black/50 p-3 rounded-lg border border-[#1e293b] text-left overflow-auto max-h-32">
          {isServerRenderError
            ? "Server Component transient synchronization. Click Reload to reconnect instantly."
            : error.message || "A server-side error occurred."}
        </div>

        {error.digest && (
          <div className="text-[10px] text-[#64748b] font-mono">Reference Digest: {error.digest}</div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={retrying}
            onClick={handleRetry}
            className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#d4af37]/20"
          >
            <RefreshCw size={14} className={retrying ? "animate-spin" : ""} />
            <span>{retrying ? "Reconnecting..." : "Reload Page"}</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg border border-[#1e293b] text-[#94a3b8] hover:text-white text-xs font-bold hover:bg-white/5 flex items-center gap-1.5 transition-all"
          >
            <Home size={14} />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
