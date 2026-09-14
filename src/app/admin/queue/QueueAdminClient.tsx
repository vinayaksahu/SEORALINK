'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GitCommit, RefreshCw, CheckCircle2, Trophy } from "lucide-react";
import { TIER_NAMES, TIER_VALUES } from "@/lib/constants";

interface TierQueueSummary {
  tier: number;
  name: string;
  value: number;
  totalNodes: number;
  waitingNodes: number;
  completedNodes: number;
}

export default function QueueAdminClient({ tierStats }: { tierStats: TierQueueSummary[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleReconcile = async (tier?: number) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/queue/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier !== undefined ? tier : -1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.message);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#1e293b] bg-[#0d1424]">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCommit size={16} className="text-[#38bdf8]" />
            Queue Advancement Automation
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            The queue processes automatically on each account activation, but you can force an audit reconciliation at any time.
          </p>
        </div>

        <button
          onClick={() => handleReconcile()}
          disabled={loading}
          className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Reconciling..." : "Reconcile All 12 Queues"}
        </button>
      </div>

      {result && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono-num">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{result}</span>
        </div>
      )}

      {/* Grid of 12 Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tierStats.map((t) => (
          <div key={t.tier} className="card-seoralink p-5 flex flex-col justify-between border-[#1e293b]">
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono-num">
                <span className="text-[#94a3b8]">Tier {t.tier}</span>
                <span className="text-[#d4af37] font-bold">${t.value.toLocaleString()} USDT</span>
              </div>
              <div className="text-base font-bold text-white mt-1">{t.name}</div>
            </div>

            <div className="my-4 py-3 border-t border-b border-[#1e293b] space-y-1.5 text-xs font-mono-num">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total Nodes:</span>
                <span className="font-bold text-white">{t.totalNodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Waiting in Line:</span>
                <span className="font-bold text-[#38bdf8]">{t.waitingNodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Completed Matches:</span>
                <span className="font-bold text-[#10b981]">{t.completedNodes}</span>
              </div>
            </div>

            <button
              onClick={() => handleReconcile(t.tier)}
              disabled={loading}
              className="w-full py-1.5 rounded bg-[#0b1120] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#1e293b] text-[11px] font-mono-num font-bold transition-colors disabled:opacity-50"
            >
              Reconcile T{t.tier}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
