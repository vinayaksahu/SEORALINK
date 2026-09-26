'use client';

import React, { useEffect, useState } from "react";
import {
  X,
  Trophy,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Wallet,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TIER_NAMES } from "@/lib/constants";

interface MemberAuditModalProps {
  identifier: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberAuditModal({
  identifier,
  isOpen,
  onClose,
}: MemberAuditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"RANK" | "COMMISSIONS">("RANK");
  const [commissionSearch, setCommissionSearch] = useState("");
  const [commissionFilter, setCommissionFilter] = useState<"ALL" | "DIRECT" | "OVERRIDE">("ALL");

  const fetchAuditData = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetId)}/audit`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load member audit record");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Network error loading audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && identifier) {
      fetchAuditData(identifier);
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, identifier]);

  if (!isOpen) return null;

  // Filter commissions
  const filteredCommissions = (data?.commissions?.transactions || []).filter((tx: any) => {
    const matchesSearch =
      tx.description?.toLowerCase().includes(commissionSearch.toLowerCase()) ||
      tx.sourceUser?.customId?.toLowerCase().includes(commissionSearch.toLowerCase()) ||
      tx.sourceUser?.fullName?.toLowerCase().includes(commissionSearch.toLowerCase()) ||
      tx.typeLabel?.toLowerCase().includes(commissionSearch.toLowerCase());

    if (commissionFilter === "DIRECT") {
      return matchesSearch && tx.type === "DIRECT_COMMISSION";
    }
    if (commissionFilter === "OVERRIDE") {
      return matchesSearch && tx.type === "UPLINE_OVERRIDE";
    }
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#070b14] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-gradient-to-r from-red-950/40 via-[#0d1424] to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-red-500/20">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Member Rank & Commission Audit
                </h3>
                {data?.user?.customId && (
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                    {data.user.customId}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94a3b8]">
                Deep-dive into 2:1 Tripod queue placements, qualifying direct referrals, and mentorship ledger payouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {identifier && (
              <button
                onClick={() => fetchAuditData(identifier)}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[#94a3b8] hover:text-white transition-all cursor-pointer"
                title="Refresh Audit Data"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-red-400" : ""} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[#94a3b8] hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && !data && (
            <div className="py-24 text-center space-y-3">
              <RefreshCw size={32} className="mx-auto text-red-500 animate-spin" />
              <p className="text-sm text-[#94a3b8]">Loading member rank progression & financial ledger...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <>
              {/* TOP PROFILE CARD & FINANCIAL SUMMARY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* User Info Card */}
                <div className="lg:col-span-1 p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-bold text-white">{data.user.fullName}</div>
                      <div className="text-xs text-[#94a3b8]">{data.user.email}</div>
                      {data.user.phone && (
                        <div className="text-[11px] text-[#64748b]">{data.user.phone}</div>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        data.user.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : data.user.status === "BLOCKED"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {data.user.isSystemExited ? "EXITED" : data.user.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#1e293b] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">Current Rank:</span>
                      <span className="font-bold text-red-400">
                        Tier {data.user.currentTier}: {data.user.tierName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">Direct Referrals:</span>
                      <span className="font-bold text-white">
                        {data.directs.active} Active / {data.directs.total} Total
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">Direct Sponsor:</span>
                      <span className="font-medium text-white">
                        {data.user.sponsor ? (
                          <>
                            {data.user.sponsor.fullName}{" "}
                            <span className="text-red-400 font-mono">({data.user.sponsor.customId})</span>
                          </>
                        ) : (
                          <span className="text-[#64748b] italic">Root Admin / None</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">Joined Date:</span>
                      <span className="text-[#94a3b8]">
                        {new Date(data.user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balances & Commissions Summary Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#94a3b8] text-xs">
                      <span>Fund Wallet</span>
                      <Wallet size={14} className="text-sky-400" />
                    </div>
                    <div className="text-lg font-bold text-white mt-2">
                      ${data.user.balances.fundBalance.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-[#64748b]">Usable for activation</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#94a3b8] text-xs">
                      <span>Income Wallet</span>
                      <DollarSign size={14} className="text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold text-emerald-400 mt-2">
                      ${data.user.balances.incomeBalance.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-[#64748b]">Withdrawable commission</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#94a3b8] text-xs">
                      <span>5% Direct Bonus</span>
                      <Users size={14} className="text-amber-400" />
                    </div>
                    <div className="text-lg font-bold text-amber-400 mt-2">
                      ${data.commissions.summary.directBonusTotal.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-[#64748b]">
                      {data.commissions.summary.directBonusCount} Direct Payouts
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#94a3b8] text-xs">
                      <span>5% Overrides</span>
                      <TrendingUp size={14} className="text-purple-400" />
                    </div>
                    <div className="text-lg font-bold text-purple-400 mt-2">
                      ${data.commissions.summary.mentorshipOverrideTotal.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-[#64748b]">
                      {data.commissions.summary.mentorshipOverrideCount} Rank Upgrades
                    </span>
                  </div>
                </div>
              </div>

              {/* NEXT RANK ROADMAP BANNER */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/30 via-slate-900/70 to-purple-950/20 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Next Rank Advancement Pathway</span>
                  </div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{data.nextRankRoadmap.currentTierName} (Tier {data.nextRankRoadmap.currentTier})</span>
                    <ArrowRight size={16} className="text-red-400" />
                    <span className="text-red-400">{data.nextRankRoadmap.nextTierName} (Tier {data.nextRankRoadmap.nextTier})</span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">{data.nextRankRoadmap.statusSummary}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-[#64748b] block uppercase">Directs Check</span>
                    <span
                      className={`text-xs font-bold ${
                        data.nextRankRoadmap.directs.isQualified ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {data.nextRankRoadmap.directs.current} / {data.nextRankRoadmap.directs.required}{" "}
                      {data.nextRankRoadmap.directs.isQualified ? "✅ Ready" : `(${data.nextRankRoadmap.directs.missing} needed)`}
                    </span>
                  </div>

                  <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-[#64748b] block uppercase">Autopool Children</span>
                    <span className="text-xs font-bold text-sky-400">
                      {data.nextRankRoadmap.autopool.childrenPlaced} / 2 Children
                    </span>
                  </div>
                </div>
              </div>

              {/* NAVIGATION TABS */}
              <div className="flex border-b border-[#1e293b] gap-6 text-sm font-bold">
                <button
                  onClick={() => setActiveTab("RANK")}
                  className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                    activeTab === "RANK"
                      ? "border-red-500 text-red-400"
                      : "border-transparent text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Trophy size={16} />
                  <span>Rank Record & Autopool History</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-300">
                    Tier {data.user.currentTier}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("COMMISSIONS")}
                  className={`pb-3 border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
                    activeTab === "COMMISSIONS"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <DollarSign size={16} />
                  <span>Commissions & Overrides Ledger</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                    ${data.commissions.summary.totalEarnedCommissions.toFixed(2)}
                  </span>
                </button>
              </div>

              {/* TAB 1: RANK RECORD & AUTOPOOL HISTORY */}
              {activeTab === "RANK" && (
                <div className="space-y-6">
                  {/* DIRECT REFERRALS SUMMARY */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                        <Users size={14} className="text-red-400" />
                        <span>Direct Referrals Portfolio ({data.directs.total})</span>
                      </h4>
                      <span className="text-xs text-[#64748b]">
                        Active: <strong className="text-emerald-400">{data.directs.active}</strong> | Inactive: <strong className="text-amber-400">{data.directs.inactive}</strong>
                      </span>
                    </div>

                    {data.directs.list.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#0c1220] border border-[#1e293b] text-center text-xs text-[#64748b]">
                        No direct referrals registered yet under this member.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b]">
                            <tr>
                              <th className="py-2.5 px-3">Custom ID</th>
                              <th className="py-2.5 px-3">Full Name</th>
                              <th className="py-2.5 px-3">Rank Tier</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Joined Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e293b] bg-[#0c1220]">
                            {data.directs.list.map((dir: any) => (
                              <tr key={dir.id} className="hover:bg-slate-800/40">
                                <td className="py-2 px-3 font-mono font-bold text-red-400">
                                  {dir.customId}
                                </td>
                                <td className="py-2 px-3 text-white font-medium">{dir.fullName}</td>
                                <td className="py-2 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-400 border border-slate-700">
                                    T{dir.currentTier}: {dir.tierName}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      dir.status === "ACTIVE"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                    }`}
                                  >
                                    {dir.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-[#64748b]">
                                  {new Date(dir.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 12-TIER PROGRESSION CARDS */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                      <GitBranch size={14} className="text-red-400" />
                      <span>12-Tier Autopool Progression & Placements</span>
                    </h4>

                    <div className="space-y-3">
                      {data.tierProgression.map((tp: any) => {
                        const isEnrolled = tp.isEnrolled;
                        const isCompleted = tp.queueEntry?.status === "COMPLETED";
                        const isWaiting = tp.queueEntry?.status === "WAITING";
                        const isCurrent = tp.isCurrentTier;

                        return (
                          <div
                            key={tp.tier}
                            className={`p-4 rounded-xl border transition-all ${
                              isCurrent
                                ? "bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/10"
                                : isCompleted
                                ? "bg-[#0c1220] border-emerald-500/30"
                                : isWaiting
                                ? "bg-[#0c1220] border-sky-500/30"
                                : "bg-[#080d1a] border-[#1e293b]/60 opacity-60"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                    isCompleted
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                      : isWaiting
                                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                                      : "bg-slate-800 text-[#64748b]"
                                  }`}
                                >
                                  T{tp.tier}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">
                                      {tp.tierName}
                                    </span>
                                    <span className="text-xs text-[#94a3b8]">(${tp.tierValue})</span>
                                    {isCurrent && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500 text-white shadow-sm">
                                        CURRENT ACTIVE RANK
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#64748b] flex items-center gap-2 mt-0.5">
                                    <span>Compulsory Directs: {tp.requiredDirects}</span>
                                    <span>•</span>
                                    <span className={tp.isDirectsMet ? "text-emerald-400" : "text-amber-400"}>
                                      {tp.isDirectsMet ? "Directs Met ✅" : "Directs Missing ⚠️"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isCompleted && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    <span>COMPLETED (Rolled to Next Tier)</span>
                                  </span>
                                )}

                                {isWaiting && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>WAITING (Queue Index #{tp.queueEntry.queueIndex})</span>
                                  </span>
                                )}

                                {!isEnrolled && (
                                  <span className="text-xs text-[#64748b] italic">
                                    Not enrolled yet
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Autopool Queue Placements Breakdown */}
                            {tp.queueEntry && (
                              <div className="mt-3 pt-3 border-t border-[#1e293b] space-y-2">
                                <div className="text-xs text-[#94a3b8] flex items-center justify-between">
                                  <span>
                                    <strong>2:1 Autopool Placements:</strong> {tp.queueEntry.childrenPlaced} / 2 Children Matched
                                  </span>
                                  {tp.queueEntry.matchedAt && (
                                    <span className="text-[11px] text-emerald-400">
                                      Matched on: {new Date(tp.queueEntry.matchedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {/* Slot 1 */}
                                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                                    <div className="text-[10px] text-[#64748b] uppercase font-bold">Child 1 (Left Leg)</div>
                                    {tp.queueEntry.children[0] ? (
                                      <div className="mt-1 flex items-center justify-between">
                                        <div>
                                          <span className="font-bold text-white">
                                            {tp.queueEntry.children[0].fullName}
                                          </span>{" "}
                                          <span className="font-mono text-red-400 font-bold">
                                            ({tp.queueEntry.children[0].customId})
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-emerald-400 font-bold">
                                          Queue #{tp.queueEntry.children[0].queueIndex}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-[#64748b] italic">
                                        Waiting for placement...
                                      </div>
                                    )}
                                  </div>

                                  {/* Slot 2 */}
                                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                                    <div className="text-[10px] text-[#64748b] uppercase font-bold">Child 2 (Right Leg)</div>
                                    {tp.queueEntry.children[1] ? (
                                      <div className="mt-1 flex items-center justify-between">
                                        <div>
                                          <span className="font-bold text-white">
                                            {tp.queueEntry.children[1].fullName}
                                          </span>{" "}
                                          <span className="font-mono text-red-400 font-bold">
                                            ({tp.queueEntry.children[1].customId})
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-emerald-400 font-bold">
                                          Queue #{tp.queueEntry.children[1].queueIndex}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="mt-1 text-[#64748b] italic">
                                        Waiting for placement...
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {tp.queueEntry.waitingDetails && (
                                  <div className="p-2 rounded-lg bg-sky-950/20 border border-sky-500/20 text-[11px] text-sky-300 flex items-center gap-2">
                                    <Clock size={12} className="text-sky-400 flex-shrink-0" />
                                    <span>{tp.queueEntry.waitingDetails.explanation}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COMMISSIONS & OVERRIDES LEDGER */}
              {activeTab === "COMMISSIONS" && (
                <div className="space-y-4">
                  {/* Filters & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="text"
                        placeholder="Search description, member ID..."
                        value={commissionSearch}
                        onChange={(e) => setCommissionSearch(e.target.value)}
                        className="w-full bg-[#0c1220] border border-[#1e293b] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        onClick={() => setCommissionFilter("ALL")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          commissionFilter === "ALL"
                            ? "bg-slate-700 text-white"
                            : "bg-slate-900 text-[#64748b] hover:text-white"
                        }`}
                      >
                        All ({data.commissions.transactions.length})
                      </button>
                      <button
                        onClick={() => setCommissionFilter("DIRECT")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          commissionFilter === "DIRECT"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-slate-900 text-[#64748b] hover:text-white"
                        }`}
                      >
                        5% Direct ({data.commissions.summary.directBonusCount})
                      </button>
                      <button
                        onClick={() => setCommissionFilter("OVERRIDE")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          commissionFilter === "OVERRIDE"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-slate-900 text-[#64748b] hover:text-white"
                        }`}
                      >
                        5% Overrides ({data.commissions.summary.mentorshipOverrideCount})
                      </button>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  {filteredCommissions.length === 0 ? (
                    <div className="p-8 rounded-xl bg-[#0c1220] border border-[#1e293b] text-center text-xs text-[#64748b]">
                      No commission transactions found for this member matching the filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b]">
                          <tr>
                            <th className="py-2.5 px-3">Date & Time</th>
                            <th className="py-2.5 px-3">Commission Category</th>
                            <th className="py-2.5 px-3">Source Member</th>
                            <th className="py-2.5 px-3">Amount ($)</th>
                            <th className="py-2.5 px-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b] bg-[#0c1220]">
                          {filteredCommissions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 text-[#64748b] whitespace-nowrap">
                                {new Date(tx.createdAt).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    tx.type === "DIRECT_COMMISSION"
                                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                      : tx.type === "UPLINE_OVERRIDE"
                                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  }`}
                                >
                                  {tx.typeLabel}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {tx.sourceUser ? (
                                  <div>
                                    <span className="text-white font-medium">
                                      {tx.sourceUser.fullName}
                                    </span>{" "}
                                    <span className="font-mono text-red-400 font-bold">
                                      ({tx.sourceUser.customId})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[#64748b] italic">System</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-400 whitespace-nowrap">
                                +${tx.amount.toFixed(2)} USDT
                              </td>
                              <td className="py-2.5 px-3 text-[#94a3b8] max-w-xs truncate">
                                {tx.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-[#1e293b] bg-[#0b101c] flex items-center justify-between text-xs text-[#64748b]">
          <span>SEORALINK Protocol Network Audit Engine v1.0.6</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
