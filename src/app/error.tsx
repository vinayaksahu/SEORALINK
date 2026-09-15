"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#040711] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="card-seoralink p-8 max-w-lg border-red-500/40 bg-[#0d1424] space-y-4">
        <h2 className="text-xl font-bold text-red-400">Application Error</h2>
        <div className="text-xs text-red-300 font-mono bg-black/60 p-3 rounded-lg border border-red-500/20 text-left overflow-auto max-h-40">
          {error.message || "A server-side error occurred."}
        </div>
        {error.digest && (
          <div className="text-[10px] text-[#64748b] font-mono">Digest: {error.digest}</div>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-primary px-4 py-2 text-xs font-bold"
          >
            Reload
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-bold hover:bg-[#38bdf8]/10"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
