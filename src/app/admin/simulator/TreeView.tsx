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
  GitCommit,
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
  Trophy,
  List,
  Network,
  Clock,
  ArrowDownRight,
} from "lucide-react";
import MemberAuditModal from "@/components/MemberAuditModal";
import type {
  MatrixPlacementInfo,
  MatrixTreeNode,
  TierMatrixSummary,
} from "@/app/api/admin/simulator/tree/route";

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
  matrixPlacement?: MatrixPlacementInfo | null;
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

  // View switch: "TREE" (Genealogy Tree) vs "MATRIX_TREE" (2:1 Autopool Matrix Tree) vs "RANK_BOARD" (Rank-wise Matrix)
  const [viewMode, setViewMode] = useState<"TREE" | "MATRIX_TREE" | "RANK_BOARD">("TREE");

  // Matrix Tree State
  const [matrixTrees, setMatrixTrees] = useState<Record<number, MatrixTreeNode[]>>({});
  const [matrixFlatEntries, setMatrixFlatEntries] = useState<Record<number, MatrixTreeNode[]>>({});
  const [matrixSummaries, setMatrixSummaries] = useState<TierMatrixSummary[]>([]);
  const [selectedMatrixTier, setSelectedMatrixTier] = useState<number>(1); // Default to Tier 1 (Zen)
  const [matrixLayoutMode, setMatrixLayoutMode] = useState<"TREE" | "TABLE">("TREE");
  const [matrixSearch, setMatrixSearch] = useState<string>("");
  const [matrixHighlightedNode, setMatrixHighlightedNode] = useState<string | null>(null);
  const [expandedMatrixNodes, setExpandedMatrixNodes] = useState<Set<number>>(new Set());

  // Filters for Genealogy Tree & Rank Board
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXITED">("ALL");

  // Expanded Nodes in Genealogy Tree view
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Selected Target User for Action Console
  const [selectedUser, setSelectedUser] = useState<FlatUserData | null>(null);
  const [auditTargetId, setAuditTargetId] = useState<string | null>(null);

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

      // Save matrix data
      setMatrixTrees(data.matrixTrees || {});
      setMatrixFlatEntries(data.matrixFlatEntries || {});
      setMatrixSummaries(data.matrixSummaries || []);

      // Auto-expand top 30 indices in matrix tree by default
      const defaultMatrixExp = new Set<number>();
      for (let i = 0; i <= 35; i++) {
        defaultMatrixExp.add(i);
      }
      setExpandedMatrixNodes(defaultMatrixExp);

      // Expand all roots by default in genealogy tree
      const defaultExpanded = new Set<string>();
      data.roots?.forEach((r: TreeNodeData) => {
        defaultExpanded.add(r.id);
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

  // Matrix Tree toggling
  const toggleMatrixNode = (queueIndex: number) => {
    setExpandedMatrixNodes((prev) => {
      const next = new Set(prev);
      if (next.has(queueIndex)) {
        next.delete(queueIndex);
      } else {
        next.add(queueIndex);
      }
      return next;
    });
  };

  const expandAllMatrix = () => {
    const allIndices = new Set<number>();
    const entries = matrixFlatEntries[selectedMatrixTier] || [];
    entries.forEach((e) => allIndices.add(e.queueIndex));
    setExpandedMatrixNodes(allIndices);
  };

  const collapseAllMatrix = () => {
    setExpandedMatrixNodes(new Set());
  };

  const handleSelectUser = (user: FlatUserData) => {
    setSelectedUser(user);
    setBoostTargetTier(Math.min(12, user.currentTier + 1));
    setExecutionResult(null);
    setExecutionError("");
  };

  const handleSelectUserByCustomId = (customId: string) => {
    const user = allUsers.find((u) => u.customId === customId);
    if (user) {
      handleSelectUser(user);
    }
  };

  // Jump from Genealogy Tree directly to 2:1 Matrix Tree
  const navigateToMatrixTier = (tier: number, targetCustomId?: string) => {
    setSelectedMatrixTier(tier);
    setViewMode("MATRIX_TREE");
    if (targetCustomId) {
      setMatrixHighlightedNode(targetCustomId);
      setMatrixSearch(targetCustomId);
      setTimeout(() => {
        const el = document.getElementById(`matrix-node-${targetCustomId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  };

  // Run Simulation Actions directly from Tree View
  const runAction = async (actionType: "BOOST_RANK" | "DIRECT" | "GLOBAL" | "RANDOM") => {
    if (!selectedUser && (actionType === "BOOST_RANK" || actionType === "DIRECT")) {
      setExecutionError("Please select a target member first.");
      return;
    }

    if (
      selectedUser &&
      (selectedUser.status === "EXITED" || selectedUser.isRankExit) &&
      (actionType === "BOOST_RANK" || actionType === "DIRECT")
    ) {
      setExecutionError(
        `Cannot simulate actions for ${selectedUser.customId}: This ID has exited the network and is permanently deactivated.`
      );
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
      await fetchTreeData();
    } catch (err: any) {
      setExecutionError(err.message || "Failed to execute simulation action.");
    } finally {
      setExecuting(false);
    }
  };

  // Filter users for Rank Board
  const filteredUsers = allUsers.filter((u) => {
    if (selectedTierFilter !== "ALL" && u.currentTier !== selectedTierFilter) return false;
    if (statusFilter === "ACTIVE" && (u.status !== "ACTIVE" || u.isRankExit)) return false;
    if (statusFilter === "EXITED" && !u.isRankExit && u.status !== "EXITED") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = u.customId.toLowerCase().includes(q);
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchEmail) return false;
    }
    return true;
  });

  const activeMatrixSummary = matrixSummaries.find((s) => s.tier === selectedMatrixTier) || {
    tier: selectedMatrixTier,
    tierName: TIER_NAMES[selectedMatrixTier] || `Tier ${selectedMatrixTier}`,
    tierValue: TIER_VALUES[selectedMatrixTier] || 0,
    totalNodes: (matrixFlatEntries[selectedMatrixTier] || []).length,
    waitingNodes: (matrixFlatEntries[selectedMatrixTier] || []).filter((e) => e.status === "WAITING").length,
    completedNodes: (matrixFlatEntries[selectedMatrixTier] || []).filter((e) => e.status === "COMPLETED").length,
    nextQueueIndex: (matrixFlatEntries[selectedMatrixTier] || []).length,
    requiredDirects: REQUIRED_DIRECTS[selectedMatrixTier] || 0,
  };

  const currentTierMatrixRoots = matrixTrees[selectedMatrixTier] || [];
  const currentTierFlatEntries = (matrixFlatEntries[selectedMatrixTier] || []).filter((entry) => {
    if (!matrixSearch.trim()) return true;
    const q = matrixSearch.toLowerCase().trim();
    return (
      entry.customId.toLowerCase().includes(q) ||
      entry.fullName.toLowerCase().includes(q) ||
      entry.queueIndex.toString() === q ||
      entry.parent?.customId.toLowerCase().includes(q) ||
      entry.parent?.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="card-seoralink p-5 bg-[#070a14] border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                <GitBranch size={18} />
              </span>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Network Tree & 2:1 Autopool Matrix System
              </h3>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Switch seamlessly between Direct Referral Genealogy and 2:1 Tripod Autopool Matrix Trees to verify exact member placements.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2">
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
                onClick={() => setViewMode("MATRIX_TREE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "MATRIX_TREE"
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-[#94a3b8] hover:text-white"
                }`}
              >
                <GitCommit size={14} />
                <span>2:1 Autopool Matrix Tree</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("RANK_BOARD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "RANK_BOARD"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-[#94a3b8] hover:text-white"
                }`}
              >
                <Layers size={14} />
                <span>Rank Board</span>
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

            {viewMode === "MATRIX_TREE" && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={expandAllMatrix}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="Expand All Matrix Nodes"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAllMatrix}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="Collapse All Matrix Nodes"
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

        {/* Search & Rank Filter Bar for Genealogy & Board */}
        {viewMode !== "MATRIX_TREE" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by ID (e.g. SL699223), name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedTierFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedTierFilter === "ALL"
                    ? "bg-red-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                All Ranks ({allUsers.length})
              </button>

              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tier) => {
                const count = tierDistribution[tier] || 0;
                if (count === 0 && tier > 4) return null;
                const color = TIER_COLORS[tier] || TIER_COLORS[0];
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTierFilter(tier)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
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
        )}
      </div>

      {/* 2. Main Visualization Area */}
      {loading ? (
        <div className="card-seoralink p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-red-500" />
          <div className="text-xs font-bold tracking-wide">Assembling Network Tree & Matrix Telemetry...</div>
        </div>
      ) : viewMode === "TREE" ? (
        /* GENEALOGY TREE VIEW */
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
                  onNavigateToMatrix={navigateToMatrixTier}
                />
              ))}
            </div>
          )}
        </div>
      ) : viewMode === "MATRIX_TREE" ? (
        /* 2:1 AUTOPOOL MATRIX TREE VIEW */
        <div className="space-y-5">
          {/* Matrix Tier Selector Header */}
          <div className="card-seoralink p-4 bg-[#070a14] border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                  Select Autopool Matrix Rank
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <span>Tier {selectedMatrixTier}: {activeMatrixSummary.tierName}</span>
                    <span className="text-sky-400 font-mono">(${activeMatrixSummary.tierValue})</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    2:1 Tripod Single-Leg Matrix
                  </span>
                </div>
              </div>

              {/* Layout Switcher (Visual Tree vs Queue Placement Table) */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMatrixLayoutMode("TREE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      matrixLayoutMode === "TREE"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Network size={13} />
                    <span>Visual 2:1 Tree</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixLayoutMode("TABLE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      matrixLayoutMode === "TABLE"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <List size={13} />
                    <span>Placement Table</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Matrix Tier Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((t) => {
                const summary = matrixSummaries.find((s) => s.tier === t);
                const count = summary ? summary.totalNodes : 0;
                const isSelected = selectedMatrixTier === t;
                const color = TIER_COLORS[t] || TIER_COLORS[0];

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedMatrixTier(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : color.text}`}></span>
                    <span>T{t}: {TIER_NAMES[t]}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : count > 0
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Telemetry Stats Bar for Selected Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Enrolled Nodes</span>
                <div className="text-sm font-extrabold text-white mt-0.5">
                  {activeMatrixSummary.totalNodes} Nodes
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Matches Completed (100%)</span>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  {activeMatrixSummary.completedNodes} Nodes Rolled
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-amber-400 uppercase font-bold">Waiting for Matching</span>
                <div className="text-sm font-extrabold text-amber-400 mt-0.5">
                  {activeMatrixSummary.waitingNodes} Nodes In Queue
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-sky-400 uppercase font-bold">Next Incoming Placement Slot</span>
                <div className="text-sm font-extrabold text-sky-400 mt-0.5">
                  Queue Index #{activeMatrixSummary.nextQueueIndex}
                </div>
              </div>
            </div>

            {/* Matrix Search Bar */}
            <div className="relative max-w-md pt-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                placeholder="Search member in matrix (e.g. SL699223, Bineeta, Vinayak)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder:text-slate-500 font-medium"
              />
              {matrixSearch && (
                <button
                  onClick={() => setMatrixSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Matrix Content: Visual Tree or Table */}
          {activeMatrixSummary.totalNodes === 0 ? (
            <div className="card-seoralink p-12 text-center text-slate-400 border-dashed border-slate-800 bg-[#040711]">
              <GitCommit size={32} className="mx-auto text-slate-600 mb-2" />
              <div className="text-sm font-bold text-white">No Members Enrolled in Tier {selectedMatrixTier} Matrix</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Members enter this 2:1 Tripod matrix sequentially as they fulfill their direct sponsor requirements and roll from Tier {Math.max(0, selectedMatrixTier - 1)}.
              </p>
            </div>
          ) : matrixLayoutMode === "TREE" ? (
            /* VISUAL 2:1 TREE */
            <div className="card-seoralink p-6 bg-[#040711] border-slate-800/80 overflow-x-auto min-h-[400px]">
              <div className="space-y-4 min-w-[700px]">
                {currentTierMatrixRoots.map((rootNode) => (
                  <MatrixTreeBranch
                    key={rootNode.id}
                    node={rootNode}
                    level={0}
                    expandedMatrixNodes={expandedMatrixNodes}
                    toggleMatrixNode={toggleMatrixNode}
                    selectedUser={selectedUser}
                    onSelectUserByCustomId={handleSelectUserByCustomId}
                    searchQuery={matrixSearch}
                    highlightedCustomId={matrixHighlightedNode}
                    onAuditTarget={(cid) => setAuditTargetId(cid)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* CHRONOLOGICAL PLACEMENT TABLE */
            <div className="card-seoralink p-4 bg-[#070a14] border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Queue #</th>
                    <th className="py-2.5 px-3">Member Details</th>
                    <th className="py-2.5 px-3">Matrix Placement (Placed Under)</th>
                    <th className="py-2.5 px-3">Placement Unit</th>
                    <th className="py-2.5 px-3">2:1 Matched</th>
                    <th className="py-2.5 px-3">Directs</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Enrolled At</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {currentTierFlatEntries.map((entry) => {
                    const isSelected = selectedUser?.customId === entry.customId;
                    const isHighlighted =
                      matrixHighlightedNode === entry.customId ||
                      (matrixSearch &&
                        (entry.customId.toLowerCase().includes(matrixSearch.toLowerCase().trim()) ||
                          entry.fullName.toLowerCase().includes(matrixSearch.toLowerCase().trim())));

                    return (
                      <tr
                        key={entry.id}
                        id={`matrix-node-${entry.customId}`}
                        className={`transition-colors cursor-pointer ${
                          isHighlighted
                            ? "bg-sky-950/40 ring-1 ring-sky-500"
                            : isSelected
                            ? "bg-red-500/10"
                            : "hover:bg-slate-900/60"
                        }`}
                        onClick={() => handleSelectUserByCustomId(entry.customId)}
                      >
                        <td className="py-2.5 px-3 font-mono font-extrabold text-sky-400">
                          #{entry.queueIndex}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-extrabold text-[#d4af37] font-mono-num">
                            {entry.customId}
                          </div>
                          <div className="text-white font-bold">{entry.fullName}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {entry.parent ? (
                            <div>
                              <span className="font-mono font-extrabold text-amber-300">
                                {entry.parent.customId}
                              </span>
                              <div className="text-slate-300 font-medium text-[11px]">
                                {entry.parent.fullName} (Queue #{entry.parent.queueIndex})
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              👑 Genesis Root Node
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              entry.position === "ROOT"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : entry.position === "LEFT"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                          >
                            {entry.position === "ROOT"
                              ? "Genesis Root"
                              : entry.position === "LEFT"
                              ? "Unit 1 (Left Leg)"
                              : "Unit 2 (Right Leg)"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span
                              className={
                                entry.childrenPlaced === 2
                                  ? "text-emerald-400"
                                  : entry.childrenPlaced === 1
                                  ? "text-sky-400"
                                  : "text-slate-400"
                              }
                            >
                              {entry.childrenPlaced} / 2
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({entry.childrenPlaced * 50}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              entry.isDirectsMet
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {entry.directCount} / {entry.requiredDirects} {entry.isDirectsMet ? "✅" : "⚠️"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              entry.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#64748b] text-[11px]">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuditTargetId(entry.customId);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 mr-1.5 transition-colors"
                            title="Audit Progression & Commissions"
                          >
                            <Trophy size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* RANK BOARD VIEW */
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

                          {/* Matrix placement indication on rank board */}
                          {u.matrixPlacement && (
                            <div className="text-[10px] text-slate-400 mb-1.5 flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800/60">
                              <span>Matrix Parent:</span>
                              <span className="font-mono font-bold text-amber-300">
                                {u.matrixPlacement.parent?.customId || "Root #0"}
                              </span>
                            </div>
                          )}

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
                  {selectedUser.matrixPlacement && (
                    <>
                      &bull;
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        📍 Matrix: {selectedUser.matrixPlacement.parent ? `Placed under ${selectedUser.matrixPlacement.parent.customId} (${selectedUser.matrixPlacement.parent.fullName}) • ${selectedUser.matrixPlacement.position} (Queue #${selectedUser.matrixPlacement.queueIndex})` : `Genesis Root (#0)`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Directs Telemetry Pills & Audit/Matrix Navigation Buttons */}
            {(() => {
              const isSelectedUserExited = selectedUser.status === "EXITED" || selectedUser.isRankExit;
              return (
                <div className="flex items-center gap-2.5 flex-wrap text-xs shrink-0">
                  <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                    <div className="text-[10px] text-[#94a3b8] uppercase font-bold">Direct Referrals</div>
                    <div className="text-sm font-extrabold text-white">
                      {selectedUser.directCount} <span className="text-xs text-[#94a3b8]">/ {selectedUser.requiredDirectsForNext}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateToMatrixTier(selectedUser.matrixPlacement?.tier ?? selectedUser.currentTier, selectedUser.customId)}
                    className="px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 cursor-pointer text-xs"
                    title="View 2:1 Autopool Matrix Tree for this Member"
                  >
                    <GitCommit size={14} className="text-sky-400" />
                    <span>View in Matrix Tree</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuditTargetId(selectedUser.customId)}
                    className="px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 cursor-pointer shadow-sm shadow-amber-500/10 text-xs"
                    title="Inspect Rank Progression & Commission Ledger"
                  >
                    <Trophy size={14} className="text-amber-400" />
                    <span>Audit Rank & Commissions</span>
                  </button>

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
                              Tier {t}: {TIER_NAMES[t]}
                            </option>
                          ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => runAction("BOOST_RANK")}
                      disabled={executing || isSelectedUserExited}
                      className="w-full py-2 px-3 rounded-lg text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {executing && executingAction === "BOOST_RANK" ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Zap size={13} />
                      )}
                      <span>
                        {isSelectedUserExited
                          ? "Disabled (ID Exited)"
                          : `Boost to Tier ${boostTargetTier}`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ACTION 2: INJECT DIRECT REFERRALS */}
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
                        Direct Bonus
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">Inject Directs</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isSelectedUserExited
                        ? "Referral additions are disabled for this ID because it has already exited the network."
                        : "Creates & activates direct downstream accounts under this member, paying 5% direct commission."}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1">
                      {[1, 2, 4].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setDirectsCountToAdd(cnt)}
                          disabled={isSelectedUserExited}
                          className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors ${
                            isSelectedUserExited
                              ? "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed"
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
                      className="w-full py-2 px-3 rounded-lg text-xs font-extrabold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ================= MEMBER RANK & COMMISSION AUDIT MODAL ================= */}
      <MemberAuditModal
        identifier={auditTargetId}
        isOpen={!!auditTargetId}
        onClose={() => setAuditTargetId(null)}
      />
    </div>
  );
}

// ==========================================
// Sub-Component 1: Recursive Tree Node Item (Genealogy Tree)
// ==========================================
interface TreeNodeItemProps {
  node: TreeNodeData;
  level: number;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  selectedUser: FlatUserData | null;
  onSelectUser: (u: FlatUserData) => void;
  searchQuery: string;
  selectedTierFilter: number | "ALL";
  onNavigateToMatrix?: (tier: number, targetCustomId?: string) => void;
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
  onNavigateToMatrix,
}: TreeNodeItemProps) {
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedUser?.id === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const color = TIER_COLORS[node.currentTier] || TIER_COLORS[0];

  const matchesSearch =
    !searchQuery.trim() ||
    node.customId.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    node.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim());

  const matchesTier =
    selectedTierFilter === "ALL" || node.currentTier === selectedTierFilter;

  const isExited = node.status === "EXITED" || node.isRankExit;

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
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono-num font-extrabold text-[#d4af37]">
            {node.customId}
          </span>
          <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[200px]">
            {node.fullName}
          </span>
        </div>

        {/* Prominent Matrix Placement Badge (Under Which ID placed in Matrix) */}
        {node.matrixPlacement && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToMatrix?.(node.matrixPlacement!.tier, node.customId);
            }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 text-sky-300 transition-all cursor-pointer group"
            title={`View ${node.fullName} in ${node.matrixPlacement.tierName} 2:1 Autopool Matrix Tree`}
          >
            <GitCommit size={12} className="text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-[#94a3b8]">Matrix:</span>
            {node.matrixPlacement.parent ? (
              <span>
                Placed under <strong className="text-amber-300 font-mono font-extrabold">{node.matrixPlacement.parent.customId}</strong>{" "}
                <span className="text-white">({node.matrixPlacement.parent.fullName})</span>{" "}
                <span className="text-sky-400 font-medium">• {node.matrixPlacement.position}</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">Genesis Root (#0)</span>
            )}
            <span className="font-mono text-[9.5px] bg-sky-500/20 text-sky-200 px-1.5 py-0.2 rounded border border-sky-500/30">
              #{node.matrixPlacement.queueIndex}
            </span>
            <ArrowRight size={10} className="text-sky-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        <div className="flex-1" />

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
              onNavigateToMatrix={onNavigateToMatrix}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Sub-Component 2: Visual 2:1 Tripod Matrix Tree Branch
// ==========================================
interface MatrixTreeBranchProps {
  node: MatrixTreeNode;
  level: number;
  expandedMatrixNodes: Set<number>;
  toggleMatrixNode: (queueIndex: number) => void;
  selectedUser: FlatUserData | null;
  onSelectUserByCustomId: (customId: string) => void;
  searchQuery: string;
  highlightedCustomId: string | null;
  onAuditTarget: (customId: string) => void;
}

function MatrixTreeBranch({
  node,
  level,
  expandedMatrixNodes,
  toggleMatrixNode,
  selectedUser,
  onSelectUserByCustomId,
  searchQuery,
  highlightedCustomId,
  onAuditTarget,
}: MatrixTreeBranchProps) {
  const isExpanded = expandedMatrixNodes.has(node.queueIndex);
  const isSelected = selectedUser?.customId === node.customId;
  const isHighlighted =
    highlightedCustomId === node.customId ||
    (searchQuery.trim() &&
      (node.customId.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        node.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim())));

  const hasAnyChild = !!node.leftChild || !!node.rightChild;
  const isCompleted = node.status === "COMPLETED";

  return (
    <div className="space-y-3">
      {/* Matrix Node Card */}
      <div
        id={`matrix-node-${node.customId}`}
        onClick={() => onSelectUserByCustomId(node.customId)}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
          level > 0 ? "ml-6" : ""
        } ${
          isHighlighted
            ? "bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/80 shadow-lg shadow-sky-500/20"
            : isSelected
            ? "bg-red-500/15 border-red-500 shadow-md shadow-red-500/10 ring-1 ring-red-500"
            : "bg-[#0b1020] border-slate-800 hover:border-slate-700 hover:bg-[#0e152a]"
        }`}
      >
        {/* Top Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Queue Index Badge */}
            <span className="px-2 py-0.5 rounded font-mono font-extrabold text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/40">
              Queue #{node.queueIndex}
            </span>

            {/* Position Pill */}
            <span
              className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                node.position === "ROOT"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : node.position === "LEFT"
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                  : "bg-purple-500/15 text-purple-300 border-purple-500/30"
              }`}
            >
              {node.position === "ROOT"
                ? "Genesis Root"
                : node.position === "LEFT"
                ? "Unit 1 (Left Leg)"
                : "Unit 2 (Right Leg)"}
            </span>

            {/* Match Status */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCompleted
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/40"
              }`}
            >
              {isCompleted ? "COMPLETED (Upgraded)" : "WAITING"}
            </span>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAuditTarget(node.customId);
              }}
              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
              title="Audit Rank & Commission Details"
            >
              <Trophy size={13} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMatrixNode(node.queueIndex);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronDown size={12} />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronRight size={12} />
                  <span>Expand Downline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Member ID & Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold font-mono-num text-[#d4af37]">
              {node.customId}
            </span>
            <span className="text-sm font-bold text-white">
              {node.fullName}
            </span>
          </div>

          {/* Directs Qualification */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Directs:</span>
            <span className="font-bold text-white">{node.directCount}</span>
            <span className="text-slate-500">/ {node.requiredDirects}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                node.isDirectsMet
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              {node.isDirectsMet ? "Qualified ✅" : "Missing Directs ⚠️"}
            </span>
          </div>
        </div>

        {/* Matrix Placement Details Box */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
          {/* Matrix Upline Parent */}
          <div className="flex items-center justify-between flex-wrap gap-1.5 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <GitCommit size={12} className="text-sky-400" />
              <span>Matrix Upline (Placed Under):</span>
            </span>
            {node.parent ? (
              <span className="font-medium text-white flex items-center gap-1">
                <strong className="text-amber-300 font-mono font-extrabold">{node.parent.customId}</strong>{" "}
                <span>({node.parent.fullName})</span>
                <span className="text-slate-400 text-[10px]">• Parent Queue #{node.parent.queueIndex}</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">
                👑 Genesis Root Node of {node.tierName} Matrix
              </span>
            )}
          </div>

          {/* 2:1 Tripod Children Matching Progress */}
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">
                2:1 Tripod Matching ({node.childrenPlaced}/2 Placements)
              </span>
              <span className={node.childrenPlaced === 2 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {node.childrenPlaced === 2
                  ? "100% Complete & Upgraded"
                  : node.childrenPlaced === 1
                  ? "50% Half Matched (Unit 1 Filled)"
                  : "0% Awaiting Downlines"}
              </span>
            </div>

            {/* Visual 2-Segment Progress Bar */}
            <div className="grid grid-cols-2 gap-1.5 h-2">
              <div
                className={`rounded-full transition-all ${
                  node.childrenPlaced >= 1 ? "bg-emerald-500 shadow-sm shadow-emerald-500/40" : "bg-slate-800"
                }`}
                title="Unit 1 (Left Leg)"
              />
              <div
                className={`rounded-full transition-all ${
                  node.childrenPlaced >= 2 ? "bg-emerald-500 shadow-sm shadow-emerald-500/40" : "bg-slate-800"
                }`}
                title="Unit 2 (Right Leg)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Downline 2:1 Child Branches (Left & Right Units) */}
      {isExpanded && (
        <div className="space-y-3 border-l-2 border-slate-800/90 ml-6 pl-4">
          {/* SLOT 1: LEFT CHILD (UNIT 1) */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <ArrowDownRight size={12} />
              <span>Unit 1 (Left Leg Placement) &bull; Expected Queue #{node.expectedLeftIndex}</span>
            </div>

            {node.leftChild ? (
              <MatrixTreeBranch
                node={node.leftChild}
                level={level + 1}
                expandedMatrixNodes={expandedMatrixNodes}
                toggleMatrixNode={toggleMatrixNode}
                selectedUser={selectedUser}
                onSelectUserByCustomId={onSelectUserByCustomId}
                searchQuery={searchQuery}
                highlightedCustomId={highlightedCustomId}
                onAuditTarget={onAuditTarget}
              />
            ) : (
              /* EMPTY SLOT PLACEHOLDER */
              <div className="p-3 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 text-slate-500 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                  <span className="font-mono font-bold text-slate-400">Queue #{node.expectedLeftIndex}</span>
                  <span className="italic text-slate-500">Unit 1 &bull; Empty Slot</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Awaiting Next Upgrade to {node.tierName}
                </span>
              </div>
            )}
          </div>

          {/* SLOT 2: RIGHT CHILD (UNIT 2) */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <ArrowDownRight size={12} />
              <span>Unit 2 (Right Leg Placement) &bull; Expected Queue #{node.expectedRightIndex}</span>
            </div>

            {node.rightChild ? (
              <MatrixTreeBranch
                node={node.rightChild}
                level={level + 1}
                expandedMatrixNodes={expandedMatrixNodes}
                toggleMatrixNode={toggleMatrixNode}
                selectedUser={selectedUser}
                onSelectUserByCustomId={onSelectUserByCustomId}
                searchQuery={searchQuery}
                highlightedCustomId={highlightedCustomId}
                onAuditTarget={onAuditTarget}
              />
            ) : (
              /* EMPTY SLOT PLACEHOLDER */
              <div className="p-3 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 text-slate-500 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                  <span className="font-mono font-bold text-slate-400">Queue #{node.expectedRightIndex}</span>
                  <span className="italic text-slate-500">Unit 2 &bull; Empty Slot</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Awaiting Next Upgrade to {node.tierName}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
