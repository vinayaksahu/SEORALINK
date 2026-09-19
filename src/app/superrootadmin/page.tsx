'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Wallet,
  TrendingUp,
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  LogOut,
  Search,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
  Tag,
  Settings,
  DollarSign,
  Eye,
  ArrowLeft,
  ArrowRight,
  GitCommit,
  LifeBuoy,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminItem {
  id: string;
  customId: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: "ACTIVE" | "BLOCKED" | "INACTIVE";
  createdAt: string;
  totalMembers: number;
  activeMembers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalQueueCount: number;
  totalDepositsUsdt: number;
  totalWithdrawalsUsdt: number;
  totalReserveCollectedUsdt: number;
}

interface GlobalStats {
  totalAdmins: number;
  totalUsers: number;
  activeUsers: number;
  totalQueueEntries: number;
  activeWaitingQueue: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  totalApprovedDepositsUsdt: number;
  totalProcessedWithdrawalsUsdt: number;
  totalReserveCollectedUsdt: number;
}

interface InspectData {
  admin: AdminItem;
  members: any[];
  deposits: any[];
  withdrawals: any[];
  queue: any[];
  tickets: any[];
}

export default function SuperRootAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"admins" | "inspect" | "config" | "wallet">("admins");
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Inspector states
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [inspectData, setInspectData] = useState<InspectData | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectSubTab, setInspectSubTab] = useState<"members" | "queue" | "deposits" | "withdrawals" | "tickets">("members");

  // System Config states
  const [configs, setConfigs] = useState<any[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);

  // Wallet adjustment states
  const [adjustTargetId, setAdjustTargetId] = useState("");
  const [adjustAction, setAdjustAction] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustWallet, setAdjustWallet] = useState<"FUND" | "INCOME">("FUND");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustResult, setAdjustResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Create Admin Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    customId: "",
    email: "",
    phone: "",
    password: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Password Modal
  const [passwordModalAdmin, setPasswordModalAdmin] = useState<AdminItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, adminsRes] = await Promise.all([
        fetch("/api/superadmin/stats"),
        fetch("/api/superadmin/admins"),
      ]);

      if (statsRes.status === 403 || adminsRes.status === 403) {
        router.push("/superrootadminlogin");
        return;
      }

      if (statsRes.ok && adminsRes.ok) {
        const statsData = await statsRes.json();
        const adminsData = await adminsRes.json();
        setStats(statsData.stats);
        setAdmins(adminsData.admins || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadInspectData = async (adminId: string) => {
    setSelectedAdminId(adminId);
    setInspectLoading(true);
    setActiveTab("inspect");
    try {
      const res = await fetch(`/api/superadmin/team-inspect?adminId=${adminId}`);
      const data = await res.json();
      if (res.ok) {
        setInspectData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInspectLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/superrootadminlogin");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/superadmin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create admin");

      setShowCreateModal(false);
      setCreateForm({ fullName: "", customId: "", email: "", phone: "", password: "" });
      loadAllData();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (admin: AdminItem) => {
    const actionVerb = admin.status === "ACTIVE" ? "BLOCK" : "UNBLOCK";
    if (!confirm(`Are you sure you want to ${actionVerb} Admin ${admin.customId}?`)) return;

    try {
      const res = await fetch("/api/superadmin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: admin.id, action: "TOGGLE_STATUS" }),
      });
      if (res.ok) loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalAdmin) return;
    setPasswordLoading(true);
    setPasswordMsg("");

    try {
      const res = await fetch("/api/superadmin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: passwordModalAdmin.id,
          action: "RESET_PASSWORD",
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setPasswordMsg("Password updated successfully!");
      setTimeout(() => {
        setPasswordModalAdmin(null);
        setNewPassword("");
        setPasswordMsg("");
      }, 1200);
    } catch (err: any) {
      setPasswordMsg(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustLoading(true);
    setAdjustResult(null);
    try {
      const res = await fetch("/api/superadmin/wallet-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjustTargetId.trim(),
          action: adjustAction,
          wallet: adjustWallet,
          amount: adjustAmount,
          note: adjustNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdjustResult({ success: true, message: data.message });
        setAdjustAmount("");
        setAdjustNote("");
        loadAllData();
      } else {
        setAdjustResult({ success: false, message: data.error || "Adjustment failed" });
      }
    } catch (err: any) {
      setAdjustResult({ success: false, message: err.message });
    } finally {
      setAdjustLoading(false);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.customId.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040711] flex items-center justify-center text-rose-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs tracking-widest uppercase font-bold">Accessing Master Super Root Command...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Root Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-rose-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-[#040711] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-wide">
                SEORALINK <span className="text-rose-400 font-mono">SUPER ROOT</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                MASTER COMMANDER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Signed in as: <span className="text-amber-400 font-bold">superrootadmin</span> &bull; 100% Zero-Knowledge Isolated Architecture
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-rose-400" : ""}`} />
            Refresh
          </button>
          <ThemeToggle variant="compact" size="sm" showLabels={false} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Global Financial KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2 font-mono">
              <span>PARALLEL ADMINS</span>
              <Layers className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats?.totalAdmins || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Isolated Parallel Branches</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2 font-mono">
              <span>TOTAL MEMBERS</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">{stats?.totalUsers || 0}</p>
            <p className="text-[11px] text-emerald-400 mt-1 font-mono">{stats?.activeUsers || 0} Active Members</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2 font-mono">
              <span>PLATFORM DEPOSITS</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ${(stats?.totalApprovedDepositsUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Total USDT Inflow</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2 font-mono">
              <span>RESERVE COLLECTED</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              ${(stats?.totalReserveCollectedUsdt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">From Processed Payouts</p>
          </div>
        </section>

        {/* Feature Navigation Tabs */}
        <section className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("admins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-mono cursor-pointer ${
              activeTab === "admins"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Sub-Admin Branches ({admins.length})
          </button>

          <button
            onClick={() => {
              if (!selectedAdminId && admins.length > 0) {
                loadInspectData(admins[0].id);
              } else {
                setActiveTab("inspect");
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-mono cursor-pointer ${
              activeTab === "inspect"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Eye className="w-4 h-4" />
            Branch Inspector {inspectData ? `(${inspectData.admin.customId})` : ""}
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-mono cursor-pointer ${
              activeTab === "wallet"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Manual Fund Credit / Debit
          </button>
        </section>

        {/* TAB 1: SUB-ADMINS MANAGEMENT */}
        {activeTab === "admins" && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  Parallel Sub-Admin Branches <span className="text-xs font-mono text-rose-400 font-normal">({admins.length} Active Branches)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Each admin is 100% isolated and cannot see cross-admins, other parallel branches, or Super Root Admin.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search admin..."
                    className="pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition w-56 font-mono"
                  />
                </div>

                <button
                  onClick={() => {
                    const nextNum = admins.length + 1;
                    setCreateForm({
                      fullName: "",
                      customId: `SL00000${nextNum}`,
                      email: "",
                      phone: "",
                      password: "",
                    });
                    setCreateError("");
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Create New Admin
                </button>
              </div>
            </div>

            {/* Admins Table */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Admin Name &amp; ID</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Branch Size</th>
                      <th className="py-3.5 px-4">Branch Volume</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Master Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500 font-mono">
                          No sub-admins found. Click &quot;Create New Admin&quot; to initialize a new parallel branch.
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map((adm) => (
                        <tr key={adm.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 font-mono text-xs">
                                {adm.customId.slice(-2)}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{adm.fullName}</p>
                                <p className="text-slate-400 font-mono text-[11px]">{adm.customId}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="text-slate-300">{adm.email}</p>
                            <p className="text-slate-500 font-mono text-[11px]">{adm.phone || "No phone"}</p>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <p className="text-white font-bold">{adm.totalMembers} Members</p>
                            <p className="text-emerald-400 text-[11px]">{adm.activeMembers} Active ({adm.totalQueueCount} in Queue)</p>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <p className="text-emerald-400 font-bold">${adm.totalDepositsUsdt.toFixed(2)}</p>
                            <p className="text-slate-400 text-[11px]">Payouts: ${adm.totalWithdrawalsUsdt.toFixed(2)}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                adm.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {adm.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {adm.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect Branch Button */}
                              <button
                                onClick={() => loadInspectData(adm.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold text-xs transition border border-cyan-500/30 cursor-pointer"
                                title="Inspect this admin's isolated branch"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Inspect Team
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setPasswordModalAdmin(adm);
                                  setNewPassword("");
                                  setPasswordMsg("");
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Reset Admin Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Block / Unblock */}
                              <button
                                onClick={() => handleToggleStatus(adm)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  adm.status === "ACTIVE"
                                    ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-400"
                                    : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400"
                                }`}
                                title={adm.status === "ACTIVE" ? "Block Admin" : "Unblock Admin"}
                              >
                                {adm.status === "ACTIVE" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: BRANCH INSPECTOR */}
        {activeTab === "inspect" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setActiveTab("admins")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to All Branches
                </button>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  Branch Inspector: <span className="text-amber-400 font-mono">{inspectData?.admin.customId}</span>
                  <span className="text-xs font-normal text-slate-400">({inspectData?.admin.fullName})</span>
                </h2>
              </div>

              {/* Branch Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Switch Branch:</span>
                <select
                  value={selectedAdminId || ""}
                  onChange={(e) => loadInspectData(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 font-mono outline-none"
                >
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.customId} - {a.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {inspectLoading ? (
              <div className="py-16 text-center text-slate-500 font-mono text-xs">
                Loading branch telemetry...
              </div>
            ) : !inspectData ? (
              <div className="py-16 text-center text-slate-500 font-mono text-xs">
                Select a branch to inspect details.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sub-tabs for Inspect Data */}
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setInspectSubTab("members")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                      inspectSubTab === "members"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Members ({inspectData.members.length})
                  </button>
                  <button
                    onClick={() => setInspectSubTab("queue")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                      inspectSubTab === "queue"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Queue Entries ({inspectData.queue.length})
                  </button>
                  <button
                    onClick={() => setInspectSubTab("deposits")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                      inspectSubTab === "deposits"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Deposits ({inspectData.deposits.length})
                  </button>
                  <button
                    onClick={() => setInspectSubTab("withdrawals")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                      inspectSubTab === "withdrawals"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Withdrawals ({inspectData.withdrawals.length})
                  </button>
                  <button
                    onClick={() => setInspectSubTab("tickets")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                      inspectSubTab === "tickets"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Tickets ({inspectData.tickets.length})
                  </button>
                </div>

                {/* Sub-tab 1: Members */}
                {inspectSubTab === "members" && (
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Member ID</th>
                          <th className="py-3 px-4">Name &amp; Email</th>
                          <th className="py-3 px-4">Tier / Status</th>
                          <th className="py-3 px-4">Sponsor</th>
                          <th className="py-3 px-4">Wallets (Fund / Income)</th>
                          <th className="py-3 px-4">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectData.members.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">
                              No members registered in this branch yet.
                            </td>
                          </tr>
                        ) : (
                          inspectData.members.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-bold text-amber-400">{m.customId}</td>
                              <td className="py-3 px-4 font-sans">
                                <p className="font-bold text-white">{m.fullName}</p>
                                <p className="text-slate-400 text-[11px]">{m.email}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px]">
                                  Tier {m.currentTier} &bull; {m.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {m.sponsor ? `${m.sponsor.customId} (${m.sponsor.fullName})` : "None (Root)"}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-cyan-400">${Number(m.fundBalance).toFixed(2)}</span> /{" "}
                                <span className="text-emerald-400">${Number(m.incomeBalance).toFixed(2)}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(m.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 2: Queue */}
                {inspectSubTab === "queue" && (
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Tier</th>
                          <th className="py-3 px-4">Queue Index</th>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Children Placed</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Placed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectData.queue.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">
                              No queue entries in this branch.
                            </td>
                          </tr>
                        ) : (
                          inspectData.queue.map((q) => (
                            <tr key={q.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 text-amber-400 font-bold">Tier {q.tier}</td>
                              <td className="py-3 px-4 text-white">#{q.queueIndex}</td>
                              <td className="py-3 px-4 font-sans text-slate-300">
                                {q.user?.customId} ({q.user?.fullName})
                              </td>
                              <td className="py-3 px-4 text-cyan-400 font-bold">{q.childrenPlaced} / 2</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    q.status === "COMPLETED"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                  }`}
                                >
                                  {q.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(q.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 3: Deposits */}
                {inspectSubTab === "deposits" && (
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Tx Hash</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectData.deposits.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500">
                              No deposits recorded for this branch.
                            </td>
                          </tr>
                        ) : (
                          inspectData.deposits.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-sans text-white">
                                {d.user?.customId} ({d.user?.fullName})
                              </td>
                              <td className="py-3 px-4 text-emerald-400 font-bold">${Number(d.amount).toFixed(2)} USDT</td>
                              <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-xs">{d.txHash}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                  {d.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(d.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 4: Withdrawals */}
                {inspectSubTab === "withdrawals" && (
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Net Payout</th>
                          <th className="py-3 px-4">Reserve Fee</th>
                          <th className="py-3 px-4">To Address</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectData.withdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">
                              No withdrawals recorded for this branch.
                            </td>
                          </tr>
                        ) : (
                          inspectData.withdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-sans text-white">
                                {w.user?.customId} ({w.user?.fullName})
                              </td>
                              <td className="py-3 px-4 text-rose-400 font-bold">${Number(w.netAmount).toFixed(2)} USDT</td>
                              <td className="py-3 px-4 text-amber-400">${Number(w.feeAmount).toFixed(2)}</td>
                              <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-xs">{w.toAddress}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                  {w.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(w.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 5: Tickets */}
                {inspectSubTab === "tickets" && (
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Subject &amp; Category</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {inspectData.tickets.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-slate-500 font-mono">
                              No support tickets in this branch.
                            </td>
                          </tr>
                        ) : (
                          inspectData.tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 text-white">
                                {t.user?.customId} ({t.user?.fullName})
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-200">{t.subject}</p>
                                <p className="text-[11px] text-slate-400">{t.category}</p>
                              </td>
                              <td className="py-3 px-4 font-mono">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300">
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: WALLET ADJUSTMENT */}
        {activeTab === "wallet" && (
          <section className="max-w-2xl bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-400" />
                Cross-Branch Manual Balance Credit / Debit
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Directly adjust Fund Wallet or Income Wallet for any member in any parallel branch with full ledger records.
              </p>
            </div>

            {adjustResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  adjustResult.success
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                }`}
              >
                {adjustResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{adjustResult.message}</span>
              </div>
            )}

            <form onSubmit={handleWalletAdjustment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Member ID / Custom ID
                </label>
                <input
                  type="text"
                  required
                  value={adjustTargetId}
                  onChange={(e) => setAdjustTargetId(e.target.value)}
                  placeholder="e.g. SL184920 or SL000001"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Operation Action
                  </label>
                  <select
                    value={adjustAction}
                    onChange={(e) => setAdjustAction(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-rose-500"
                  >
                    <option value="CREDIT">CREDIT (+)</option>
                    <option value="DEBIT">DEBIT (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Wallet
                  </label>
                  <select
                    value={adjustWallet}
                    onChange={(e) => setAdjustWallet(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-rose-500"
                  >
                    <option value="FUND">FUND WALLET</option>
                    <option value="INCOME">INCOME WALLET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Administrative Reason / Audit Note
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Master compensation or protocol correction"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={adjustLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                {adjustLoading ? "Executing Ledger Adjustment..." : "Execute Adjustment"}
              </button>
            </form>
          </section>
        )}
      </main>

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white">Create New Parallel Admin</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="e.g. Branch Admin Alpha"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Admin ID (Custom ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.customId}
                    onChange={(e) => setCreateForm({ ...createForm, customId: e.target.value })}
                    placeholder="e.g. SL000002"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+971..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Admin Email (Login identifier)
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="admin2@seoralink.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? "Creating Branch..." : "Initialize Parallel Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordModalAdmin && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Reset Password: {passwordModalAdmin.customId}
              </h3>
              <button
                onClick={() => setPasswordModalAdmin(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordMsg && (
              <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalAdmin(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
