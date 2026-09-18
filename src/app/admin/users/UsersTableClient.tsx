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
  Wallet
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
                <td className="py-3 px-4 font-bold text-[#d4af37]">{u.customId}</td>

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
    </div>
  );
}
