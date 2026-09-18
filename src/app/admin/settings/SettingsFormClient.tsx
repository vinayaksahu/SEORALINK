'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Star,
  Users,
  Shuffle,
  ShieldCheck,
  Wallet
} from "lucide-react";

export interface DepositAddressItem {
  id: string;
  address: string;
  label?: string;
  network: string;
  isActive: boolean;
  isPrimary?: boolean;
}

export default function SettingsFormClient({
  initialAddress,
  initialAddresses,
  initialDistributionMode,
  initialNetwork,
}: {
  initialAddress: string;
  initialAddresses?: DepositAddressItem[];
  initialDistributionMode?: string;
  initialNetwork: string;
}) {
  const router = useRouter();

  const [addresses, setAddresses] = useState<DepositAddressItem[]>(() => {
    if (initialAddresses && initialAddresses.length > 0) {
      return initialAddresses;
    }
    return [
      {
        id: "addr_default",
        address: initialAddress || "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001",
        label: "Master Hot Wallet 1",
        network: initialNetwork || "USDT_BEP20",
        isActive: true,
        isPrimary: true,
      },
    ];
  });

  const [distributionMode, setDistributionMode] = useState<string>(
    initialDistributionMode || "MULTI_USER"
  );
  const [network, setNetwork] = useState(initialNetwork || "USDT_BEP20");

  // New Address form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newNetwork, setNewNetwork] = useState("USDT_BEP20");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = (id: string) => {
    setAddresses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const activeCount = prev.filter((a) => a.isActive).length;
          if (item.isActive && activeCount <= 1) {
            setError("At least one deposit address must remain active.");
            return item;
          }
          return { ...item, isActive: !item.isActive };
        }
        return item;
      })
    );
  };

  const handleSetPrimary = (id: string) => {
    setAddresses((prev) =>
      prev.map((item) => ({
        ...item,
        isPrimary: item.id === id,
        isActive: item.id === id ? true : item.isActive,
      }))
    );
  };

  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      setError("Cannot delete the only configured deposit address.");
      return;
    }
    const itemToDelete = addresses.find((a) => a.id === id);
    if (itemToDelete?.isPrimary) {
      setError("Cannot delete the primary address. Please set another address as primary first.");
      return;
    }
    setAddresses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = newAddress.trim();
    if (!trimmed) {
      setError("Wallet address cannot be empty.");
      return;
    }

    if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
      setError("Please enter a valid BNB Smart Chain (BEP-20) address starting with 0x (42 characters).");
      return;
    }

    if (addresses.some((a) => a.address.toLowerCase() === trimmed.toLowerCase())) {
      setError("This wallet address is already added in the pool.");
      return;
    }

    const newItem: DepositAddressItem = {
      id: `addr_${Date.now()}`,
      address: trimmed,
      label: newLabel.trim() || `Wallet ${addresses.length + 1}`,
      network: "USDT_BEP20",
      isActive: true,
      isPrimary: addresses.length === 0,
    };

    setAddresses((prev) => [...prev, newItem]);
    setNewAddress("");
    setNewLabel("");
    setShowAddForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    const activeList = addresses.filter((a) => a.isActive);
    if (activeList.length === 0) {
      setError("You must have at least one active deposit address.");
      return;
    }

    setLoading(true);

    try {
      const primary = addresses.find((a) => a.isPrimary && a.isActive) || activeList[0];

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usdtAddress: primary.address,
          depositAddresses: addresses,
          distributionMode,
          network,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("System configuration & deposit address pool updated successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = addresses.filter((a) => a.isActive).length;

  return (
    <div className="card-seoralink p-6 max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Settings size={16} className="text-red-400" />
            Deposit & System Parameters
          </h3>
          <p className="text-[11px] text-[#94a3b8] mt-1">
            Manage company USDT deposit addresses and configure multi-user address distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#0b1120] border border-[#1e293b] text-[#94a3b8]">
            Active Wallets: <strong className="text-emerald-400">{activeCount}</strong>/{addresses.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Distribution Mode Setting */}
      <div className="space-y-3 bg-[#070a14] p-4 rounded-xl border border-[#1e293b]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-2">
            <Shuffle size={14} className="text-[#38bdf8]" />
            Deposit Address Distribution Strategy
          </label>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
            distributionMode === "MULTI_USER"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}>
            {distributionMode === "MULTI_USER" ? "Dynamic Multi-User Active" : "Single Wallet Mode"}
          </span>
        </div>

        <p className="text-[11px] text-[#94a3b8]">
          Choose whether different users see different deposit addresses simultaneously, or everyone uses a single primary address.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setDistributionMode("MULTI_USER")}
            className={`p-3.5 rounded-lg text-left transition-all border ${
              distributionMode === "MULTI_USER"
                ? "bg-[#0b1120] border-[#38bdf8] ring-1 ring-[#38bdf8]/40 text-white"
                : "bg-[#0b1120]/50 border-[#1e293b] text-[#94a3b8] hover:border-[#334155]"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Users size={15} className="text-[#38bdf8]" />
              Multi-User Dynamic Distribution
            </div>
            <p className="text-[10px] text-[#94a3b8] mt-1.5 leading-relaxed">
              Users are evenly assigned different active addresses from the pool. Different members depositing at the same time see separate company addresses.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDistributionMode("SINGLE")}
            className={`p-3.5 rounded-lg text-left transition-all border ${
              distributionMode === "SINGLE"
                ? "bg-[#0b1120] border-[#d4af37] ring-1 ring-[#d4af37]/40 text-white"
                : "bg-[#0b1120]/50 border-[#1e293b] text-[#94a3b8] hover:border-[#334155]"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <ShieldCheck size={15} className="text-[#d4af37]" />
              Single Primary Address
            </div>
            <p className="text-[10px] text-[#94a3b8] mt-1.5 leading-relaxed">
              All members will see only the primary official deposit address regardless of pool size.
            </p>
          </button>
        </div>
      </div>

      {/* Multiple Deposit Addresses Pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-2">
            <Wallet size={14} className="text-[#d4af37]" />
            Official USDT Deposit Addresses Pool ({addresses.length})
          </label>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowAddForm(!showAddForm);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0b1120] border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37]/10 flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            {showAddForm ? "Cancel" : "Add New Address"}
          </button>
        </div>

        {/* Add New Address Inline Card */}
        {showAddForm && (
          <div className="p-4 rounded-xl border border-[#d4af37]/40 bg-[#070a14] space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Plus size={14} className="text-[#d4af37]" />
              Add Deposit Address to Pool
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#94a3b8] uppercase">Label / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Binance Vault 2 or Hot Wallet B"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#94a3b8] uppercase">Network</label>
                <div className="w-full bg-[#0b1120] border border-[#1e293b] text-[#38bdf8] rounded-lg px-3 py-2 text-xs font-mono font-bold flex items-center justify-between">
                  <span>USDT &bull; BEP-20</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30">BSC</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#94a3b8] uppercase">USDT Wallet Address (0x...) *</label>
              <input
                type="text"
                placeholder="0x... (BNB Smart Chain BEP-20 address)"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full bg-[#0b1120] border border-[#1e293b] text-white rounded-lg px-3 py-2 text-xs font-mono-num focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white border border-[#1e293b]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAddress}
                className="btn-primary px-4 py-1.5 text-xs font-bold"
              >
                Add Address
              </button>
            </div>
          </div>
        )}

        {/* List of Configured Addresses */}
        <div className="space-y-2.5">
          {addresses.map((item, index) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.isActive
                    ? "bg-[#0b1120] border-[#1e293b] hover:border-[#334155]"
                    : "bg-[#070a14]/60 border-[#1e293b]/50 opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-white bg-[#070a14] px-2 py-0.5 rounded border border-[#1e293b]">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-[#f1f5f9]">
                      {item.label || `Wallet ${index + 1}`}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                      {item.network === "USDT_TRC20" ? "TRC-20" : "BEP-20"}
                    </span>
                    {item.isPrimary && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/40 flex items-center gap-1">
                        <Star size={10} className="fill-[#d4af37]" /> Primary
                      </span>
                    )}
                    {!item.isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-700/30 text-zinc-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(item.id)}
                        className="text-[10px] text-[#94a3b8] hover:text-[#d4af37] px-2 py-1 rounded bg-[#070a14] border border-[#1e293b] flex items-center gap-1 transition-colors"
                        title="Set as primary address"
                      >
                        <Star size={11} /> Make Primary
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                        item.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                      }`}
                    >
                      {item.isActive ? "Active" : "Disabled"}
                    </button>

                    {addresses.length > 1 && !item.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(item.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Address bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={item.address}
                    className="w-full bg-[#070a14] border border-[#1e293b] text-white font-mono-num text-[11px] px-3 py-1.5 rounded-lg focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.address)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#070a14] border border-[#1e293b] text-[#94a3b8] hover:text-white text-xs flex items-center gap-1 flex-shrink-0"
                    title="Copy address"
                  >
                    {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span className="text-[10px]">{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Default Network */}
      <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
        <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
          <span>Default Network</span>
          <span className="text-[10px] text-[#38bdf8] font-mono font-bold">BEP-20 Only</span>
        </label>
        <div className="w-full bg-[#0b1120] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 text-xs font-mono-num flex items-center justify-between">
          <span className="font-bold text-[#38bdf8]">USDT &bull; BNB Smart Chain (BEP-20)</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
            BSC
          </span>
        </div>
        <p className="text-[10px] text-[#94a3b8]">
          Deposit and withdrawal transactions are strictly processed on BNB Smart Chain (BEP-20).
        </p>
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="btn-primary w-full py-3 text-xs font-extrabold disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
      >
        <Settings size={14} />
        {loading ? "Saving System Configuration..." : "Save System Configuration"}
      </button>
    </div>
  );
}
