"use client";

import React, { useState } from "react";
import {
  Search,
  Radio,
  RefreshCw,
  MapPin,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Filter,
  Copy,
  Check,
  Building2,
  Users,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminItem {
  id: string;
  customId: string;
  fullName: string;
}

interface SurveillanceLogsViewProps {
  logs: any[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  stats?: {
    totalLogins24h: number;
    totalActivities24h: number;
    uniqueIps24h: number;
  } | null;
  admins: AdminItem[];
  typeFilter: "all" | "logins" | "activities";
  onTypeFilterChange: (type: "all" | "logins" | "activities") => void;
  adminFilter: string;
  onAdminFilterChange: (adminId: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  isEmbedded?: boolean;
}

export function SurveillanceLogsView({
  logs,
  loading,
  total,
  page,
  totalPages,
  stats,
  admins,
  typeFilter,
  onTypeFilterChange,
  adminFilter,
  onAdminFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  onRefresh,
  onPageChange,
  isEmbedded = false,
}: SurveillanceLogsViewProps) {
  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIp(text);
      setTimeout(() => setCopiedIp(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchQueryChange(localSearch);
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === "MOBILE") {
      return (
        <span title="Mobile Device">
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
        </span>
      );
    }
    if (deviceType === "TABLET") {
      return (
        <span title="Tablet Device">
          <Tablet className="w-3.5 h-3.5 text-purple-400" />
        </span>
      );
    }
    return (
      <span title="Desktop / Laptop">
        <Laptop className="w-3.5 h-3.5 text-amber-400" />
      </span>
    );
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SUPER_ROOT_ADMIN":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            SUPER ROOT
          </span>
        );
      case "ADMIN":
      case "SUPER_ADMIN":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            BRANCH ADMIN
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            MEMBER
          </span>
        );
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* 24-Hour Telemetry Highlights */}
      {!isEmbedded && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">24h Login Sessions</p>
              <p className="text-2xl font-black text-white font-mono mt-1">{stats.totalLogins24h}</p>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Authentication Stream
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">24h Unique Client IPs</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.uniqueIps24h}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Global Network Nodes</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">24h Function Executions</p>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">{stats.totalActivities24h}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Audit &amp; Function Logs</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Surveillance Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Log Type Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => onTypeFilterChange("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                typeFilter === "all"
                  ? "bg-rose-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Unified Stream
            </button>
            <button
              onClick={() => onTypeFilterChange("logins")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                typeFilter === "logins"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Login Sessions
            </button>
            <button
              onClick={() => onTypeFilterChange("activities")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                typeFilter === "activities"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Function Usage
            </button>
          </div>

          {/* Admin Branch Selector */}
          {!isEmbedded && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono whitespace-nowrap">Admin Branch:</span>
              <select
                value={adminFilter}
                onChange={(e) => onAdminFilterChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-amber-300 rounded-xl px-3 py-1.5 font-mono outline-none focus:border-rose-500"
              >
                <option value="all">🌍 All Admin Branches &amp; Members</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    🏛️ {a.customId} — {a.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter for Activities */}
          {typeFilter === "activities" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 font-mono outline-none"
              >
                <option value="all">All Categories</option>
                <option value="AUTH">AUTH</option>
                <option value="FINANCE">FINANCE</option>
                <option value="SECURITY">SECURITY</option>
                <option value="SYSTEM">SYSTEM</option>
                <option value="MEMBER">MEMBER</option>
              </select>
            </div>
          )}

          {/* Search Bar & Refresh */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search ID, IP, action, name..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-500 outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
            </button>
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Actor / User</th>
                <th className="py-3 px-4">Event / Function</th>
                <th className="py-3 px-4">IP Address &amp; Geo Location</th>
                <th className="py-3 px-4">Device, OS &amp; Browser</th>
                <th className="py-3 px-4">Details / Metadata</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 font-mono text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      <span>Fetching live surveillance logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 font-mono text-xs">
                    No surveillance or activity records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((item) => {
                  const isLogin = item.logType === "LOGIN" || Boolean(item.portal);
                  const isSuccess = item.status === "SUCCESS";

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      {/* Actor Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-white font-mono flex items-center gap-1.5">
                              {item.customId}
                              {getRoleBadge(item.role)}
                            </div>
                            <div className="text-[11px] text-slate-400">{item.fullName || "—"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Event / Action Column */}
                      <td className="py-3 px-4">
                        {isLogin ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isSuccess
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              LOGIN {item.status}
                            </span>
                            {item.portal && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Portal: <span className="text-slate-300 uppercase">{item.portal}</span>
                              </div>
                            )}
                            {item.failureReason && (
                              <div className="text-[10px] text-rose-400 font-mono max-w-xs truncate">
                                Reason: {item.failureReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {item.action}
                              </span>
                              {item.category && (
                                <span className="text-[9px] font-mono uppercase text-slate-400 px-1 py-0.5 rounded bg-slate-800">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {item.targetCustomId && (
                              <div className="text-[10px] font-mono text-amber-400">
                                Target: {item.targetCustomId}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* IP & Location */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-amber-300 font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {item.ipAddress}
                            </span>
                            <button
                              onClick={() => handleCopy(item.ipAddress)}
                              className="text-slate-500 hover:text-white cursor-pointer"
                              title="Copy IP"
                            >
                              {copiedIp === item.ipAddress ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>
                              {item.country || "Global"}{" "}
                              {item.city && item.city !== "Unknown City" ? `• ${item.city}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Device & Environment */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200">
                            {getDeviceIcon(item.deviceType)}
                            <span className="font-medium">{item.os || "Unknown OS"}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.browser || "Web Browser"}
                          </div>
                        </div>
                      </td>

                      {/* Details Column */}
                      <td className="py-3 px-4">
                        {item.details ? (
                          <button
                            onClick={() => setSelectedPayload(item)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-200 border border-slate-700 cursor-pointer transition"
                          >
                            <Info className="w-3 h-3 text-cyan-400" />
                            <span>View Payload</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-0.5 font-mono">
                          <div className="text-slate-300 font-bold text-[11px]">
                            {formatDate(item.createdAt)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div>
            Showing Page <span className="text-white font-bold">{page}</span> of{" "}
            <span className="text-white font-bold">{totalPages}</span> ({total} Total Records)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 cursor-pointer transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 cursor-pointer transition"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white font-mono">
                  {selectedPayload.action || "Event Payload"} Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayload(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Actor:</span>
                <span className="text-white font-bold">{selectedPayload.customId} ({selectedPayload.fullName})</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">IP / Geo:</span>
                <span className="text-amber-300">{selectedPayload.ipAddress} ({selectedPayload.country})</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">User Agent:</span>
                <span className="text-slate-300 truncate max-w-[280px]" title={selectedPayload.userAgent}>
                  {selectedPayload.userAgent}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Structured Payload Data
              </label>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedPayload.details), null, 2);
                  } catch {
                    return selectedPayload.details;
                  }
                })()}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
