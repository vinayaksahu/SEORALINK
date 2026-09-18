"use client";

import React, { useState, useEffect } from "react";
import { TIER_NAMES, TIER_VALUES, REQUIRED_DIRECTS } from "@/lib/constants";
import {
  Zap,
  UserPlus,
  Globe,
  Shuffle,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  Filter,
  Eye,
  Sliders,
  X,
  Play,
  ArrowRight,
} from "lucide-react";

export interface TreeNodeData {
  id: string;
  customId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  currentTier: number;
  tierName: string;
  directCount: number;
  requiredDirectsForNext: number;
  missingDirects: number;
  sponsorId: string | null;
  sponsorCustomId?: string | null;
  sponsorName?: string | null;
  createdAt: string;
  isRankExit: boolean;
  activeQueue?: {
    tier: number;
    queueIndex: number;
    childrenPlaced: number;
  } | null;
  children: TreeNodeData[];
}

export interface FlatUserData extends Omit<TreeNodeData, "children"> {
  childrenCount: number;
}

interface TreeViewProps {
  onSelectForForm?: (customId: string, preferredMode?: string) => void;
}

// Tier Colors Palette
const TIER_COLORS: Record<number, { bg: string; text: string; border: string; glow: string }> = {
  0: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-emerald-500/10" },
  1: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30", glow: "shadow-cyan-500/10" },
  2: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30", glow: "shadow-sky-500/10" },
  3: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30", glow: "shadow-indigo-500/10" },
  4: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", glow: "shadow-purple-500/10" },
  5: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/30", glow: "shadow-fuchsia-500/10" },
  6: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", glow: "shadow-rose-500/10" },
  7: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", glow: "shadow-amber-500/10" },
  8: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30", glow: "shadow-teal-500/10" },
  9: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", glow: "shadow-blue-500/10" },
  10: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30", glow: "shadow-violet-500/10" },
  11: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30", glow: "shadow-pink-500/10" },
  12: { bg: "bg-[#d4af37]/20", text: "text-[#d4af37]", border: "border-[#d4af37]/50", glow: "shadow-[#d4af37]/20" },
};

export default function TreeView({ onSelectForForm }: TreeViewProps) {
  const [loading, setLoading] = useState(true);
  const [treeRoots, setTreeRoots] = useState<TreeNodeData[]>([]);
  const [allUsers, setAllUsers] = useState<FlatUserData[]>([]);
  const [tierDistribution, setTierDistribution] = useState<Record<number, number>>({});
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, waitingQueuesCount: 0 });

  // View switch: "TREE" (Genealogy Tree) vs "RANK_BOARD" (Rank-wise Matrix)
  const [viewMode, setViewMode] = useState<"TREE" | "RANK_BOARD">("TREE");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXITED">("ALL");

  // Expanded Nodes in Tree view
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Selected Target User for Action Console
  const [selectedUser, setSelectedUser] = useState<FlatUserData | null>(null);

  // Simulation execution in Tree
  const [executing, setExecuting] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string>("");

  // Custom parameters inside Action Dock
  const [boostTargetTier, setBoostTargetTier] = useState<number>(1);
  const [directsCountToAdd, setDirectsCountToAdd] = useState<number>(2);
  const [queueCountToAdd, setQueueCountToAdd] = useState<number>(3);
  const [randomCountToAdd, setRandomCountToAdd] = useState<number>(5);

  const fetchTreeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/simulator/tree");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tree");

      setTreeRoots(data.roots || []);
      setAllUsers(data.allUsers || []);
      setTierDistribution(data.tierDistribution || {});
      setStats({
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        waitingQueuesCount: data.waitingQueuesCount || 0,
      });

      // Expand all roots by default
      const defaultExpanded = new Set<string>();
      data.roots?.forEach((r: TreeNodeData) => {
        defaultExpanded.add(r.id);
        // Also expand level 1 children
        r.children?.forEach((c: TreeNodeData) => defaultExpanded.add(c.id));
      });
      setExpandedNodes(defaultExpanded);

      // If a user was selected, update their object with refreshed data
      if (selectedUser) {
        const updated = (data.allUsers || []).find((u: FlatUserData) => u.id === selectedUser.id);
        if (updated) {
          setSelectedUser(updated);
          setBoostTargetTier(Math.min(12, updated.currentTier + 1));
        }
      } else if (data.allUsers?.length > 0) {
        // Default select first active user
        const first = data.allUsers.find((u: FlatUserData) => u.customId === "SL000001") || data.allUsers[0];
        setSelectedUser(first);
        setBoostTargetTier(Math.min(12, first.currentTier + 1));
      }
    } catch (err: any) {
      console.error("Error fetching tree data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreeData();
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    allUsers.forEach((u) => allIds.add(u.id));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSelectUser = (user: FlatUserData) => {
    setSelectedUser(user);
    setBoostTargetTier(Math.min(12, user.currentTier + 1));
    setExecutionResult(null);
    setExecutionError("");
  };

  // Run Simulation Actions directly from Tree View
  const runAction = async (actionType: "BOOST_RANK" | "DIRECT" | "GLOBAL" | "RANDOM") => {
    if (!selectedUser && (actionType === "BOOST_RANK" || actionType === "DIRECT")) {
      setExecutionError("Please select a target member first.");
      return;
    }

    if (selectedUser && (selectedUser.status === "EXITED" || selectedUser.isRankExit) && (actionType === "BOOST_RANK" || actionType === "DIRECT")) {
      setExecutionError(`Cannot simulate actions for ${selectedUser.customId}: This ID has exited the network and is permanently deactivated.`);
      return;
    }

    setExecuting(true);
    setExecutingAction(actionType);
    setExecutionError("");
    setExecutionResult(null);

    try {
      const payload: any = {
        mode: actionType,
        autoActivate: true,
      };

      if (actionType === "BOOST_RANK") {
        payload.targetUserIdentifier = selectedUser!.customId;
        payload.targetTier = Number(boostTargetTier);
        payload.count = 2;
      } else if (actionType === "DIRECT") {
        payload.targetUserIdentifier = selectedUser!.customId;
        payload.count = Number(directsCountToAdd);
      } else if (actionType === "GLOBAL") {
        payload.count = Number(queueCountToAdd);
        payload.sponsorStrategy = "TARGET_USER";
        payload.targetUserIdentifier = selectedUser ? selectedUser.customId : undefined;
      } else if (actionType === "RANDOM") {
        payload.count = Number(randomCountToAdd);
      }

      const res = await fetch("/api/admin/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Simulation action failed");
      }

      setExecutionResult(data);
      // Refresh tree data in real-time
      await fetchTreeData();
    } catch (err: any) {
      setExecutionError(err.message || "Failed to execute simulation action.");
    } finally {
      setExecuting(false);
      setExecutingAction(null);
    }
  };

  // Filter users
  const filteredUsers = allUsers.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        u.customId.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    if (selectedTierFilter !== "ALL" && u.currentTier !== selectedTierFilter) {
      return false;
    }

    if (statusFilter === "ACTIVE" && u.status !== "ACTIVE") return false;
    if (statusFilter === "EXITED" && u.status !== "EXITED" && !u.isRankExit) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Statistics */}
      <div className="card-seoralink p-5 bg-white dark:bg-[#070a14] border-slate-200 dark:border-[#1e293b] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 text-red-500 dark:text-red-400 border border-red-500/30">
              <GitBranch size={22} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Network Tree & Global Rank Upgrade Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/30 font-bold uppercase">
                  Live Visual
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
                Inspect rank-wise genealogy, click any member node to auto-boost ranks, inject simulated direct mentees, or pump global queue lines.
              </p>
            </div>
          </div>

          {/* View Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode("TREE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "TREE"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-[#94a3b8] hover:text-white"
                }`}
              >
                <GitBranch size={14} />
                <span>Genealogy Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("RANK_BOARD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "RANK_BOARD"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-[#94a3b8] hover:text-white"
                }`}
              >
                <Layers size={14} />
                <span>Rank Board Matrix</span>
              </button>
            </div>

            {viewMode === "TREE" && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="Expand All Nodes"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="Collapse All Nodes"
                >
                  Collapse All
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={fetchTreeData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors cursor-pointer"
              title="Refresh Network Data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-red-400" : ""} />
            </button>
          </div>
        </div>

        {/* Search & Rank Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by ID (e.g. SL280461) or Name..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-red-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Rank Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-[11px] font-bold text-slate-400 dark:text-[#64748b] uppercase mr-1 flex items-center gap-1 shrink-0">
              <Filter size={12} /> Rank:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTierFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedTierFilter === "ALL"
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              All ({stats.totalUsers})
            </button>
            {[0, 1, 2, 3, 4, 5, 12].map((tier) => {
              const count = tierDistribution[tier] || 0;
              const color = TIER_COLORS[tier] || TIER_COLORS[0];
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedTierFilter(tier)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    selectedTierFilter === tier
                      ? `${color.bg} ${color.text} border ${color.border} ring-1 ring-red-500`
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>T{tier}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Visualization Area */}
      {loading ? (
        <div className="card-seoralink p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-red-500" />
          <div className="text-xs font-bold tracking-wide">Assembling Network Tree & Telemetry...</div>
        </div>
      ) : viewMode === "TREE" ? (
        /* TREE GENEALOGY VIEW */
        <div className="card-seoralink p-6 bg-[#040711] border-slate-800/80 overflow-x-auto min-h-[400px]">
          {treeRoots.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching members found in network tree.
            </div>
          ) : (
            <div className="space-y-4 min-w-[700px]">
              {treeRoots.map((root) => (
                <TreeNodeItem
                  key={root.id}
                  node={root}
                  level={0}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  selectedUser={selectedUser}
                  onSelectUser={handleSelectUser}
                  searchQuery={searchQuery}
                  selectedTierFilter={selectedTierFilter}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* RANK BOARD MATRIX VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tier) => {
            const usersInTier = filteredUsers.filter((u) => u.currentTier === tier);
            if (usersInTier.length === 0 && selectedTierFilter !== "ALL" && selectedTierFilter !== tier) {
              return null;
            }
            const color = TIER_COLORS[tier] || TIER_COLORS[0];
            return (
              <div
                key={tier}
                className="card-seoralink p-4 bg-[#070a14] border-slate-800/80 flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color.bg} border ${color.border}`}></span>
                    <span className="text-xs font-extrabold text-white">
                      Tier {tier} &bull; {TIER_NAMES[tier]}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color.bg} ${color.text} border ${color.border}`}>
                    {usersInTier.length} Member{usersInTier.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {usersInTier.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-slate-500 border border-dashed border-slate-800/60 rounded-xl">
                      No members at Tier {tier}
                    </div>
                  ) : (
                    usersInTier.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      return (
                        <div
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-red-500/15 border-red-500 shadow-md shadow-red-500/10"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-extrabold font-mono-num text-[#d4af37]">
                              {u.customId}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                u.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : u.status === "EXITED"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {u.status}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-white truncate mb-1">
                            {u.fullName}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                            <span>
                              Directs: <strong className="text-white">{u.directCount}</strong> / {u.requiredDirectsForNext}
                            </span>
                            {u.missingDirects > 0 ? (
                              <span className="text-amber-400 font-bold">
                                {u.missingDirects} needed
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Qualified</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Interactive Target Action Dock (Flyout Console) */}
      {selectedUser && (
        <div className="card-seoralink p-5 bg-gradient-to-r from-red-950/40 via-[#070a14] to-slate-950 border-red-500/40 rounded-2xl shadow-xl shadow-red-950/20 space-y-5">
          {/* Target Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/40 flex items-center justify-center text-white font-extrabold text-lg">
                {selectedUser.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">
                    {selectedUser.fullName}
                  </span>
                  <span className="text-xs font-mono-num font-bold text-[#d4af37] px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30">
                    {selectedUser.customId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedUser.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : selectedUser.status === "EXITED"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {selectedUser.status}
                  </span>
                </div>
                <div className="text-xs text-[#94a3b8] mt-1 flex flex-wrap items-center gap-2">
                  <span>
                    Current Rank: <strong className="text-sky-400">Tier {selectedUser.currentTier} ({selectedUser.tierName})</strong>
                  </span>
                  &bull;
                  <span>
                    Sponsor: <strong className="text-slate-200">{selectedUser.sponsorCustomId || "Direct Platform"}</strong>
                  </span>
                  {selectedUser.activeQueue && (
                    <>
                      &bull;
                      <span className="text-emerald-400">
                        Waiting in Tier {selectedUser.activeQueue.tier} Queue (Pos #{selectedUser.activeQueue.queueIndex + 1})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Directs Telemetry Pills */}
            {(() => {
              const isSelectedUserExited = selectedUser.status === "EXITED" || selectedUser.isRankExit;
              return (
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                    <div className="text-[10px] text-[#94a3b8] uppercase font-bold">Direct Referrals</div>
                    <div className="text-sm font-extrabold text-white">
                      {selectedUser.directCount} <span className="text-xs text-[#94a3b8]">/ {selectedUser.requiredDirectsForNext}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-center border ${
                    isSelectedUserExited 
                      ? "bg-rose-950/60 border-rose-500/40" 
                      : "bg-slate-900/80 border-slate-800"
                  }`}>
                    <div className={`text-[10px] uppercase font-bold ${
                      isSelectedUserExited ? "text-rose-400" : "text-[#94a3b8]"
                    }`}>
                      {isSelectedUserExited ? "Simulator Status" : "Next Rank Target"}
                    </div>
                    <div className={`text-sm font-extrabold ${
                      isSelectedUserExited 
                        ? "text-rose-400" 
                        : selectedUser.missingDirects > 0 ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {isSelectedUserExited 
                        ? "DISABLED (EXITED)" 
                        : selectedUser.missingDirects > 0 ? `${selectedUser.missingDirects} Missing` : "Ready to Advance"}
                    </div>
                  </div>
                  {onSelectForForm && (
                    <button
                      type="button"
                      disabled={isSelectedUserExited}
                      onClick={() => !isSelectedUserExited && onSelectForForm(selectedUser.customId)}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                        isSelectedUserExited
                          ? "bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40"
                          : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer"
                      }`}
                      title={isSelectedUserExited ? "Simulator Disabled for Exited User" : "Configure in Standard Simulator Form"}
                    >
                      <Sliders size={14} />
                      <span>Open Form</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Exited Account Alert Warning Banner */}
          {(selectedUser.status === "EXITED" || selectedUser.isRankExit) && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-3 animate-in fade-in duration-200">
              <ShieldAlert size={22} className="text-rose-400 shrink-0" />
              <div>
                <div className="font-extrabold text-white text-sm flex items-center gap-2">
                  <span>Simulator Options Disabled</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-mono uppercase">
                    Account Exited
                  </span>
                </div>
                <p className="text-[11.5px] text-rose-300/90 mt-1 leading-relaxed">
                  Member <strong>{selectedUser.fullName} ({selectedUser.customId})</strong> has performed a Rank Exit Cashout. This account is permanently deactivated and barred from receiving new rank upgrades, direct referral injection, or queue advancement.
                </p>
              </div>
            </div>
          )}

          {/* Action Execution Status / Result Banners */}
          {executionError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{executionError}</span>
            </div>
          )}

          {executionResult && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 size={18} /> Simulation Executed Successfully!
                </span>
                <span className="text-[11px] font-mono-num font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  +{executionResult.createdCount} Users Created
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{executionResult.message}</p>
              {executionResult.promotions?.length > 0 && (
                <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap gap-2">
                  <span className="font-bold text-white">Promotions:</span>
                  {executionResult.promotions.map((p: any) => (
                    <span
                      key={p.userId}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-bold text-[11px]"
                    >
                      {p.fullName} ({p.customId}) &rarr; {p.tierName} (Tier {p.newTier})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Simulation Action Grid for Selected User */}
          {(() => {
            const isSelectedUserExited = selectedUser.status === "EXITED" || selectedUser.isRankExit;
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                {/* ACTION 1: AUTO-BOOST TO NEXT RANK */}
                <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isSelectedUserExited
                    ? "bg-slate-900/30 border-slate-800/80 opacity-60"
                    : "bg-slate-900/60 border-red-500/30 hover:border-red-500/60"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`p-1.5 rounded-lg ${isSelectedUserExited ? "bg-slate-800 text-slate-500" : "bg-red-500/20 text-red-400"}`}>
                        <Zap size={15} />
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelectedUserExited ? "bg-slate-800 text-slate-500" : "bg-red-500/20 text-red-400"
                      }`}>
                        {isSelectedUserExited ? "Disabled" : "Instant Upgrade"}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">Auto-Boost Rank</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isSelectedUserExited
                        ? "Rank upgrades are disabled for this ID because it has already exited the system."
                        : `Fulfills missing directs (${selectedUser.missingDirects}) & triggers queue match to promote.`}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                        Target:
                      </label>
                      <select
                        value={boostTargetTier}
                        onChange={(e) => setBoostTargetTier(Number(e.target.value))}
                        disabled={executing || isSelectedUserExited}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                          .filter((t) => t > selectedUser.currentTier)
                          .map((t) => (
                            <option key={t} value={t}>
                              Tier {t} ({TIER_NAMES[t]})
                            </option>
                          ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => runAction("BOOST_RANK")}
                      disabled={executing || isSelectedUserExited || selectedUser.currentTier >= 12}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        isSelectedUserExited
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none"
                          : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50"
                      }`}
                    >
                      {executing && executingAction === "BOOST_RANK" ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Play size={13} fill="currentColor" />
                      )}
                      <span>
                        {isSelectedUserExited
                          ? "Disabled (ID Exited)"
                          : selectedUser.currentTier >= 12
                          ? "Pinnacle Reached"
                          : `Boost to Tier ${boostTargetTier}`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ACTION 2: DIRECT UNDER TARGET USER */}
                <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isSelectedUserExited
                    ? "bg-slate-900/30 border-slate-800/80 opacity-60"
                    : "bg-slate-900/60 border-sky-500/30 hover:border-sky-500/60"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`p-1.5 rounded-lg ${isSelectedUserExited ? "bg-slate-800 text-slate-500" : "bg-sky-500/20 text-sky-400"}`}>
                        <UserPlus size={15} />
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelectedUserExited ? "bg-slate-800 text-slate-500" : "bg-sky-500/20 text-sky-400"
                      }`}>
                        {isSelectedUserExited ? "Disabled" : "Direct Mentees"}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">Direct Under User</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isSelectedUserExited
                        ? "Cannot sponsor new simulated members under an exited account."
                        : `Generates dummy accounts sponsored by ${selectedUser.customId}, granting $0.50 cash & counts.`}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1">
                      {[1, 2, 5].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          disabled={isSelectedUserExited}
                          onClick={() => setDirectsCountToAdd(cnt)}
                          className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors ${
                            isSelectedUserExited
                              ? "bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed"
                              : directsCountToAdd === cnt
                              ? "bg-sky-500/20 border-sky-500 text-sky-300"
                              : "bg-slate-950 border-slate-800 text-slate-400"
                          }`}
                        >
                          +{cnt}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => runAction("DIRECT")}
                      disabled={executing || isSelectedUserExited}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                        isSelectedUserExited
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none"
                          : "bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50"
                      }`}
                    >
                      {executing && executingAction === "DIRECT" ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <UserPlus size={13} />
                      )}
                      <span>
                        {isSelectedUserExited
                          ? "Disabled (ID Exited)"
                          : `Add ${directsCountToAdd} Direct(s)`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ACTION 3: GLOBAL SINGLE-LEG QUEUE */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Globe size={15} />
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Tripod Matching
                  </span>
                </div>
                <div className="text-xs font-bold text-white">Global Queue Push</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Injects sequential volume into Tier 0 FIFO queue to accelerate Tripod 2:1 matching.
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  {[2, 4, 8].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQueueCountToAdd(cnt)}
                      className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors ${
                        queueCountToAdd === cnt
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      +{cnt}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => runAction("GLOBAL")}
                  disabled={executing}
                  className="w-full py-2 px-3 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {executing && executingAction === "GLOBAL" ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Globe size={13} />
                  )}
                  <span>Inject {queueCountToAdd} Nodes</span>
                </button>
              </div>
            </div>

            {/* ACTION 4: RANDOM NETWORK SPREAD */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-purple-500/30 hover:border-purple-500/60 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Shuffle size={15} />
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                    Network Pool
                  </span>
                </div>
                <div className="text-xs font-bold text-white">Random Spread</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Distributes dummy users randomly across all network leaders to simulate natural community growth.
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  {[5, 10, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setRandomCountToAdd(cnt)}
                      className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors ${
                        randomCountToAdd === cnt
                          ? "bg-purple-500/20 border-purple-500 text-purple-300"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      +{cnt}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => runAction("RANDOM")}
                  disabled={executing}
                  className="w-full py-2 px-3 rounded-lg text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {executing && executingAction === "RANDOM" ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Shuffle size={13} />
                  )}
                  <span>Spread {randomCountToAdd} Users</span>
                </button>
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// Sub-Component: Recursive Tree Node Item
interface TreeNodeItemProps {
  node: TreeNodeData;
  level: number;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  selectedUser: FlatUserData | null;
  onSelectUser: (u: FlatUserData) => void;
  searchQuery: string;
  selectedTierFilter: number | "ALL";
}

function TreeNodeItem({
  node,
  level,
  expandedNodes,
  toggleNode,
  selectedUser,
  onSelectUser,
  searchQuery,
  selectedTierFilter,
}: TreeNodeItemProps) {
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedUser?.id === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const color = TIER_COLORS[node.currentTier] || TIER_COLORS[0];

  // Check search filter match
  const matchesSearch =
    !searchQuery.trim() ||
    node.customId.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    node.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim());

  // Check tier filter match
  const matchesTier =
    selectedTierFilter === "ALL" || node.currentTier === selectedTierFilter;

  const isExited = node.status === "EXITED" || node.isRankExit;

  // Flatten flat data for selection
  const flatData: FlatUserData = {
    ...node,
    childrenCount: node.children.length,
  };

  return (
    <div className="space-y-2">
      {/* Node Card */}
      <div
        className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
          level > 0 ? "ml-6 border-l-2" : ""
        } ${
          isSelected
            ? isExited
              ? "bg-rose-950/25 border-rose-500 shadow-md shadow-rose-950/30 ring-1 ring-rose-500"
              : "bg-red-500/15 border-red-500 shadow-md shadow-red-500/10 ring-1 ring-red-500"
            : isExited
            ? "bg-rose-950/10 border-rose-900/40 hover:border-rose-700/60"
            : matchesSearch && matchesTier
            ? "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
            : "bg-slate-950/40 border-slate-900 opacity-50 hover:opacity-100"
        }`}
        onClick={() => onSelectUser(flatData)}
      >
        {/* Expand / Collapse Button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node.id);
            }}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Tier Indicator Pill */}
        <span
          className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded border ${color.bg} ${color.text} ${color.border}`}
        >
          T{node.currentTier}: {node.tierName}
        </span>

        {/* Member ID & Name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-mono-num font-extrabold text-[#d4af37]">
            {node.customId}
          </span>
          <span className="text-xs font-bold text-white truncate">
            {node.fullName}
          </span>
        </div>

        {/* Directs Qualification Pill */}
        <div className="hidden sm:flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">
            Directs: <strong className="text-white">{node.directCount}</strong> / {node.requiredDirectsForNext}
          </span>
          {node.missingDirects > 0 ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {node.missingDirects} needed
            </span>
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Qualified
            </span>
          )}
        </div>

        {/* Status Badge */}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            node.status === "ACTIVE"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : isExited || node.status === "EXITED"
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
          }`}
        >
          {isExited ? "EXITED" : node.status}
        </span>

        {/* Action Trigger Button */}
        <button
          type="button"
          disabled={isExited}
          onClick={(e) => {
            e.stopPropagation();
            if (!isExited) onSelectUser(flatData);
          }}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
            isExited
              ? "bg-slate-800/40 text-slate-600 border border-slate-800/60 opacity-30 cursor-not-allowed"
              : isSelected
              ? "bg-red-500 text-white cursor-pointer"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
          }`}
          title={isExited ? "Simulator Options Disabled: ID has EXITED" : "Select & Manage User"}
        >
          <Zap size={13} />
        </button>
      </div>

      {/* Recursive Children (Downlines) */}
      {hasChildren && isExpanded && (
        <div className="space-y-2 border-l border-slate-800/80 ml-5 pl-2">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              selectedUser={selectedUser}
              onSelectUser={onSelectUser}
              searchQuery={searchQuery}
              selectedTierFilter={selectedTierFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
