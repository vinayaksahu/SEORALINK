'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TIER_NAMES } from "@/lib/constants";
import {
  Pencil,
  Zap,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Trophy,
  Wallet,
  ExternalLink,
  RefreshCw,
  Ban,
} from "lucide-react";

export interface UserItem {
  id: string;
  customId: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  currentTier: number;
  directCount: number;
  fundBalance: string;
  incomeBalance: string;
  poolBalance: number;
  createdAt: string;
  sponsor: {
    customId: string;
    fullName: string;
  } | null;
}

export default function UsersTableClient({ initialUsers }: { initialUsers: UserItem[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Status Action Modal State
  const [statusModal, setStatusModal] = useState<{
    user: UserItem;
    action: "ACTIVATE" | "BLOCK" | "UNBLOCK";
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");

  const openStatusModal = (user: UserItem, action: "ACTIVATE" | "BLOCK" | "UNBLOCK") => {
    setStatusModal({ user, action });
    setStatusError("");
    setStatusSuccess("");
  };

  // Portal Impersonation State
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const handleConfirmStatusChange = async () => {
    if (!statusModal) return;
    setStatusLoading(true);
    setStatusError("");
    setStatusSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${statusModal.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: statusModal.action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${statusModal.action.toLowerCase()} member`);
      }

      const newStatus = statusModal.action === "BLOCK" ? "BLOCKED" : "ACTIVE";
      setUsers((prev) =>
        prev.map((u) =>
          u.id === statusModal.user.id
            ? {
                ...u,
                status: newStatus,
              }
            : u
        )
      );

      setStatusSuccess(data.message || `Member updated to ${newStatus} successfully!`);
      setTimeout(() => {
        setStatusModal(null);
        setStatusSuccess("");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setStatusError(err.message || "Failed to update member status");
    } finally {
      setStatusLoading(false);
    }
  };


  const handleImpersonate = async (targetUser: UserItem) => {
    try {
      setImpersonatingId(targetUser.id);
      setImpersonateError(null);

      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUser.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to switch to member portal");
      }

      // Hard redirect to load member portal layout and session cleanly
      window.location.href = data.redirectUrl || "/member/dashboard";
    } catch (err: any) {
      setImpersonateError(err.message || "Failed to switch to user portal");
      setImpersonatingId(null);
    }
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setError("");
    setSuccess("");
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setError("");
    setSuccess("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError("");
    setSuccess("");

    if (!editFullName.trim() || editFullName.trim().length < 2) {
      setError("Full Name must be at least 2 characters.");
      return;
    }

    if (!editEmail.trim() || !editEmail.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update member profile");
      }

      // Update in local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                fullName: editFullName.trim(),
                email: editEmail.trim(),
                phone: editPhone.trim() || null,
              }
            : u
        )
      );

      setSuccess(data.message || "Member updated successfully!");
      setTimeout(() => {
        handleCloseEdit();
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {impersonateError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center justify-between">
          <span>{impersonateError}</span>
          <button
            type="button"
            onClick={() => setImpersonateError(null)}
            className="text-red-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="overflow-x-auto card-seoralink border-[#1e293b]">
        <table className="w-full text-left font-mono-num text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[#94a3b8] bg-[#0b1120] text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4">Member ID</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Sponsor</th>
              <th className="py-3 px-4">Rank Tier</th>
              <th className="py-3 px-4">Directs</th>
              <th className="py-3 px-4">Fund Wallet</th>
              <th className="py-3 px-4">Commission Wallet</th>
              <th className="py-3 px-4">Pool Wallet</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-[#94a3b8] text-xs">
                  No members found matching your search.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#0f172a]/40 transition-colors">
                  {/* 1st Column: Member ID with Switch to User Portal button */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#d4af37] font-mono">{u.customId}</span>
                      <button
                        type="button"
                        onClick={() => handleImpersonate(u)}
                        disabled={impersonatingId === u.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title={`Open User Portal as ${u.fullName} (${u.customId})`}
                      >
                        {impersonatingId === u.id ? (
                          <RefreshCw size={10} className="animate-spin" />
                        ) : (
                          <ExternalLink size={10} />
                        )}
                        <span>Portal</span>
                      </button>
                    </div>
                  </td>

                {/* Full Name, Email, Phone with Edit Button */}
                <td className="py-3 px-4 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-sans text-xs">{u.fullName}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(u)}
                      className="p-1 rounded-md text-[#94a3b8] hover:text-[#d4af37] hover:bg-[#1e293b] transition-colors"
                      title="Edit Name, Email & Phone"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                  <div className="text-[10px] text-[#94a3b8] truncate max-w-[200px] mt-0.5">
                    {u.email}
                  </div>
                  {u.phone ? (
                    <div className="text-[10px] text-[#38bdf8] flex items-center gap-1 mt-0.5 font-mono">
                      <Phone size={9} />
                      <span>{u.phone}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#64748b] italic mt-0.5">No phone</div>
                  )}
                </td>

                <td className="py-3 px-4 text-[#cbd5e1]">
                  {u.sponsor ? (
                    <div>
                      <span className="font-bold text-[#38bdf8]">{u.sponsor.customId}</span>
                      <span className="text-[10px] text-[#94a3b8] block">{u.sponsor.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-[#64748b]">Genesis / Root</span>
                  )}
                </td>

                <td className="py-3 px-4 text-[#38bdf8] font-bold">
                  T{u.currentTier} ({TIER_NAMES[u.currentTier]})
                </td>

                <td className="py-3 px-4 font-bold text-white">{u.directCount}</td>

                {/* Fund Wallet */}
                <td className="py-3 px-4 font-bold text-[#38bdf8]">
                  ${parseFloat(u.fundBalance).toFixed(2)}
                </td>

                {/* Commission Wallet (Replaces single Income Wallet) */}
                <td className="py-3 px-4 font-bold text-[#10b981]">
                  <div className="flex items-center gap-1">
                    <span>${parseFloat(u.incomeBalance).toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-[#94a3b8] font-normal block">Affiliate / Direct</span>
                </td>

                {/* Rank Pool Wallet (New separate pool wallet column) */}
                <td className="py-3 px-4 font-bold text-[#d4af37]">
                  <div className="flex items-center gap-1">
                    <Trophy size={11} className="text-[#d4af37]" />
                    <span>${u.poolBalance.toLocaleString()}</span>
                  </div>
                  <span className="text-[9px] text-[#94a3b8] font-normal block">
                    {u.currentTier > 0 ? `Tier ${u.currentTier} Pool` : "Entry"}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : u.status === "BLOCKED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {u.status}
                    </span>

                    {/* Interactive Admin Actions */}
                    {u.status === "INACTIVE" && (
                      <button
                        onClick={() => openStatusModal(u, "ACTIVATE")}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Activate Member Account"
                      >
                        <Zap size={10} />
                        <span>Activate</span>
                      </button>
                    )}

                    {u.status === "ACTIVE" && u.customId !== "SL000001" && (
                      <button
                        onClick={() => openStatusModal(u, "BLOCK")}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/25 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Block Member Account"
                      >
                        <Ban size={10} />
                        <span>Block</span>
                      </button>
                    )}

                    {u.status === "BLOCKED" && (
                      <button
                        onClick={() => openStatusModal(u, "UNBLOCK")}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Unblock Member Account"
                      >
                        <CheckCircle2 size={10} />
                        <span>Unblock</span>
                      </button>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4 text-[#94a3b8] text-[11px] whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>

                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/simulator?target=${u.customId}`}
                    className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 font-sans font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Zap size={12} />
                    <span>Boost / Directs</span>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

      {/* ================= EDIT MEMBER PROFILE MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-[#0b1120] border border-[#d4af37]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={handleCloseEdit}
              className="absolute right-4 top-4 text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-[#1e293b]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-3">
              <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                <Pencil size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Edit Member Details</h3>
                <p className="text-[11px] text-[#94a3b8] flex items-center gap-1.5 mt-0.5">
                  <span>Member ID:</span>
                  <strong className="text-[#d4af37] font-mono">{editingUser.customId}</strong>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-[#d4af37]" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={13} className="text-[#38bdf8]" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="member@domain.com"
                  className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-400" />
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 98765 43210 (optional)"
                  className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-lg text-xs text-[#94a3b8] hover:text-white border border-[#1e293b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  {loading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Action Confirmation Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#070a14]">
              <div className="flex items-center gap-2">
                {statusModal.action === "ACTIVATE" && <Zap size={18} className="text-emerald-400" />}
                {statusModal.action === "BLOCK" && <Ban size={18} className="text-rose-500" />}
                {statusModal.action === "UNBLOCK" && <CheckCircle2 size={18} className="text-amber-400" />}
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {statusModal.action === "ACTIVATE" && "Activate Member Account"}
                  {statusModal.action === "BLOCK" && "Block Member Account"}
                  {statusModal.action === "UNBLOCK" && "Unblock Member Account"}
                </h3>
              </div>
              <button
                onClick={() => setStatusModal(null)}
                className="text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {statusError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{statusError}</span>
                </div>
              )}

              {statusSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{statusSuccess}</span>
                </div>
              )}

              <div className="bg-[#070a14] border border-[#1e293b] rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#1e293b]/60">
                  <span className="text-[#94a3b8]">Member ID:</span>
                  <span className="font-mono font-bold text-white">{statusModal.user.customId}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#1e293b]/60">
                  <span className="text-[#94a3b8]">Full Name:</span>
                  <span className="font-bold text-white">{statusModal.user.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#1e293b]/60">
                  <span className="text-[#94a3b8]">Current Status:</span>
                  <span className="font-bold text-amber-400">{statusModal.user.status}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#94a3b8]">Action to Apply:</span>
                  <span
                    className={`font-bold uppercase ${
                      statusModal.action === "ACTIVATE"
                        ? "text-emerald-400"
                        : statusModal.action === "BLOCK"
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {statusModal.action}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#94a3b8] leading-relaxed">
                {statusModal.action === "ACTIVATE" &&
                  "This will activate the member account in the SEORALINK network, grant any missing micro-entry balance if needed, position them into the Tier 0 (Junior) queue, and award 5% direct sponsor bonus to their mentor."}
                {statusModal.action === "BLOCK" &&
                  "Are you sure you want to block this member? They will be immediately blocked from logging in, requesting withdrawals, or participating in the network."}
                {statusModal.action === "UNBLOCK" &&
                  "This will unblock the member and restore their status to ACTIVE so they can log in and participate in the network again."}
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
                <button
                  type="button"
                  disabled={statusLoading}
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2 rounded-lg text-xs text-[#94a3b8] hover:text-white border border-[#1e293b] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={statusLoading}
                  onClick={handleConfirmStatusChange}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    statusModal.action === "ACTIVATE"
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : statusModal.action === "BLOCK"
                      ? "bg-rose-600 text-white hover:bg-rose-500"
                      : "bg-amber-500 text-black hover:bg-amber-400"
                  }`}
                >
                  {statusLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {statusModal.action === "ACTIVATE" && <Zap size={14} />}
                      {statusModal.action === "BLOCK" && <Ban size={14} />}
                      {statusModal.action === "UNBLOCK" && <CheckCircle2 size={14} />}
                      <span>
                        {statusModal.action === "ACTIVATE" && "Confirm Activate"}
                        {statusModal.action === "BLOCK" && "Confirm Block"}
                        {statusModal.action === "UNBLOCK" && "Confirm Unblock"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
