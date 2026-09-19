'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TIER_NAMES } from "@/lib/constants";
import {
  User,
  Mail,
  Phone,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trophy,
  Copy,
  Check,
  RefreshCw,
  Share2,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface ProfileFormClientProps {
  user: {
    id: string;
    customId: string;
    fullName: string;
    email: string;
    phone: string | null;
    usdtAddress: string | null;
    usdtNetwork: string | null;
    status: string;
    isSystemExited?: boolean;
    currentTier: number;
    directCount: number;
    fundBalance: string;
    incomeBalance: string;
    createdAt: string;
    sponsor?: {
      customId: string;
      fullName: string;
      email?: string;
    } | null;
  };
}

export default function ProfileFormClient({ user: initialUser }: ProfileFormClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);

  // Form State
  const [fullName, setFullName] = useState(initialUser.fullName || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [usdtAddress, setUsdtAddress] = useState(initialUser.usdtAddress || "");
  const [usdtNetwork, setUsdtNetwork] = useState(initialUser.usdtNetwork || "USDT_BEP20");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://seoralink.com";
  const referralLink = `${appUrl}/register?ref=${user.customId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUsdtAddress(text.trim());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Full Name must be at least 2 characters long.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (usdtAddress.trim() && usdtAddress.trim().length < 10) {
      setError("Please provide a valid USDT wallet address (min 10 characters).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          usdtAddress: usdtAddress.trim() || null,
          usdtNetwork,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile settings.");
      }

      setUser((prev) => ({
        ...prev,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        usdtAddress: usdtAddress.trim() || null,
        usdtNetwork,
      }));

      setSuccess(data.message || "Profile updated successfully!");
      router.refresh();
      setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err: any) {
      setError(err.message || "Something went wrong while saving changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header Profile Banner */}
      <div className="card-seoralink p-6 relative overflow-hidden bg-gradient-to-r from-[#0b1329] via-[#0d1c3a] to-[#0b1329] border border-[#1e3a5f] shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-[#f3e5ab] text-black font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-[#d4af37]/20 border-2 border-white/20 shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {user.fullName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    user.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {user.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center gap-1">
                  <Trophy size={11} />
                  <span>
                    T{user.currentTier} ({TIER_NAMES[user.currentTier] || "Junior"})
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#94a3b8] font-mono-num">
                <span>
                  Member ID: <strong className="text-[#d4af37] font-mono">{user.customId}</strong>
                </span>
                <span>&bull;</span>
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                {user.sponsor && (
                  <>
                    <span>&bull;</span>
                    <span>
                      Sponsor:{" "}
                      <strong className="text-[#38bdf8]">{user.sponsor.customId}</strong> (
                      {user.sponsor.fullName})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Balance Preview */}
          <div className="flex items-center gap-3 bg-[#070a14]/60 p-3 rounded-xl border border-[#1e293b] self-stretch sm:self-auto justify-around sm:justify-end">
            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase text-[#94a3b8] font-mono-num">Fund Wallet</div>
              <div className="text-sm font-bold text-[#38bdf8] font-mono-num">
                ${parseFloat(user.fundBalance).toFixed(2)}
              </div>
            </div>
            <div className="h-6 w-px bg-[#1e293b]" />
            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase text-[#94a3b8] font-mono-num">Commission</div>
              <div className="text-sm font-bold text-[#10b981] font-mono-num">
                ${parseFloat(user.incomeBalance).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Feedback Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in-50">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in-50">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 2. Main Profile Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Editable Profile & USDT Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Personal Profile Details */}
            <div className="card-seoralink p-6 space-y-5 border-[#1e293b]">
              <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-3.5">
                <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Personal Information
                  </h2>
                  <p className="text-[11px] text-[#94a3b8]">
                    Update your full legal name, login email, and contact telephone number.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-[#d4af37]" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] transition-all"
                  />
                  <p className="text-[10px] text-[#64748b]">
                    Your display name across the SEORALINK community network.
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={13} className="text-[#38bdf8]" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@domain.com"
                    className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] transition-all"
                  />
                  <p className="text-[10px] text-[#64748b]">
                    Used for signing in and account recovery notifications.
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-emerald-400" />
                    <span>Phone Number</span>
                    <span className="text-[10px] text-[#64748b] font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] transition-all font-mono"
                  />
                  <p className="text-[10px] text-[#64748b]">
                    Direct phone or WhatsApp contact for sponsor &amp; support communication.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: USDT Withdrawal Wallet Settings */}
            <div className="card-seoralink p-6 space-y-5 border-[#1e293b] bg-gradient-to-b from-[#070d18] to-[#0b101b]">
              <div className="flex items-center gap-2.5 border-b border-[#1e293b] pb-3.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Wallet size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>USDT Payout Wallet</span>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                      Withdrawal Destination
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#94a3b8]">
                    Configure your official crypto address to receive withdrawals automatically.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Network Selection Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                    USDT Network Standard *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setUsdtNetwork("USDT_BEP20")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        usdtNetwork === "USDT_BEP20"
                          ? "bg-[#38bdf8]/15 border-[#38bdf8] text-white shadow-lg shadow-[#38bdf8]/10"
                          : "bg-[#070a14] border-[#1e293b] text-[#94a3b8] hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">USDT (BEP-20)</span>
                        <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-1.5 py-0.5 rounded font-bold">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-1">
                        BNB Smart Chain (Lowest gas fee &amp; instant confirmations)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUsdtNetwork("USDT_TRC20")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        usdtNetwork === "USDT_TRC20"
                          ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                          : "bg-[#070a14] border-[#1e293b] text-[#94a3b8] hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">USDT (TRC-20)</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                          Tron
                        </span>
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-1">
                        Tron TRC-20 high-speed transfer network
                      </p>
                    </button>
                  </div>
                </div>

                {/* USDT Address Input with Paste / Copy button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet size={13} className="text-emerald-400" />
                      <span>Your USDT Wallet Address</span>
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteAddress}
                      className="text-[11px] font-bold text-[#38bdf8] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Paste from Clipboard</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={usdtAddress}
                      onChange={(e) => setUsdtAddress(e.target.value)}
                      placeholder={
                        usdtNetwork === "USDT_BEP20"
                          ? "0x... (BEP-20 / EVM address)"
                          : "T... (Tron TRC-20 address)"
                      }
                      className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg pl-3.5 pr-20 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    {usdtAddress && (
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(usdtAddress);
                          setCopiedAddress(true);
                          setTimeout(() => setCopiedAddress(false), 2000);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[#1e293b] hover:bg-[#334155] text-[10px] font-bold text-[#cbd5e1] transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy saved address"
                      >
                        {copiedAddress ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        <span>{copiedAddress ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#94a3b8] leading-relaxed">
                    Please ensure this address supports <strong>{usdtNetwork}</strong>. Withdrawals from Commission Wallet and Rank Pool payouts will be dispatched here.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-between p-4 bg-[#0b1120] border border-[#1e293b] rounded-xl">
              <span className="text-xs text-[#94a3b8]">
                Changes take effect across your portal immediately upon saving.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-6 py-2.5 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Save Profile &amp; Wallet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Account Snapshot & Referral Tools */}
          <div className="space-y-6">
            {/* Account Metadata Card */}
            <div className="card-seoralink p-5 space-y-4 border-[#1e293b]">
              <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
                <ShieldCheck size={16} className="text-[#d4af37]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Account Credentials
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/60">
                  <span className="text-[#94a3b8]">Account ID:</span>
                  <span className="font-mono font-bold text-[#d4af37]">{user.customId}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/60">
                  <span className="text-[#94a3b8]">Current Rank:</span>
                  <span className="font-bold text-[#38bdf8]">
                    Tier {user.currentTier} ({TIER_NAMES[user.currentTier]})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/60">
                  <span className="text-[#94a3b8]">Direct Partners:</span>
                  <span className="font-bold text-white">{user.directCount} Active</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-[#1e293b]/60">
                  <span className="text-[#94a3b8]">Sponsor:</span>
                  {user.sponsor ? (
                    <div className="text-right">
                      <span className="font-bold text-[#38bdf8] block">{user.sponsor.customId}</span>
                      <span className="text-[10px] text-[#94a3b8]">{user.sponsor.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-[#64748b] italic">Root / Genesis</span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#94a3b8]">Account Standing:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      user.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Referral Share Quick Box */}
            <div className="card-seoralink p-5 space-y-3.5 border-[#1e293b] bg-gradient-to-b from-[#0f172a]/80 to-[#070a14]">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-[#38bdf8]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Your Referral Link
                </h3>
              </div>

              {user.isSystemExited ? (
                <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-center space-y-1">
                  <span className="text-xs font-bold text-purple-300 block">Referrals Disabled</span>
                  <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                    This account has concluded its Single-Exit protocol settlement and can no longer sponsor or refer new members.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Invite downline partners with your unique link to earn 5% direct commissions ($0.50) and unlock rank tiers.
                  </p>

                  <div className="bg-[#070a14] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#cbd5e1] truncate">
                      {referralLink}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 rounded bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-bold text-[11px] transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedLink ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
