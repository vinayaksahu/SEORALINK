"use client";

import React, { useState, useEffect } from "react";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS } from "@/lib/constants";
import {
  UserPlus,
  Zap,
  Globe,
  Shuffle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  GitBranch,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import TreeView from "./TreeView";

interface RecentUser {
  id: string;
  customId: string;
  fullName: string;
  email: string;
  currentTier: number;
  directCount: number;
  role: string;
}

interface SimulatorClientProps {
  initialTarget?: string;
  recentUsers: RecentUser[];
}

export default function SimulatorClient({
  initialTarget = "",
  recentUsers,
}: SimulatorClientProps) {
  const [activeTab, setActiveTab] = useState<"TREE" | "DECK">("TREE");
  const [mode, setMode] = useState<"DIRECT" | "BOOST_RANK" | "GLOBAL" | "RANDOM">("BOOST_RANK");
  const [targetIdentifier, setTargetIdentifier] = useState(initialTarget);
  const [count, setCount] = useState<number>(2);
  const [autoActivate, setAutoActivate] = useState(true);
  const [sponsorStrategy, setSponsorStrategy] = useState<"TARGET_USER" | "ADMIN" | "RANDOM_ACTIVE">("TARGET_USER");
  const [namePrefix, setNamePrefix] = useState("");
  const [targetTier, setTargetTier] = useState<number>(1);

  // Target User Live Telemetry
  const [targetTelemetry, setTargetTelemetry] = useState<any>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState("");

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Load telemetry when targetIdentifier changes
  const fetchTelemetry = async (ident: string) => {
    if (!ident.trim()) {
      setTargetTelemetry(null);
      return;
    }
    setTelemetryLoading(true);
    setTelemetryError("");
    try {
      const res = await fetch(`/api/admin/simulator/target-info?identifier=${encodeURIComponent(ident.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "User not found");
      }
      setTargetTelemetry(data);
      // Auto set target tier to next tier
      if (data.nextTier) {
        setTargetTier(data.nextTier.tier);
      }
    } catch (err: any) {
      setTelemetryError(err.message || "Failed to fetch user telemetry");
      setTargetTelemetry(null);
    } finally {
      setTelemetryLoading(false);
    }
  };

  useEffect(() => {
    if (targetIdentifier) {
      fetchTelemetry(targetIdentifier);
    } else if (recentUsers.length > 0) {
      // Default to first user (e.g. Admin)
      setTargetIdentifier(recentUsers[0].customId);
      fetchTelemetry(recentUsers[0].customId);
    }
  }, []);

  const handleSelectRecentUser = (customId: string) => {
    setTargetIdentifier(customId);
    fetchTelemetry(customId);
  };

  const handleSelectFromTree = (customId: string, preferredMode?: string) => {
    setTargetIdentifier(customId);
    fetchTelemetry(customId);
    if (preferredMode && ["DIRECT", "BOOST_RANK", "GLOBAL", "RANDOM"].includes(preferredMode)) {
      setMode(preferredMode as any);
    }
    setActiveTab("DECK");
  };

  const handleExecute = async () => {
    setError("");
    setResult(null);
    setExecuting(true);

    try {
      const payload: any = {
        mode,
        count: Number(count),
        autoActivate,
        namePrefix: namePrefix.trim() || undefined,
      };

      if (mode === "DIRECT" || mode === "BOOST_RANK") {
        if (!targetIdentifier.trim()) {
          throw new Error("Please select or enter a Target Member ID / Email.");
        }
        if (targetTelemetry && (targetTelemetry.user?.status === "EXITED" || targetTelemetry.isExited)) {
          throw new Error(`Cannot run simulation for ${targetTelemetry.user.customId}: This ID has exited the ecosystem and is permanently deactivated.`);
        }
        payload.targetUserIdentifier = targetIdentifier.trim();
      }

      if (mode === "BOOST_RANK") {
        payload.targetTier = Number(targetTier);
      }

      if (mode === "GLOBAL") {
        payload.sponsorStrategy = sponsorStrategy;
      }

      const res = await fetch("/api/admin/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to run simulation");
      }

      setResult(data);
      // Refresh telemetry if target was involved
      if (targetIdentifier) {
        fetchTelemetry(targetIdentifier);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during execution.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Level View Mode Switcher: Interactive Network Tree vs Parameters Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 dark:bg-[#070a14] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("TREE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "TREE"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <GitBranch size={16} />
            <span>Interactive Network Tree View</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-mono font-bold">
              TREE
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DECK")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "DECK"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sliders size={16} />
            <span>Parameters Control Deck</span>
          </button>
        </div>

        {targetIdentifier && (
          <div className="hidden sm:flex items-center gap-2 text-xs pr-3 text-slate-500 dark:text-slate-400">
            <span>Target Identifier:</span>
            <strong className="text-[#d4af37] font-mono-num font-bold">{targetIdentifier}</strong>
          </div>
        )}
      </div>

      {activeTab === "TREE" ? (
        <TreeView onSelectForForm={handleSelectFromTree} />
      ) : (
        <div className="space-y-8">
          {/* 1. Mode Selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {/* Mode: BOOST_RANK */}
        <button
          type="button"
          onClick={() => setMode("BOOST_RANK")}
          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
            mode === "BOOST_RANK"
              ? "bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/10"
              : "bg-white dark:bg-[#070a14] border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-[#94a3b8] hover:border-red-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-lg ${mode === "BOOST_RANK" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-red-400"}`}>
              <Zap size={18} />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
              Rank Booster
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Auto-Boost to Next Rank
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#94a3b8] leading-relaxed">
            Automatically fulfills missing direct referrals & promotes target ID to next rank!
          </div>
        </button>

        {/* Mode: DIRECT */}
        <button
          type="button"
          onClick={() => setMode("DIRECT")}
          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
            mode === "DIRECT"
              ? "bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/10"
              : "bg-white dark:bg-[#070a14] border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-[#94a3b8] hover:border-red-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-lg ${mode === "DIRECT" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-red-400"}`}>
              <UserPlus size={18} />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
              Custom Directs
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Direct Under Target User
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#94a3b8] leading-relaxed">
            Generates dummy members directly sponsored by a chosen user, granting $0.50 cash & direct counts.
          </div>
        </button>

        {/* Mode: GLOBAL */}
        <button
          type="button"
          onClick={() => setMode("GLOBAL")}
          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
            mode === "GLOBAL"
              ? "bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/10"
              : "bg-white dark:bg-[#070a14] border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-[#94a3b8] hover:border-red-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-lg ${mode === "GLOBAL" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-red-400"}`}>
              <Globe size={18} />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              Queue Velocity
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Global Single-Leg Queue
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#94a3b8] leading-relaxed">
            Injects sequential volume into Tier 0 FIFO line to push community members through Tripod matching.
          </div>
        </button>

        {/* Mode: RANDOM */}
        <button
          type="button"
          onClick={() => setMode("RANDOM")}
          className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
            mode === "RANDOM"
              ? "bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-500/10"
              : "bg-white dark:bg-[#070a14] border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-[#94a3b8] hover:border-red-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-lg ${mode === "RANDOM" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-red-400"}`}>
              <Shuffle size={18} />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
              Random Pool
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Random Network Spread
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#94a3b8] leading-relaxed">
            Distributes dummy referrals randomly across all active network members to simulate natural growth.
          </div>
        </button>
      </div>

      {/* 2. Interactive Configuration Form */}
      <div className="bg-white dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] pb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-[#d4af37]" />
              {mode === "BOOST_RANK" && "Target ID Rank Upgrade Parameters"}
              {mode === "DIRECT" && "Direct Sponsorship Setup"}
              {mode === "GLOBAL" && "Global Single-Leg Queue Injection"}
              {mode === "RANDOM" && "Random Network Distribution Setup"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
              Select your parameters and click execute to simulate registrations and trigger real-time smart queue logic.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Mode: <strong className="text-red-500 dark:text-red-400">{mode}</strong>
          </div>
        </div>

        {/* Target User Selector (shown for DIRECT and BOOST_RANK) */}
        {(mode === "DIRECT" || mode === "BOOST_RANK") && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Target User Identifier (Member ID or Email)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={targetIdentifier}
                    onChange={(e) => setTargetIdentifier(e.target.value)}
                    placeholder="e.g. SL000001 or admin@seoralink.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0d1424] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchTelemetry(targetIdentifier)}
                  disabled={telemetryLoading || !targetIdentifier.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={telemetryLoading ? "animate-spin" : ""} />
                  <span>Inspect</span>
                </button>
              </div>

              {/* Quick Suggestion Pills */}
              {recentUsers.length > 0 && (
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Quick Select:</span>
                  {recentUsers.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectRecentUser(u.customId)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                        targetIdentifier === u.customId
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "bg-slate-100 dark:bg-[#0d1424] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {u.customId} ({u.fullName.split(" ")[0]}) - T{u.currentTier}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target Telemetry Card */}
            {telemetryLoading && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin text-red-500" />
                <span>Loading live telemetry for {targetIdentifier}...</span>
              </div>
            )}

            {telemetryError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{telemetryError}</span>
              </div>
            )}

            {targetTelemetry && !telemetryLoading && (() => {
              const isTargetExited = targetTelemetry.user.status === "EXITED" || targetTelemetry.isExited;
              return (
                <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                  isTargetExited
                    ? "bg-rose-950/20 border-rose-500/40"
                    : "bg-gradient-to-br from-slate-900 via-[#070a14] to-red-950/20 border-red-500/30"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isTargetExited ? "bg-rose-500" : "bg-emerald-400 animate-pulse"}`}></span>
                      <strong className="text-white text-sm">{targetTelemetry.user.fullName}</strong>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {targetTelemetry.user.customId}
                      </span>
                      <span className="text-slate-400 text-[11px]">({targetTelemetry.user.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#94a3b8]">Current Rank:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        Tier {targetTelemetry.user.currentTier}: {targetTelemetry.user.currentTierName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isTargetExited
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      }`}>
                        {isTargetExited ? "EXITED" : targetTelemetry.user.status}
                      </span>
                    </div>
                  </div>

                  {isTargetExited && (
                    <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2.5">
                      <ShieldAlert size={18} className="text-rose-400 shrink-0" />
                      <div>
                        <strong className="text-white font-bold">Simulator Options Disabled:</strong>
                        <span className="ml-1 text-rose-300">
                          Member {targetTelemetry.user.customId} has executed a Rank Exit Cashout. This ID is permanently deactivated and barred from further simulations or rank advancement.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="bg-[#040711] p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-500 uppercase font-bold text-[9.5px]">Active Directs</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">
                        {targetTelemetry.user.directCount} Directs
                      </div>
                    </div>

                    <div className="bg-[#040711] p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-500 uppercase font-bold text-[9.5px]">Next Tier Requirement</div>
                      <div className="text-sm font-extrabold text-sky-400 mt-0.5">
                        {targetTelemetry.nextTier.requiredDirects} Directs Required
                      </div>
                    </div>

                    <div className="bg-[#040711] p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-500 uppercase font-bold text-[9.5px]">
                        {isTargetExited ? "Simulator Status" : "Missing Directs"}
                      </div>
                      <div className={`text-sm font-extrabold mt-0.5 ${
                        isTargetExited
                          ? "text-rose-400"
                          : targetTelemetry.nextTier.missingDirects === 0
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}>
                        {isTargetExited
                          ? "DISABLED (EXITED)"
                          : targetTelemetry.nextTier.missingDirects === 0
                          ? "Qualified (0 Missing)"
                          : `${targetTelemetry.nextTier.missingDirects} Missing`}
                      </div>
                    </div>

                    <div className="bg-[#040711] p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-500 uppercase font-bold text-[9.5px]">Queue Status</div>
                      <div className="text-sm font-extrabold text-purple-400 mt-0.5">
                        {isTargetExited
                          ? "Queue Closed (Exited)"
                          : targetTelemetry.queue.waitingQueueIndex !== null
                          ? `Pos #${targetTelemetry.queue.waitingQueueIndex} (${targetTelemetry.queue.childrenPlaced}/2)`
                          : "Ready for Promotion"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Mode specific parameters */}
        {mode === "BOOST_RANK" && targetTelemetry && (
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-[#1e293b]">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Select Target Promotion Tier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {TIER_NAMES.map((name, tierIndex) => {
                const isCurrent = targetTelemetry.user.currentTier === tierIndex;
                const isPast = targetTelemetry.user.currentTier > tierIndex;
                const isSelected = targetTier === tierIndex;
                const isTargetExited = targetTelemetry.user.status === "EXITED" || targetTelemetry.isExited;
                return (
                  <button
                    key={tierIndex}
                    type="button"
                    disabled={isCurrent || isPast || isTargetExited}
                    onClick={() => setTargetTier(tierIndex)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected && !isTargetExited
                        ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20"
                        : isPast || isCurrent || isTargetExited
                        ? "opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-slate-50 dark:bg-[#0d1424] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-500/40"
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-80 uppercase">
                      Tier {tierIndex} {isCurrent && "(Current)"}
                    </div>
                    <div className="text-xs font-extrabold">{name}</div>
                    <div className="text-[10px] mt-1 opacity-90">${TIER_VALUES[tierIndex]} USDT</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-start gap-2.5">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong>Auto-Fulfillment Mechanism:</strong>
                <p className="text-[11px] text-emerald-300/80 mt-0.5 leading-relaxed">
                  When you execute, the engine will automatically check if {targetTelemetry.user.fullName} needs any direct referrals for Tier {targetTier} ({TIER_NAMES[targetTier]}). If needed, it generates & activates exact dummy directs under this ID, resolves tripod matches, and upgrades them smoothly!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Count Selector (for DIRECT, GLOBAL, RANDOM) */}
        {mode !== "BOOST_RANK" && (
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-[#1e293b]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Number of Dummy Users to Generate
              </label>
              <span className="text-xs font-mono font-bold text-red-500 dark:text-red-400">
                {count} Users
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 5, 6, 10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    count === num
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-slate-50 dark:bg-[#0d1424] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  +{num} Users
                </button>
              ))}

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-slate-400">Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1424] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Strategy Selection */}
        {mode === "GLOBAL" && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e293b]">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Sponsor Assignment Strategy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSponsorStrategy("ADMIN")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sponsorStrategy === "ADMIN"
                    ? "bg-red-500/15 border-red-500 text-white"
                    : "bg-slate-50 dark:bg-[#0d1424] border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">Main Admin Sponsorship</div>
                <div className="text-[11px] text-slate-400">All dummy users sponsored directly by Master Admin (ADMIN / SL000001).</div>
              </button>

              <button
                type="button"
                onClick={() => setSponsorStrategy("RANDOM_ACTIVE")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  sponsorStrategy === "RANDOM_ACTIVE"
                    ? "bg-red-500/15 border-red-500 text-white"
                    : "bg-slate-50 dark:bg-[#0d1424] border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">Random Community Sponsors</div>
                <div className="text-[11px] text-slate-400">Randomly distributes sponsors across active community members.</div>
              </button>
            </div>
          </div>
        )}

        {/* Options Bar: Activation & Custom Prefix */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoActivate"
              checked={autoActivate}
              onChange={(e) => setAutoActivate(e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-slate-700 focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="autoActivate" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              Auto-Activate with $10 USDT Micro-Entry (Recommended)
              <span className="block text-[11px] text-slate-400 font-normal">
                Deducts entry fee, enters Single-Leg FIFO Queue, and pays 5% direct commission.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Name Prefix:</span>
            <input
              type="text"
              value={namePrefix}
              onChange={(e) => setNamePrefix(e.target.value)}
              placeholder="e.g. VIP Node"
              className="w-32 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1424] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <div>
              <strong>Execution Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Execute Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {mode === "BOOST_RANK" && `Promoting ${targetTelemetry?.user?.customId || "User"} to Tier ${targetTier} (${TIER_NAMES[targetTier]})`}
            {mode === "DIRECT" && `Creating ${count} dummy directs under ${targetTelemetry?.user?.customId || "Target"}`}
            {mode === "GLOBAL" && `Injecting ${count} dummy users into Global Single-Leg Queue`}
            {mode === "RANDOM" && `Creating ${count} dummy users distributed randomly`}
          </div>

          {(() => {
            const isTargetExited = (mode === "BOOST_RANK" || mode === "DIRECT") && (targetTelemetry?.user?.status === "EXITED" || targetTelemetry?.isExited);
            return (
              <button
                type="button"
                onClick={handleExecute}
                disabled={executing || (mode === "BOOST_RANK" && !targetTelemetry) || isTargetExited}
                className={`px-6 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                  isTargetExited
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none"
                    : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 cursor-pointer disabled:opacity-50 active:scale-98"
                }`}
              >
                {executing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Executing Simulation...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>
                      {isTargetExited
                        ? "Disabled (ID Exited)"
                        : mode === "BOOST_RANK"
                        ? "🚀 Execute Rank Boost"
                        : "🚀 Run Simulation"}
                    </span>
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* 3. Live Results Card */}
      {result && (
        <div className="bg-white dark:bg-[#070a14] border border-emerald-500/40 rounded-2xl p-6 space-y-6 shadow-xl shadow-emerald-500/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Simulation Execution Complete
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  {result.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                +{result.createdCount} Users Added
              </span>
            </div>
          </div>

          {/* Promotion Notifications */}
          {result.promotions && result.promotions.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} />
                <span>Rank Promotions Achieved ({result.promotions.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.promotions.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#040711] border border-amber-500/20 text-xs flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-white">{p.fullName}</strong>
                      <span className="text-slate-400 font-mono text-[11px] ml-1.5">({p.customId})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <span>Tier {p.oldTier}</span>
                      <ArrowRight size={12} className="text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        Tier {p.newTier} ({p.tierName})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created Users Directory Table */}
          {result.usersCreated && result.usersCreated.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[11px]">
                  Generated Dummy Members ({result.usersCreated.length})
                </span>
                <span className="text-[11px]">Password for all dummy users: <strong className="text-white font-mono">Demo@123456</strong></span>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/60">
                {result.usersCreated.map((u: any, idx: number) => (
                  <div key={idx} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#0d1424]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-500 font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          <span className="font-mono text-[11px] text-red-500 dark:text-red-400">
                            [{u.customId}]
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      {u.sponsorCustomId && (
                        <span className="text-slate-400">
                          Sponsor: <strong className="text-white font-mono">{u.sponsorCustomId}</strong>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.activated
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                      }`}>
                        {u.activated ? "Active ($10 USDT)" : "Registered (Inactive)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}
