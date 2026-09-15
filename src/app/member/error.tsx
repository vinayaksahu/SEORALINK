"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function MemberErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Member Portal Error]", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="card-seoralink p-8 max-w-lg border-red-500/40 bg-[#0d1424] text-white space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 text-xl font-bold">
          !
        </div>
        <h2 className="text-lg font-bold text-white">Dashboard Error</h2>
        <div className="text-xs text-red-300 font-mono bg-black/60 p-3 rounded-lg border border-red-500/20 text-left overflow-auto max-h-40">
          {error.message || "An unexpected error occurred while loading this page."}
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
            Retry Loading
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-bold hover:bg-[#38bdf8]/10"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
