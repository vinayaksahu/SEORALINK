'use client';

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Save,
  Server,
  KeyRound,
  Eye,
  Sliders,
  Check,
  Search,
  Lock,
  Unlock,
  Radio,
  Clock,
  Layers,
  Building2,
  Copy,
  ChevronDown,
  ChevronUp,
  Shuffle,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Star,
} from "lucide-react";

export interface DepositAddressItem {
  id: string;
  address: string;
  label?: string;
  network?: string;
  isActive?: boolean;
  isPrimary?: boolean;
}

interface DiagnosticsData {
  rpcStatus: string;
  rpcLatencyMs: number;
  liveBlockHeight: string;
  lastScannedBlock: string;
  blockLag: number;
  checkpointStatus: string;
  lastSuccessfulScan: string | null;
  lastError: string | null;
}

interface DepositSettings {
  globalMode: "AUTOMATIC" | "MANUAL";
  isKillSwitchActive: boolean;
  usdtContract: string;
  rpcUrl: string;
  requiredConfirmations: number;
}

interface AdminBranchItem {
  id: string;
  customId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  teamPrefix: string;
  depositMode: "GLOBAL" | "AUTOMATIC" | "MANUAL";
  effectiveMode: "AUTOMATIC" | "MANUAL";
  dedicatedVaultAddress: string;
  dedicatedVaultQr: string;
  distributionMode?: "MULTI_USER" | "SINGLE";
  depositAddresses?: DepositAddressItem[];
  poolCount?: number;
  activePermissions: string[];
  totalMembers: number;
  pendingDepositsCount: number;
}

export function SuperRootCryptoDepositsView() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings & Diagnostics State
  const [settings, setSettings] = useState<DepositSettings>({
    globalMode: "MANUAL",
    isKillSwitchActive: false,
    usdtContract: "0x55d398326f99059fF775485246999027B3197955",
    rpcUrl: "",
    requiredConfirmations: 3,
  });
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Per-Admin Permissions State
  const [admins, setAdmins] = useState<AdminBranchItem[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [editingAdmin, setEditingAdmin] = useState<AdminBranchItem | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [editVaultAddress, setEditVaultAddress] = useState("");
  const [editVaultQr, setEditVaultQr] = useState("");
  const [editDepositMode, setEditDepositMode] = useState<"GLOBAL" | "AUTOMATIC" | "MANUAL">("GLOBAL");
  const [savingAdminId, setSavingAdminId] = useState<string | null>(null);

  // Branch Inspector State
  const [inspectAdminId, setInspectAdminId] = useState<string | null>(null);
  const [inspectDeposits, setInspectDeposits] = useState<any[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  const fetchSettingsAndDiagnostics = async () => {
    try {
      const res = await fetch("/api/superadmin/crypto-deposits/settings");
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setDiagnostics(data.diagnostics);
        setStats(data.stats);
      }
    } catch (e: any) {
      console.error("Failed to load settings:", e);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/superadmin/crypto-deposits/permissions");
      const data = await res.json();
      if (res.ok && data.success) {
        setAdmins(data.admins);
        setAvailablePermissions(data.availablePermissions || []);
      }
    } catch (e: any) {
      console.error("Failed to load admins:", e);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSettingsAndDiagnostics(), fetchAdmins()]);
      setLoading(false);
    };
    loadAll();

    // Poll diagnostics every 12 seconds
    const interval = setInterval(() => {
      fetchSettingsAndDiagnostics();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveGlobalSettings = async (updates: Partial<DepositSettings>) => {
    setSavingSettings(true);
    setActionMsg(null);
    try {
      const payload: any = {
        globalMode: updates.globalMode ?? settings.globalMode,
        killSwitch: updates.isKillSwitchActive !== undefined ? (updates.isKillSwitchActive ? "PAUSED" : "ACTIVE") : undefined,
        tokenContract: updates.usdtContract ?? settings.usdtContract,
        rpcUrl: updates.rpcUrl ?? settings.rpcUrl,
        requiredConfirmations: updates.requiredConfirmations ?? settings.requiredConfirmations,
      };

      const res = await fetch("/api/superadmin/crypto-deposits/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      setActionMsg({ type: "success", text: "Global settings updated successfully!" });
      await fetchSettingsAndDiagnostics();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerReconcile = async () => {
    setReconciling(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/superadmin/crypto-deposits/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerReconcile: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reconciliation failed");

      setActionMsg({
        type: "success",
        text: `Reconciliation cycle completed! Scanned ${data.scanResult?.blocksScanned || 0} blocks, credited ${data.scanResult?.depositsCredited || 0} deposits.`,
      });
      await fetchSettingsAndDiagnostics();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message });
    } finally {
      setReconciling(false);
    }
  };

  const [editDistributionMode, setEditDistributionMode] = useState<"MULTI_USER" | "SINGLE">("MULTI_USER");
  const [editAddresses, setEditAddresses] = useState<DepositAddressItem[]>([]);
  const [newAddressInput, setNewAddressInput] = useState("");
  const [newLabelInput, setNewLabelInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [poolError, setPoolError] = useState("");

  const handleToggleActive = (id: string) => {
    setPoolError("");
    setEditAddresses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const activeCount = prev.filter((a) => a.isActive !== false).length;
          if (item.isActive !== false && activeCount <= 1) {
            setPoolError("At least one deposit address must remain active.");
            return item;
          }
          return { ...item, isActive: item.isActive === false };
        }
        return item;
      })
    );
  };

  const handleSetPrimary = (id: string) => {
    setPoolError("");
    setEditAddresses((prev) =>
      prev.map((item) => {
        const isTarget = item.id === id;
        if (isTarget) {
          setEditVaultAddress(item.address);
        }
        return {
          ...item,
          isPrimary: isTarget,
          isActive: isTarget ? true : item.isActive,
        };
      })
    );
  };

  const handleDeleteAddress = (id: string) => {
    setPoolError("");
    if (editAddresses.length <= 1) {
      setPoolError("Cannot delete the only configured deposit address.");
      return;
    }
    const itemToDelete = editAddresses.find((a) => a.id === id);
    if (itemToDelete?.isPrimary) {
      setPoolError("Cannot delete the primary address. Please set another address as primary first.");
      return;
    }
    setEditAddresses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setPoolError("");

    const trimmed = newAddressInput.trim();
    if (!trimmed) {
      setPoolError("Wallet address cannot be empty.");
      return;
    }

    if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
      setPoolError("Please enter a valid BNB Smart Chain (BEP-20) address starting with 0x (42 characters).");
      return;
    }

    if (editAddresses.some((a) => a.address.toLowerCase() === trimmed.toLowerCase())) {
      setPoolError("This wallet address is already added in the pool.");
      return;
    }

    const isFirst = editAddresses.length === 0;
    const newItem: DepositAddressItem = {
      id: `addr_${Date.now()}`,
      address: trimmed,
      label: newLabelInput.trim() || `Wallet ${editAddresses.length + 1}`,
      network: "USDT_BEP20",
      isActive: true,
      isPrimary: isFirst,
    };

    if (isFirst) {
      setEditVaultAddress(trimmed);
    }

    setEditAddresses((prev) => [...prev, newItem]);
    setNewAddressInput("");
    setNewLabelInput("");
    setShowAddForm(false);
  };

  const openAdminEditor = (adm: AdminBranchItem) => {
    setEditingAdmin(adm);
    setSelectedPerms([...adm.activePermissions]);
    setEditVaultAddress(adm.dedicatedVaultAddress || "");
    setEditVaultQr(adm.dedicatedVaultQr || "");
    setEditDepositMode(adm.depositMode || "GLOBAL");
    setEditDistributionMode(adm.distributionMode || "MULTI_USER");
    let pool = adm.depositAddresses || [];
    if (pool.length === 0 && adm.dedicatedVaultAddress) {
      pool = [
        {
          id: "addr_1",
          address: adm.dedicatedVaultAddress,
          label: `${adm.fullName} Dedicated Vault`,
          network: "USDT_BEP20",
          isActive: true,
          isPrimary: true,
        },
      ];
    }
    setEditAddresses(pool);
    setShowAddForm(false);
    setNewAddressInput("");
    setNewLabelInput("");
    setPoolError("");
  };

  const handleSaveAdminConfig = async () => {
    if (!editingAdmin) return;
    setSavingAdminId(editingAdmin.id);
    setActionMsg(null);
    try {
      const res = await fetch("/api/superadmin/crypto-deposits/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: editingAdmin.id,
          depositMode: editDepositMode,
          vaultAddress: editVaultAddress,
          vaultQrUrl: editVaultQr,
          permissions: selectedPerms,
          distributionMode: editDistributionMode,
          depositAddresses: editAddresses,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update admin permissions");

      setActionMsg({ type: "success", text: data.message || "Admin updated!" });
      setEditingAdmin(null);
      await fetchAdmins();
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message });
    } finally {
      setSavingAdminId(null);
    }
  };

  const handleInspectBranch = async (adminId: string) => {
    setInspectAdminId(adminId);
    setInspectLoading(true);
    try {
      const res = await fetch(`/api/admin/crypto-deposits?branchId=${adminId}&limit=50`);
      const data = await res.json();
      if (res.ok && data.success) {
        setInspectDeposits(data.deposits || []);
      }
    } catch (err) {
      console.error("Inspect fetch error:", err);
    } finally {
      setInspectLoading(false);
    }
  };

  const filteredAdmins = admins.filter((adm) => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      adm.customId.toLowerCase().includes(q) ||
      adm.fullName.toLowerCase().includes(q) ||
      adm.email.toLowerCase().includes(q) ||
      adm.teamPrefix.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap size={22} className="text-[#38bdf8]" />
            Self-Hosted USDT BEP-20 Dual-Mode Deposit Sovereign Infrastructure
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Independent BNB Smart Chain crypto engine &bull; SuperRootAdmin exclusive multi-branch control &bull; Zero third-party fees
          </p>
        </div>

        <button
          onClick={handleTriggerReconcile}
          disabled={reconciling}
          className="btn-primary text-xs font-bold px-4 py-2.5 flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw size={14} className={reconciling ? "animate-spin" : ""} />
          {reconciling ? "Scanning BSC Blocks..." : "Run Reconcile Cycle"}
        </button>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            actionMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {actionMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* TOP METRICS & DIAGNOSTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* RPC Status */}
        <div className="card-seoralink p-4 border border-[#1e293b]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#94a3b8]">BSC RPC Node</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                diagnostics?.rpcStatus === "ONLINE" ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            ></span>
          </div>
          <div className="text-base font-bold text-white mt-2 font-mono">
            {diagnostics?.rpcStatus || "CHECKING"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Latency: <strong className="text-sky-400 font-mono">{diagnostics?.rpcLatencyMs || 0}ms</strong>
          </div>
        </div>

        {/* Live Block Height */}
        <div className="card-seoralink p-4 border border-[#1e293b]">
          <span className="text-[10px] uppercase font-bold text-[#94a3b8]">BSC Block Height</span>
          <div className="text-base font-bold text-white mt-2 font-mono">
            #{diagnostics?.liveBlockHeight || "..."}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Scanned up to: <span className="font-mono text-slate-300">#{diagnostics?.lastScannedBlock || "..."}</span>
          </div>
        </div>

        {/* Block Lag Counter */}
        <div className="card-seoralink p-4 border border-[#1e293b]">
          <span className="text-[10px] uppercase font-bold text-[#94a3b8]">Block Scan Lag</span>
          <div
            className={`text-base font-bold mt-2 font-mono ${
              (diagnostics?.blockLag || 0) <= 5
                ? "text-emerald-400"
                : (diagnostics?.blockLag || 0) <= 20
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {diagnostics?.blockLag ?? 0} Blocks
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {(diagnostics?.blockLag || 0) <= 5 ? "Synced & Real-time" : "Catching up..."}
          </div>
        </div>

        {/* Global Deposit Mode */}
        <div className="card-seoralink p-4 border border-[#1e293b]">
          <span className="text-[10px] uppercase font-bold text-[#94a3b8]">Global Processing Mode</span>
          <div className="text-base font-bold text-white mt-2 font-mono flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                settings.globalMode === "AUTOMATIC" ? "bg-emerald-400" : "bg-[#d4af37]"
              }`}
            ></span>
            {settings.globalMode}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Fallback for unassigned admins
          </div>
        </div>

        {/* Emergency Kill Switch */}
        <div
          className={`card-seoralink p-4 border ${
            settings.isKillSwitchActive
              ? "border-red-500/50 bg-red-950/20"
              : "border-[#1e293b] bg-[#070e1b]"
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-[#94a3b8]">Emergency Kill-Switch</span>
          <div
            className={`text-base font-bold mt-2 font-mono ${
              settings.isKillSwitchActive ? "text-red-400 animate-pulse" : "text-emerald-400"
            }`}
          >
            {settings.isKillSwitchActive ? "CREDITING PAUSED" : "ACTIVE (NORMAL)"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {settings.isKillSwitchActive ? "Deposits holding in queue" : "Auto-crediting enabled"}
          </div>
        </div>
      </div>

      {/* MASTER CONTROLS & PLATFORM CONFIG */}
      <div className="card-seoralink p-6 border border-[#1e293b] space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders size={18} className="text-[#38bdf8]" />
          Platform Sovereign Master Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Global Mode Switch */}
          <div className="space-y-2 p-4 rounded-xl bg-[#0b1325] border border-[#1e293b]">
            <label className="text-xs font-bold text-white block">Global Processing Mode (Level 3 Default)</label>
            <p className="text-[11px] text-[#94a3b8]">
              Controls default deposit flow when sub-admins inherit &quot;GLOBAL&quot;.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveGlobalSettings({ globalMode: "MANUAL" })}
                disabled={savingSettings}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  settings.globalMode === "MANUAL"
                    ? "bg-[#d4af37] text-[#0b1120] shadow-md"
                    : "bg-[#070e1b] text-slate-400 border border-[#1e293b] hover:text-white"
                }`}
              >
                Manual Approval
              </button>
              <button
                type="button"
                onClick={() => handleSaveGlobalSettings({ globalMode: "AUTOMATIC" })}
                disabled={savingSettings}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  settings.globalMode === "AUTOMATIC"
                    ? "bg-emerald-400 text-[#0b1120] shadow-md"
                    : "bg-[#070e1b] text-slate-400 border border-[#1e293b] hover:text-white"
                }`}
              >
                Automatic Instant
              </button>
            </div>
          </div>

          {/* Kill Switch Toggle */}
          <div className="space-y-2 p-4 rounded-xl bg-[#0b1325] border border-[#1e293b]">
            <label className="text-xs font-bold text-white block">Emergency Crediting Pause (Kill-Switch)</label>
            <p className="text-[11px] text-[#94a3b8]">
              Instantly freezes automatic balance crediting without stopping blockchain scanning.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveGlobalSettings({ isKillSwitchActive: false })}
                disabled={savingSettings}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  !settings.isKillSwitchActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-[#070e1b] text-slate-500 border border-[#1e293b]"
                }`}
              >
                Normal (Unpaused)
              </button>
              <button
                type="button"
                onClick={() => handleSaveGlobalSettings({ isKillSwitchActive: true })}
                disabled={savingSettings}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  settings.isKillSwitchActive
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-[#070e1b] text-slate-400 border border-[#1e293b] hover:text-red-400"
                }`}
              >
                KILL-SWITCH (PAUSE)
              </button>
            </div>
          </div>

          {/* Required Confirmations */}
          <div className="space-y-2 p-4 rounded-xl bg-[#0b1325] border border-[#1e293b]">
            <label className="text-xs font-bold text-white block">Block Confirmations</label>
            <p className="text-[11px] text-[#94a3b8]">
              Required BSC blocks before automatic deposit balance credit (~3s per block).
            </p>
            <div className="flex items-center gap-2 pt-2">
              {[2, 3, 5, 12].map((conf) => (
                <button
                  key={conf}
                  type="button"
                  onClick={() => handleSaveGlobalSettings({ requiredConfirmations: conf })}
                  disabled={savingSettings}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                    settings.requiredConfirmations === conf
                      ? "bg-sky-400 text-[#0b1120]"
                      : "bg-[#070e1b] text-slate-400 border border-[#1e293b]"
                  }`}
                >
                  {conf} ({conf * 3}s)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contract & RPC inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#cbd5e1]">USDT BEP-20 Contract Override</label>
            <input
              type="text"
              value={settings.usdtContract}
              onChange={(e) => setSettings({ ...settings, usdtContract: e.target.value })}
              className="w-full bg-[#0b1325] border border-[#1e293b] rounded-lg px-3 py-2 text-xs font-mono text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#cbd5e1]">Primary BSC JSON-RPC URL (Optional Override)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://bsc-dataseed.binance.org"
                value={settings.rpcUrl}
                onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
                className="flex-1 bg-[#0b1325] border border-[#1e293b] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() =>
                  handleSaveGlobalSettings({
                    usdtContract: settings.usdtContract,
                    rpcUrl: settings.rpcUrl,
                  })
                }
                disabled={savingSettings}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1e293b] hover:bg-slate-700 text-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PER-ADMIN BRANCH MODE & GRANULAR RBAC MATRIX */}
      <div className="card-seoralink p-6 border border-[#1e293b] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 size={18} className="text-[#d4af37]" />
              Per-Admin Multi-Branch Mode & Granular RBAC Permissions
            </h3>
            <p className="text-xs text-[#94a3b8] mt-1">
              Configure each sub-admin&apos;s isolated processing mode (Force Auto / Force Manual), dedicated vault address, and 17 granular capabilities.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search admin branch..."
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="w-full bg-[#0b1325] border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {/* Admins Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-num">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#070e1b] text-[#94a3b8] text-[10px] uppercase">
                <th className="py-3 px-4">Branch Admin</th>
                <th className="py-3 px-4">Configured Mode</th>
                <th className="py-3 px-4">Effective Flow</th>
                <th className="py-3 px-4">Dedicated Vault Address</th>
                <th className="py-3 px-4">Active RBAC</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50">
              {filteredAdmins.map((adm) => {
                const isForcedAuto = adm.depositMode === "AUTOMATIC";
                const isForcedManual = adm.depositMode === "MANUAL";
                const isInherited = adm.depositMode === "GLOBAL";

                return (
                  <tr key={adm.id} className="hover:bg-[#0f172a]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{adm.fullName}</div>
                      <div className="text-[11px] text-[#d4af37] font-mono">{adm.customId} ({adm.teamPrefix})</div>
                      <div className="text-[10px] text-slate-500">{adm.totalMembers} members</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                          isForcedAuto
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : isForcedManual
                            ? "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {isInherited ? "GLOBAL (Inherited)" : adm.depositMode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-bold flex items-center gap-1.5 text-[11px] ${
                          adm.effectiveMode === "AUTOMATIC" ? "text-emerald-400" : "text-[#d4af37]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            adm.effectiveMode === "AUTOMATIC" ? "bg-emerald-400" : "bg-[#d4af37]"
                          }`}
                        ></span>
                        {adm.effectiveMode}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-[240px]">
                      {adm.dedicatedVaultAddress ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {adm.distributionMode === "MULTI_USER" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Multi-User Dynamic ({adm.poolCount && adm.poolCount > 1 ? `${adm.poolCount} Wallets` : "Active Pool"})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Single Primary Address
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="truncate text-sky-400 font-mono text-[11px]" title={adm.dedicatedVaultAddress}>
                              {adm.dedicatedVaultAddress}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Default Company Vault</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-300 font-bold bg-[#0b1325] px-2 py-0.5 rounded border border-[#1e293b]">
                        {adm.activePermissions.length} / 17 Permissions
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {adm.pendingDepositsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {adm.pendingDepositsCount} Pending
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleInspectBranch(adm.id)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-sky-500/10 hover:bg-sky-500/20 text-[#38bdf8] border border-sky-500/30 transition-colors"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => openAdminEditor(adm)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/40 transition-colors"
                        >
                          Configure
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN CONFIGURATION & GRANULAR RBAC MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="card-seoralink p-6 max-w-2xl w-full border border-[#1e293b] space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound size={18} className="text-[#d4af37]" />
                  Branch Deposit Controls &bull; {editingAdmin.fullName} ({editingAdmin.customId})
                </h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Configure branch processing mode, dedicated vault, and RBAC permissions.
                </p>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white">Deposit Processing Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "GLOBAL", label: "Inherit Global", desc: `Currently ${settings.globalMode}` },
                  { value: "AUTOMATIC", label: "Force Automatic", desc: "Unique addresses & auto-credit" },
                  { value: "MANUAL", label: "Force Manual", desc: "Admin review queue" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditDepositMode(opt.value as any)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      editDepositMode === opt.value
                        ? "border-[#d4af37] bg-[#d4af37]/10"
                        : "border-[#1e293b] bg-[#0b1325] hover:border-slate-600"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Distribution Strategy Selector */}
            <div className="space-y-3 bg-[#070e1b] p-3.5 rounded-xl border border-[#1e293b]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shuffle size={14} className="text-[#38bdf8]" />
                  Deposit Address Distribution Strategy
                </label>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded font-mono border ${
                    editDistributionMode === "MULTI_USER"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {editDistributionMode === "MULTI_USER" ? "Dynamic Multi-User Active" : "Single Wallet Mode"}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                Choose whether different members see different dedicated vault addresses simultaneously, or everyone uses a single primary vault.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setEditDistributionMode("MULTI_USER")}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    editDistributionMode === "MULTI_USER"
                      ? "bg-[#0b1325] border-[#38bdf8] ring-1 ring-[#38bdf8]/40 text-white"
                      : "bg-[#0b1325]/50 border-[#1e293b] text-[#94a3b8] hover:border-[#334155]"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <Users size={14} className="text-[#38bdf8]" />
                    Multi-User Dynamic Distribution
                  </div>
                  <p className="text-[10px] text-[#94a3b8] mt-1 leading-relaxed">
                    Users under this branch are evenly assigned different active addresses from the pool. Different members depositing see separate vault addresses.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEditDistributionMode("SINGLE")}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    editDistributionMode === "SINGLE"
                      ? "bg-[#0b1325] border-[#d4af37] ring-1 ring-[#d4af37]/40 text-white"
                      : "bg-[#0b1325]/50 border-[#1e293b] text-[#94a3b8] hover:border-[#334155]"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <ShieldCheck size={14} className="text-[#d4af37]" />
                    Single Primary Address
                  </div>
                  <p className="text-[10px] text-[#94a3b8] mt-1 leading-relaxed">
                    All members under this branch will see only the primary official deposit address regardless of pool size.
                  </p>
                </button>
              </div>
            </div>

            {/* Dedicated Vault Address Pool */}
            <div className="space-y-3 bg-[#070e1b] p-3.5 rounded-xl border border-[#1e293b]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-[#d4af37]" />
                    Dedicated Vault Addresses Pool ({editAddresses.length})
                  </label>
                  <p className="text-[10px] text-[#94a3b8] mt-0.5">
                    Active wallets: <strong className="text-emerald-400">{editAddresses.filter((a) => a.isActive !== false).length}</strong>/{editAddresses.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  Add Address
                </button>
              </div>

              {poolError && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{poolError}</span>
                </div>
              )}

              {/* Add Address Form */}
              {showAddForm && (
                <div className="p-3 rounded-lg bg-[#0b1325] border border-[#38bdf8]/40 space-y-2">
                  <div className="text-xs font-bold text-white">Add New Address to Pool</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="0x... (42 chars BSC BEP-20 address)"
                      value={newAddressInput}
                      onChange={(e) => setNewAddressInput(e.target.value)}
                      className="bg-[#070e1b] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#38bdf8]"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g. Hot Wallet 2)"
                      value={newLabelInput}
                      onChange={(e) => setNewLabelInput(e.target.value)}
                      className="bg-[#070e1b] border border-[#1e293b] rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setPoolError("");
                      }}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="px-3 py-1 text-xs font-bold rounded bg-[#38bdf8] text-[#0b1120] hover:bg-[#38bdf8]/90"
                    >
                      Confirm Add
                    </button>
                  </div>
                </div>
              )}

              {/* Address List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {editAddresses.map((item, idx) => {
                  const isActive = item.isActive !== false;
                  const isPrimary = item.isPrimary || item.address.toLowerCase() === editVaultAddress.toLowerCase();

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
                        isPrimary
                          ? "bg-[#0b1325] border-[#d4af37]/60 ring-1 ring-[#d4af37]/20"
                          : "bg-[#0b1325]/70 border-[#1e293b]"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                          <span className="font-bold text-white truncate text-[11px]">{item.label || `Wallet ${idx + 1}`}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            BEP-20
                          </span>
                          {isPrimary && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 flex items-center gap-1">
                              <Star size={10} className="fill-[#d4af37]" /> Primary
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-300 truncate">{item.address}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(item.id)}
                            className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 transition-colors"
                          >
                            Make Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item.id)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(item.id)}
                          disabled={editAddresses.length <= 1 || isPrimary}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none"
                          title="Delete address"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Primary Address Quick Sync Box */}
              <div className="pt-2 border-t border-[#1e293b] space-y-1">
                <label className="text-[11px] font-bold text-[#cbd5e1] flex items-center justify-between">
                  <span>Primary Dedicated Vault Address</span>
                  <span className="text-[9px] text-[#94a3b8] font-normal">Automatically synced with Primary item</span>
                </label>
                <input
                  type="text"
                  value={editVaultAddress}
                  onChange={(e) => setEditVaultAddress(e.target.value)}
                  placeholder="0x... (leave empty to use default company vault)"
                  className="w-full bg-[#0b1325] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Dedicated Vault QR Code URL */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#cbd5e1]">Dedicated QR Code URL (Optional)</label>
              <input
                type="text"
                value={editVaultQr}
                onChange={(e) => setEditVaultQr(e.target.value)}
                placeholder="https://... or data:image/png..."
                className="w-full bg-[#0b1325] border border-[#1e293b] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600"
              />
              <p className="text-[10px] text-slate-400">
                In Dynamic Multi-User mode, QR codes are automatically generated directly matching each member&apos;s individually assigned receiving address.
              </p>
            </div>

            {/* Granular RBAC Checkboxes (17 capabilities) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  Granular RBAC Capabilities ({selectedPerms.length} / {availablePermissions.length} selected)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPerms([...availablePermissions])}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPerms([])}
                    className="text-[10px] text-slate-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-[#0b1325] border border-[#1e293b] max-h-56 overflow-y-auto">
                {availablePermissions.map((perm) => {
                  const isChecked = selectedPerms.includes(perm);
                  return (
                    <label
                      key={perm}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#070e1b] cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPerms([...selectedPerms, perm]);
                          } else {
                            setSelectedPerms(selectedPerms.filter((p) => p !== perm));
                          }
                        }}
                        className="rounded border-[#1e293b] text-[#d4af37] focus:ring-0 bg-[#070e1b]"
                      />
                      <span className={`font-mono text-[11px] ${isChecked ? "text-white font-medium" : "text-slate-400"}`}>
                        {perm}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdminConfig}
                disabled={savingAdminId !== null}
                className="btn-primary text-xs font-bold px-5 py-2.5 flex items-center gap-2"
              >
                {savingAdminId ? "Saving Changes..." : "Save Branch Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRANCH INSPECTOR PANEL */}
      {inspectAdminId && (
        <div className="card-seoralink p-6 border border-sky-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <div>
              <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                <Eye size={18} />
                Branch Inspector Queue &bull; {admins.find((a) => a.id === inspectAdminId)?.fullName} (
                {admins.find((a) => a.id === inspectAdminId)?.customId})
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Real-time inspection of deposits and pending verification items in this branch.
              </p>
            </div>
            <button
              onClick={() => setInspectAdminId(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close Inspector
            </button>
          </div>

          {inspectLoading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading branch deposits...</div>
          ) : inspectDeposits.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic">
              No deposit records found in this branch queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-num">
                <thead>
                  <tr className="border-b border-[#1e293b] text-[#94a3b8] text-[10px] uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">TxHash</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {inspectDeposits.map((d: any) => (
                    <tr key={d.id} className="hover:bg-[#0f172a]/30">
                      <td className="py-2.5 px-3 text-[#94a3b8] text-[11px]">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white">{d.user?.fullName}</span>
                        <span className="text-[#d4af37] block text-[10px]">{d.user?.customId}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        ${parseFloat(d.amountInUsdt || d.amount || "0").toFixed(2)} USDT
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {d.processingMode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-sky-400">
                        {d.txHash?.slice(0, 12)}...
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold text-[11px] ${
                            d.status === "CREDITED" || d.status === "APPROVED"
                              ? "text-emerald-400"
                              : d.status === "REJECTED"
                              ? "text-red-400"
                              : "text-amber-400"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
