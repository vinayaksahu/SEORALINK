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
  Settings,
  DollarSign,
  Eye,
  ArrowLeft,
  ArrowRight,
  GitCommit,
  LifeBuoy,
  ShieldCheck,
  Building2,
  ExternalLink,
  Zap,
  Globe,
  Sliders,
  Check,
  Edit3,
  UserCog,
  Radio,
  Activity,
  Smartphone,
  Laptop,
  Tablet,
  MapPin,
  Fingerprint,
  Filter,
  Clock,
  Info,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SurveillanceLogsView } from "@/components/SurveillanceLogsView";
import { SuperRootCryptoDepositsView } from "@/components/SuperRootCryptoDepositsView";

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
  const [activeTab, setActiveTab] = useState<"admins" | "inspect" | "search" | "config" | "wallet" | "logs" | "crypto_deposits">("admins");
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Inspector states
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [inspectData, setInspectData] = useState<InspectData | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectSubTab, setInspectSubTab] = useState<"members" | "queue" | "deposits" | "withdrawals" | "tickets" | "logs">("members");

  // Surveillance & Audit Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsStats, setLogsStats] = useState<{ totalLogins24h: number; totalActivities24h: number; uniqueIps24h: number } | null>(null);
  const [logsTypeFilter, setLogsTypeFilter] = useState<"all" | "logins" | "activities">("all");
  const [logsAdminFilter, setLogsAdminFilter] = useState<string>("all");
  const [logsSearchQuery, setLogsSearchQuery] = useState("");
  const [logsCategoryFilter, setLogsCategoryFilter] = useState("all");
  const [selectedLogPayload, setSelectedLogPayload] = useState<any | null>(null);

  // Impersonation state
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Universal Search state
  const [universalQuery, setUniversalQuery] = useState("");
  const [universalUsers, setUniversalUsers] = useState<any[]>([]);
  const [universalLoading, setUniversalLoading] = useState(false);

  // System Config states
  const [configForm, setConfigForm] = useState({
    depositAddresses: "",
    depositDistributionMode: "SINGLE",
    primaryDepositAddress: "",
    defaultNetwork: "USDT_BEP20",
    otpRegistration: true,
    otpForgotPassword: true,
    otpWithdrawal: true,
    otpProfileUpdate: false,
    requireActiveSponsor: true,
  });
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

  // Edit Admin Profile Modal
  const [editModalAdmin, setEditModalAdmin] = useState<AdminItem | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    customId: "",
    email: "",
    phone: "",
    newPassword: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadInspectData = async (adminId: string) => {
    try {
      setInspectLoading(true);
      setSelectedAdminId(adminId);
      setActiveTab("inspect");
      const res = await fetch(`/api/superadmin/team-inspect?adminId=${adminId}`);
      if (res.ok) {
        const data = await res.json();
        setInspectData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInspectLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      setConfigLoading(true);
      const res = await fetch("/api/superadmin/config");
      if (res.ok) {
        const data = await res.json();
        const c = data.configs || {};
        setConfigForm({
          depositAddresses: c.USDT_DEPOSIT_ADDRESSES || "",
          depositDistributionMode: c.DEPOSIT_DISTRIBUTION_MODE || "SINGLE",
          primaryDepositAddress: c.USDT_DEPOSIT_ADDRESS || "",
          defaultNetwork: c.DEFAULT_NETWORK || "USDT_BEP20",
          otpRegistration: c.OTP_ENABLED_REGISTRATION !== "false",
          otpForgotPassword: c.OTP_ENABLED_FORGOT_PASSWORD !== "false",
          otpWithdrawal: c.OTP_ENABLED_WITHDRAWAL !== "false",
          otpProfileUpdate: c.OTP_ENABLED_PROFILE_UPDATE !== "false",
          requireActiveSponsor: c.REQUIRE_ACTIVE_SPONSOR !== "false",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadUniversalUsers = async (q: string) => {
    try {
      setUniversalLoading(true);
      const res = await fetch(`/api/superadmin/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUniversalUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUniversalLoading(false);
    }
  };

  const loadLogs = async (
    page = 1,
    typeOverride?: string,
    adminIdOverride?: string,
    searchOverride?: string,
    categoryOverride?: string
  ) => {
    try {
      setLogsLoading(true);
      const activeType = typeOverride ?? logsTypeFilter;
      const activeAdmin = adminIdOverride ?? logsAdminFilter;
      const activeSearch = searchOverride ?? logsSearchQuery;
      const activeCategory = categoryOverride ?? logsCategoryFilter;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
        type: activeType,
        adminId: activeAdmin,
        search: activeSearch,
        category: activeCategory,
      });

      const res = await fetch(`/api/superadmin/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items || []);
        setLogsTotal(data.total || 0);
        setLogsPage(data.page || 1);
        setLogsTotalPages(data.totalPages || 1);
        if (data.stats) setLogsStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load surveillance logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "config") {
      loadConfigs();
    } else if (activeTab === "search") {
      loadUniversalUsers(universalQuery);
    } else if (activeTab === "logs") {
      loadLogs(1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs(1);
    }
  }, [logsTypeFilter, logsAdminFilter, logsCategoryFilter]);

  useEffect(() => {
    if (activeTab === "inspect" && inspectSubTab === "logs" && selectedAdminId) {
      loadLogs(1, logsTypeFilter, selectedAdminId);
    }
  }, [activeTab, inspectSubTab, selectedAdminId]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/superrootadminlogin");
    } catch (err) {
      console.error(err);
    }
  };

  const handleImpersonateAdmin = async (adminId: string) => {
    try {
      setImpersonatingId(adminId);
      const res = await fetch("/api/superadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAdminId: adminId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to impersonate admin");
      window.location.href = data.redirectUrl || "/admin";
    } catch (err: any) {
      alert(`Impersonation error: ${err.message}`);
      setImpersonatingId(null);
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
      setActionMsg({ type: "success", text: `Parallel Admin ${data.admin?.customId} created successfully!` });
      setTimeout(() => setActionMsg(null), 3500);
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
      if (res.ok) {
        loadAllData();
        setActionMsg({ type: "success", text: `Admin ${admin.customId} status updated successfully.` });
        setTimeout(() => setActionMsg(null), 3000);
      }
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

  const handleOpenEditModal = (admin: AdminItem) => {
    setEditModalAdmin(admin);
    setEditForm({
      fullName: admin.fullName || "",
      customId: admin.customId || "",
      email: admin.email || "",
      phone: admin.phone || "",
      newPassword: "",
    });
    setEditError("");
  };

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAdmin) return;
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch("/api/superadmin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: editModalAdmin.id,
          action: "UPDATE_PROFILE",
          fullName: editForm.fullName,
          customId: editForm.customId,
          email: editForm.email,
          phone: editForm.phone,
          password: editForm.newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update admin profile");

      setEditModalAdmin(null);
      loadAllData();
      setActionMsg({
        type: "success",
        text: data.message || `Admin ${editForm.customId} profile updated successfully!`,
      });
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleExecuteAction = async (action: string, payload: any) => {
    try {
      const res = await fetch("/api/superadmin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setActionMsg({ type: "success", text: data.message || "Operation completed successfully." });
      setTimeout(() => setActionMsg(null), 4000);
      if (selectedAdminId) {
        loadInspectData(selectedAdminId);
      }
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message });
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMsg(null);
    try {
      const res = await fetch("/api/superadmin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: {
            USDT_DEPOSIT_ADDRESSES: configForm.depositAddresses,
            DEPOSIT_DISTRIBUTION_MODE: configForm.depositDistributionMode,
            USDT_DEPOSIT_ADDRESS: configForm.primaryDepositAddress,
            DEFAULT_NETWORK: configForm.defaultNetwork,
            OTP_ENABLED_REGISTRATION: configForm.otpRegistration ? "true" : "false",
            OTP_ENABLED_FORGOT_PASSWORD: configForm.otpForgotPassword ? "true" : "false",
            OTP_ENABLED_WITHDRAWAL: configForm.otpWithdrawal ? "true" : "false",
            OTP_ENABLED_PROFILE_UPDATE: configForm.otpProfileUpdate ? "true" : "false",
            REQUIRE_ACTIVE_SPONSOR: configForm.requireActiveSponsor ? "true" : "false",
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfigMsg("Global system configurations saved live successfully!");
        setTimeout(() => setConfigMsg(null), 3500);
      } else {
        setConfigMsg(data.error || "Failed to save configuration");
      }
    } catch (err: any) {
      setConfigMsg(err.message);
    } finally {
      setConfigSaving(false);
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
      {/* Action Notification Toast */}
      {actionMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold font-mono flex items-center gap-2 animate-in slide-in-from-top ${
            actionMsg.type === "success"
              ? "bg-emerald-950 border-emerald-500 text-emerald-200"
              : "bg-rose-950 border-rose-500 text-rose-200"
          }`}
        >
          {actionMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Top Super Root Commander Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-rose-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-wide">
                SEORALINK <span className="text-rose-500 font-mono">SUPER ROOT ADMIN</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                MASTER COMMANDER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Signed in as: <span className="text-amber-400 font-bold">SUPER ROOT</span> (Zero-Knowledge Supervisor)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 transition cursor-pointer"
            title="Refresh All Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-rose-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-mono border border-rose-500/30 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Global KPI Telemetry Cards */}
        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Sub-Admins</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{stats.totalAdmins}</p>
              <p className="text-[11px] text-slate-500 font-mono">Parallel Isolated Branches</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Global Members</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{stats.totalUsers}</p>
              <p className="text-[11px] text-cyan-400 font-mono">{stats.activeUsers} Active Accounts</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Approved Deposits</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">${stats.totalApprovedDepositsUsdt.toFixed(2)}</p>
              <p className="text-[11px] text-slate-500 font-mono">Across all branches</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Payouts &amp; Reserve</span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-400 font-mono">${stats.totalProcessedWithdrawalsUsdt.toFixed(2)}</p>
              <p className="text-[11px] text-amber-400 font-mono">Reserve: ${stats.totalReserveCollectedUsdt.toFixed(2)}</p>
            </div>
          </section>
        )}

        {/* Master Navigation Tabs */}
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
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-mono cursor-pointer ${
              activeTab === "search"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Search className="w-4 h-4" />
            Universal Member Search
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-mono cursor-pointer ${
              activeTab === "config"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Global System Config
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
            Manual Balance Credit / Debit
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-mono cursor-pointer ${
              activeTab === "logs"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            Surveillance &amp; Activity Logs
          </button>

          <button
            onClick={() => setActiveTab("crypto_deposits")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-mono cursor-pointer ${
              activeTab === "crypto_deposits"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg shadow-sky-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Zap className="w-4 h-4 text-sky-400" />
            USDT BEP-20 Deposits &amp; Branch Control
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
                      <th className="py-3.5 px-4 text-right">Master Powers</th>
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
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(adm)}
                              className="group flex items-center gap-2.5 text-left p-1.5 -m-1.5 rounded-xl hover:bg-slate-800/80 transition border border-transparent hover:border-rose-500/30 cursor-pointer"
                              title="Click to edit Admin Name, ID, Email, Phone or Password"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 font-mono text-xs group-hover:border-rose-500 group-hover:text-rose-400 transition shrink-0 shadow-sm">
                                {adm.customId.slice(-2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-white text-sm group-hover:text-rose-400 transition flex items-center gap-1.5">
                                    {adm.fullName}
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-rose-500/20 text-rose-300">
                                      <Edit3 className="w-3 h-3" />
                                    </span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-slate-400 font-mono text-[11px] group-hover:text-slate-300">{adm.customId}</span>
                                  <span className="text-[10px] font-mono text-rose-400/90 group-hover:text-rose-300 underline underline-offset-2">
                                    Edit Profile ✎
                                  </span>
                                </div>
                              </div>
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(adm)}
                              className="text-left group/contact hover:opacity-90 cursor-pointer"
                              title="Click to edit Contact Info"
                            >
                              <p className="text-slate-300 group-hover/contact:text-rose-300 transition flex items-center gap-1">
                                {adm.email}
                              </p>
                              <p className="text-slate-500 font-mono text-[11px] group-hover/contact:text-rose-400/80 transition">
                                {adm.phone || "No phone"}
                              </p>
                            </button>
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
                              {/* Enter Branch / Impersonate */}
                              <button
                                onClick={() => handleImpersonateAdmin(adm.id)}
                                disabled={impersonatingId === adm.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition border border-amber-500/40 cursor-pointer shadow-sm"
                                title="One-Click login to this Admin's portal directly"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {impersonatingId === adm.id ? "Entering..." : "Enter Portal"}
                              </button>

                              {/* Inspect Branch Button */}
                              <button
                                onClick={() => loadInspectData(adm.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold text-xs transition border border-cyan-500/30 cursor-pointer"
                                title="Inspect this admin's isolated branch telemetry"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Inspect
                              </button>

                              {/* Edit Profile Button */}
                              <button
                                onClick={() => handleOpenEditModal(adm)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs transition border border-rose-500/30 cursor-pointer shadow-sm"
                                title="Edit Admin Profile (Name, ID, Email, Phone, Password)"
                              >
                                <UserCog className="w-3.5 h-3.5" />
                                Edit
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
                                title={adm.status === "ACTIVE" ? "Block Admin Branch" : "Unblock Admin Branch"}
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
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition cursor-pointer font-mono"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to All Branches
                </button>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  Branch Inspector: <span className="text-amber-400 font-mono">{inspectData?.admin.customId}</span>
                  <span className="text-xs font-normal text-slate-400">({inspectData?.admin.fullName})</span>
                </h2>
              </div>

              {/* Branch Selector Dropdown & Impersonate */}
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

                {selectedAdminId && (
                  <button
                    onClick={() => handleImpersonateAdmin(selectedAdminId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Enter Portal
                  </button>
                )}
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
                  <button
                    onClick={() => {
                      setInspectSubTab("logs");
                      loadLogs(1, logsTypeFilter, inspectData.admin.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                      inspectSubTab === "logs"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    Branch Surveillance &amp; Logs
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
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectData.members.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-500">
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
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setAdjustTargetId(m.customId);
                                    setActiveTab("wallet");
                                  }}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono cursor-pointer"
                                >
                                  Adjust Bal
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 2: Queue with Trigger Processor */}
                {inspectSubTab === "queue" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white font-mono">Tripod Single-Leg Queue Matching</p>
                        <p className="text-[11px] text-slate-400">Force trigger 2:1 Tripod matches for this branch across all 13 tiers.</p>
                      </div>
                      <button
                        onClick={() => handleExecuteAction("RUN_QUEUE", { branchAdminId: inspectData.admin.id })}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono transition cursor-pointer shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Run Tripod Queue Engine
                      </button>
                    </div>

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
                  </div>
                )}

                {/* Sub-tab 3: Deposits with Approve/Reject */}
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
                          <th className="py-3 px-4 text-right">Master Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectData.deposits.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">
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
                              <td className="py-3 px-4 text-[11px] max-w-xs">
                                {d.txHash ? (
                                  <a
                                    href={d.txHash.trim().startsWith("http") ? d.txHash.trim() : `https://bscscan.com/tx/${d.txHash.trim()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-400 hover:text-sky-300 hover:underline font-mono truncate flex items-center gap-1"
                                    title="Verify on BscScan"
                                  >
                                    <span className="truncate">{d.txHash}</span>
                                    <ExternalLink size={11} className="shrink-0" />
                                  </a>
                                ) : (
                                  <span className="text-slate-500">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    d.status === "APPROVED"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                      : d.status === "PENDING"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  }`}
                                >
                                  {d.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(d.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {d.status === "PENDING" ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleExecuteAction("APPROVE_DEPOSIT", { depositId: d.id })}
                                      className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = prompt("Enter rejection reason:");
                                        if (reason !== null) handleExecuteAction("REJECT_DEPOSIT", { depositId: d.id, reason });
                                      }}
                                      className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Finalized</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 4: Withdrawals with Approve/Reject */}
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
                          <th className="py-3 px-4 text-right">Master Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {inspectData.withdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-500">
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
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    w.status === "APPROVED"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                      : w.status === "PENDING"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                  }`}
                                >
                                  {w.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(w.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {w.status === "PENDING" ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        const tx = prompt("Enter payout Tx Hash (optional):") || "";
                                        handleExecuteAction("APPROVE_WITHDRAWAL", { withdrawalId: w.id, txHash: tx });
                                      }}
                                      className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Pay
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = prompt("Enter rejection reason (will refund full amount to user):");
                                        if (reason !== null) handleExecuteAction("REJECT_WITHDRAWAL", { withdrawalId: w.id, reason });
                                      }}
                                      className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold cursor-pointer transition"
                                    >
                                      Reject &amp; Refund
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Processed</span>
                                )}
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
                          <th className="py-3 px-4 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {inspectData.tickets.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500 font-mono">
                              No support tickets in this branch.
                            </td>
                          </tr>
                        ) : (
                          inspectData.tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 text-white font-mono">
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
                              <td className="py-3 px-4 text-right font-mono">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      const reply = prompt("Enter Super Root reply to user:");
                                      if (reply) handleExecuteAction("REPLY_TICKET", { ticketId: t.id, message: reply });
                                    }}
                                    className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold cursor-pointer"
                                  >
                                    Reply
                                  </button>
                                  {t.status !== "CLOSED" && (
                                    <button
                                      onClick={() => handleExecuteAction("CLOSE_TICKET", { ticketId: t.id })}
                                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold cursor-pointer"
                                    >
                                      Close
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-tab 6: Branch Surveillance Logs */}
                {inspectSubTab === "logs" && (
                  <SurveillanceLogsView
                    logs={logs}
                    loading={logsLoading}
                    total={logsTotal}
                    page={logsPage}
                    totalPages={logsTotalPages}
                    stats={logsStats}
                    admins={admins}
                    typeFilter={logsTypeFilter}
                    onTypeFilterChange={(t) => {
                      setLogsTypeFilter(t);
                      loadLogs(1, t, inspectData.admin.id);
                    }}
                    adminFilter={inspectData.admin.id}
                    onAdminFilterChange={(a) => {
                      loadLogs(1, logsTypeFilter, a);
                    }}
                    categoryFilter={logsCategoryFilter}
                    onCategoryFilterChange={(c) => {
                      setLogsCategoryFilter(c);
                      loadLogs(1, logsTypeFilter, inspectData.admin.id, undefined, c);
                    }}
                    searchQuery={logsSearchQuery}
                    onSearchQueryChange={(q) => {
                      setLogsSearchQuery(q);
                      loadLogs(1, logsTypeFilter, inspectData.admin.id, q);
                    }}
                    onRefresh={() => loadLogs(logsPage, logsTypeFilter, inspectData.admin.id)}
                    onPageChange={(p) => loadLogs(p, logsTypeFilter, inspectData.admin.id)}
                    isEmbedded={true}
                  />
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: UNIVERSAL MEMBER SEARCH */}
        {activeTab === "search" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-rose-400" />
                  Universal Member Directory (Cross-Branch Search)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search any user across all parallel branches by ID, name, email, or phone.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={universalQuery}
                  onChange={(e) => setUniversalQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadUniversalUsers(universalQuery);
                  }}
                  placeholder="Search by SL ID, name, email..."
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono w-64 outline-none focus:border-rose-500"
                />
                <button
                  onClick={() => loadUniversalUsers(universalQuery)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Name &amp; Contact</th>
                    <th className="py-3 px-4">Assigned Branch Admin</th>
                    <th className="py-3 px-4">Sponsor</th>
                    <th className="py-3 px-4">Tier &amp; Status</th>
                    <th className="py-3 px-4">Wallets</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {universalLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        Searching across all branch databases...
                      </td>
                    </tr>
                  ) : universalUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    universalUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-amber-400">{u.customId}</td>
                        <td className="py-3 px-4 font-sans">
                          <p className="font-bold text-white">{u.fullName}</p>
                          <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          {u.assignedAdmin ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px]">
                              {u.assignedAdmin.customId} ({u.assignedAdmin.fullName})
                            </span>
                          ) : (
                            <span className="text-slate-500">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans">
                          {u.sponsor ? `${u.sponsor.customId} (${u.sponsor.fullName})` : "Root"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px]">
                            Tier {u.currentTier} &bull; {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-cyan-400 font-bold">Fund: ${Number(u.fundBalance).toFixed(2)}</p>
                          <p className="text-emerald-400 font-bold">Income: ${Number(u.incomeBalance).toFixed(2)}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setAdjustTargetId(u.customId);
                              setActiveTab("wallet");
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono cursor-pointer"
                          >
                            Adjust Balance
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: GLOBAL SYSTEM CONFIG */}
        {activeTab === "config" && (
          <section className="max-w-3xl bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-400" />
                Global Platform Configurations &amp; Parameters
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure platform deposit wallets, blockchain parameters, and authentication OTP security switches.
              </p>
            </div>

            {configMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 font-mono">
                <Check className="w-4 h-4 shrink-0" />
                <span>{configMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfigs} className="space-y-6">
              {/* Primary Deposit Wallet */}
              <div className="space-y-4 border-b border-slate-800 pb-6">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Official Deposit Wallet Configuration
                </h3>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Primary USDT Deposit Address (BEP-20)
                  </label>
                  <input
                    type="text"
                    required
                    value={configForm.primaryDepositAddress}
                    onChange={(e) => setConfigForm({ ...configForm, primaryDepositAddress: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Default Blockchain Network
                    </label>
                    <input
                      type="text"
                      value={configForm.defaultNetwork}
                      onChange={(e) => setConfigForm({ ...configForm, defaultNetwork: e.target.value })}
                      placeholder="USDT_BEP20"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Deposit Address Distribution Mode
                    </label>
                    <select
                      value={configForm.depositDistributionMode}
                      onChange={(e) => setConfigForm({ ...configForm, depositDistributionMode: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-rose-500"
                    >
                      <option value="SINGLE">Single Global Address</option>
                      <option value="MULTI_USER">Multi-User Rotating Addresses</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Email OTP Toggles */}
              <div className="space-y-4 border-b border-slate-800 pb-6">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Email OTP Security Protocol Controls
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <p className="text-xs font-bold text-white">Registration OTP</p>
                      <p className="text-[10px] text-slate-400">Require email OTP before sign up</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configForm.otpRegistration}
                      onChange={(e) => setConfigForm({ ...configForm, otpRegistration: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <p className="text-xs font-bold text-white">Withdrawal OTP</p>
                      <p className="text-[10px] text-slate-400">Require email OTP on payout requests</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configForm.otpWithdrawal}
                      onChange={(e) => setConfigForm({ ...configForm, otpWithdrawal: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <p className="text-xs font-bold text-white">Forgot Password OTP</p>
                      <p className="text-[10px] text-slate-400">Require OTP for password reset</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configForm.otpForgotPassword}
                      onChange={(e) => setConfigForm({ ...configForm, otpForgotPassword: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <p className="text-xs font-bold text-white">Profile Update OTP</p>
                      <p className="text-[10px] text-slate-400">Require OTP to change wallet address</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={configForm.otpProfileUpdate}
                      onChange={(e) => setConfigForm({ ...configForm, otpProfileUpdate: e.target.checked })}
                      className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Referral Sponsorship Activation Policy */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Users size={14} className="text-amber-400" />
                    Referral Sponsorship Rule ($10 USDT Activation)
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    configForm.requireActiveSponsor
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}>
                    {configForm.requireActiveSponsor ? "ACTIVE SPONSOR MANDATORY" : "OPEN REFERRALS"}
                  </span>
                </div>

                <label className="flex items-start justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Require Account Activation Before Referring</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Members must have an active ($10 USDT) account to refer new users. Registrations attempting to use an inactive sponsor code will be rejected.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={configForm.requireActiveSponsor}
                    onChange={(e) => setConfigForm({ ...configForm, requireActiveSponsor: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0 mt-1"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={configSaving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition disabled:opacity-50 cursor-pointer font-mono"
              >
                {configSaving ? "Saving Live Configurations..." : "Save Global Configurations"}
              </button>
            </form>
          </section>
        )}

        {/* TAB 5: WALLET ADJUSTMENT */}
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

        {/* TAB 6: MASTER SURVEILLANCE & ACTIVITY LOGS */}
        {activeTab === "logs" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                  <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                  Global Surveillance &amp; Activity Stream
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Full zero-knowledge audit logs: inspect logins, client IP addresses, geo locations, devices, browsers, and executed functions across all admins and branch members.
                </p>
              </div>
            </div>

            <SurveillanceLogsView
              logs={logs}
              loading={logsLoading}
              total={logsTotal}
              page={logsPage}
              totalPages={logsTotalPages}
              stats={logsStats}
              admins={admins}
              typeFilter={logsTypeFilter}
              onTypeFilterChange={(t) => {
                setLogsTypeFilter(t);
                loadLogs(1, t);
              }}
              adminFilter={logsAdminFilter}
              onAdminFilterChange={(a) => {
                setLogsAdminFilter(a);
                loadLogs(1, logsTypeFilter, a);
              }}
              categoryFilter={logsCategoryFilter}
              onCategoryFilterChange={(c) => {
                setLogsCategoryFilter(c);
                loadLogs(1, logsTypeFilter, logsAdminFilter, undefined, c);
              }}
              searchQuery={logsSearchQuery}
              onSearchQueryChange={(q) => {
                setLogsSearchQuery(q);
                loadLogs(1, logsTypeFilter, logsAdminFilter, q);
              }}
              onRefresh={() => loadLogs(logsPage)}
              onPageChange={(p) => loadLogs(p)}
              isEmbedded={false}
            />
          </section>
        )}

        {/* TAB 7: USDT BEP-20 DUAL-MODE DEPOSIT SOVEREIGN INFRASTRUCTURE */}
        {activeTab === "crypto_deposits" && (
          <section className="space-y-6">
            <SuperRootCryptoDepositsView />
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
                <X className="w-4 h-4" />
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

      {/* EDIT ADMIN PROFILE MODAL */}
      {editModalAdmin && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-rose-500" />
                  Edit Admin Profile: <span className="text-amber-400 font-mono">{editModalAdmin.customId}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Super Root Master Control: Update admin name, custom ID, email, phone, and password
                </p>
              </div>
              <button
                onClick={() => setEditModalAdmin(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Admin Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Admin ID (Custom ID) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.customId}
                    onChange={(e) => setEditForm({ ...editForm, customId: e.target.value })}
                    placeholder="e.g. SL000001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono uppercase outline-none focus:border-rose-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="admin@seoralink.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-rose-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210 or +91..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 transition font-mono"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Set New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  placeholder="Leave blank to keep existing password"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">Only enter if you wish to overwrite this admin's login password (minimum 6 characters).</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalAdmin(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {editLoading ? "Saving Changes..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
