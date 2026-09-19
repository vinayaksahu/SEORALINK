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
  Globe,
  ChevronDown,
  KeyRound,
  Shield,
  X,
} from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";

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

  const initialCountry = (() => {
    if (initialUser.phone) {
      const match = COUNTRIES.find((c) => initialUser.phone?.startsWith(c.dialCode));
      if (match) return match;
    }
    return DEFAULT_COUNTRY;
  })();

  const initialDigits = (() => {
    if (initialUser.phone) {
      const match = COUNTRIES.find((c) => initialUser.phone?.startsWith(c.dialCode));
      if (match) {
        return initialUser.phone.slice(match.dialCode.length).trim();
      }
      return initialUser.phone;
    }
    return "";
  })();

  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [phoneDigits, setPhoneDigits] = useState(initialDigits);
  const [usdtAddress, setUsdtAddress] = useState(initialUser.usdtAddress || "");
  const [usdtNetwork, setUsdtNetwork] = useState(initialUser.usdtNetwork || "USDT_BEP20");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Profile Update OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [pendingProfilePayload, setPendingProfilePayload] = useState<any>(null);

  React.useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

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

  const sendProfileOtp = async () => {
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "PROFILE_UPDATE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send profile verification code.");
      }
      setOtpCooldown(60);
    } catch (err: any) {
      setOtpError(err.message || "Failed to dispatch verification OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const executeProfileUpdate = async (payloadWithOtp: any) => {
    const res = await fetch("/api/member/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithOtp),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update profile settings.");
    }

    setUser((prev) => ({
      ...prev,
      fullName: payloadWithOtp.fullName,
      email: payloadWithOtp.email,
      phone: payloadWithOtp.phone,
      usdtAddress: payloadWithOtp.usdtAddress,
      usdtNetwork: payloadWithOtp.usdtNetwork,
    }));

    setSuccess(data.message || "Profile updated successfully!");
    router.refresh();
    setTimeout(() => {
      setSuccess("");
    }, 3500);
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

    if (usdtAddress.trim()) {
      const trimmed = usdtAddress.trim();
      if (!trimmed.startsWith("0x") || trimmed.length !== 42) {
        setError("Please enter a valid BNB Smart Chain (BEP-20) address starting with 0x (42 characters).");
        return;
      }
    }

    const fullPhone = phoneDigits.trim()
      ? `${selectedCountry.dialCode} ${phoneDigits.trim()}`
      : null;

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: fullPhone,
      usdtAddress: usdtAddress.trim() || null,
      usdtNetwork,
    };

    const isNameChanged = fullName.trim() !== (user.fullName || "");
    const isEmailChanged = email.trim().toLowerCase() !== (user.email || "").toLowerCase();
    const isPhoneChanged = (fullPhone || "") !== (user.phone || "");
    const isAddressChanged = (usdtAddress.trim() || "") !== (user.usdtAddress || "");
    const isSensitiveChanged = isNameChanged || isEmailChanged || isPhoneChanged || isAddressChanged;

    setLoading(true);

    try {
      if (isSensitiveChanged) {
        // Check if PROFILE_UPDATE OTP is enabled in system settings
        const statusRes = await fetch("/api/auth/otp/status?purpose=PROFILE_UPDATE");
        const statusData = await statusRes.json();

        if (statusData.enabled) {
          setPendingProfilePayload(payload);
          setShowOtpModal(true);
          setOtpCode("");
          setOtpError("");
          await sendProfileOtp();
          setLoading(false);
          return;
        }
      }

      // If OTP not required or disabled, proceed directly
      await executeProfileUpdate(payload);
    } catch (err: any) {
      setError(err.message || "Something went wrong while saving changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtpProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError("Please enter the 6-digit OTP verification code.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      await executeProfileUpdate({ ...pendingProfilePayload, otpCode: otpCode.trim() });
      setShowOtpModal(false);
      setPendingProfilePayload(null);
    } catch (err: any) {
      setOtpError(err.message);
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

                {/* Country Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe size={13} className="text-emerald-400" />
                      <span>Select Country</span>
                    </span>
                    <span className="text-[11px] text-[#d4af37] font-semibold flex items-center gap-1.5">
                      <span className="text-sm leading-none">{selectedCountry.flag}</span>
                      <span className="font-mono">{selectedCountry.dialCode}</span>
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const found = COUNTRIES.find((c) => c.code === e.target.value) || DEFAULT_COUNTRY;
                        setSelectedCountry(found);
                      }}
                      className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg px-3.5 pr-9 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] transition-all cursor-pointer appearance-none hover:border-[#d4af37]/40"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#0b1120] text-white py-1">
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-400" />
                      <span>Phone Number</span>
                      <span className="text-[10px] text-[#64748b] font-normal lowercase">(optional)</span>
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    {/* Auto-selected country dial code badge */}
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#151f33] border border-[#d4af37]/40 px-2.5 py-1.5 rounded-md text-xs font-bold text-[#d4af37] pointer-events-none select-none z-10">
                      <span className="text-sm leading-none">{selectedCountry.flag}</span>
                      <span className="font-mono tracking-tight">{selectedCountry.dialCode}</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneDigits}
                      maxLength={18}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9\s-]/g, "");
                        setPhoneDigits(cleaned);
                      }}
                      placeholder="e.g. 10-1234-5678"
                      style={{ paddingLeft: `${selectedCountry.dialCode.length > 3 ? "94px" : "86px"}` }}
                      className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg pr-4 py-2.5 text-xs focus:outline-none focus:border-[#d4af37] transition-all font-mono"
                    />
                  </div>
                  <div className="text-[10px] text-[#64748b] pt-0.5">
                    Country code <strong className="text-[#d4af37]">{selectedCountry.dialCode}</strong> is auto-applied.
                  </div>
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
                {/* Network Standard - Only BEP-20 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                      USDT Network Standard
                    </label>
                    <span className="text-[10px] text-[#38bdf8] font-mono font-bold">BEP-20 Only</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#38bdf8]/40 bg-[#0b1120] flex items-center justify-between shadow-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">USDT (BEP-20)</span>
                        <span className="text-[9px] bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-0.5 rounded-full font-bold border border-[#38bdf8]/30">
                          BNB Smart Chain (BSC)
                        </span>
                      </div>
                      <p className="text-[10px] text-[#94a3b8]">
                        Official network for all deposits and withdrawals (Lowest gas fees &amp; instant confirmations).
                      </p>
                    </div>
                  </div>
                </div>

                {/* USDT Address Input with Paste / Copy button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet size={13} className="text-emerald-400" />
                      <span>Your USDT Wallet Address (0x...)</span>
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
                      placeholder="0x... (BNB Smart Chain BEP-20 address)"
                      className="w-full bg-[#070a14] border border-[#1e293b] text-white rounded-lg pl-3.5 pr-20 py-2.5 text-xs font-mono focus:outline-none focus:border-[#38bdf8] transition-all"
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
                    Please ensure this address is on <strong>BNB Smart Chain (BEP-20)</strong>. Withdrawals from Commission Wallet and Rank Pool payouts will be dispatched here.
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

      {/* Profile Update OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e1726] border border-[#d4af37]/40 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowOtpModal(false);
                setPendingProfilePayload(null);
                setOtpError("");
              }}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Profile Security Authorization</h3>
                <p className="text-[11px] text-[#94a3b8]">Sensitive Information Verification</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b1120] border border-[#1e293b] space-y-1.5 text-xs text-[#94a3b8]">
              <p className="text-white font-semibold">
                You are updating sensitive account credentials (Name, Email, Phone, or USDT Payout Address).
              </p>
              <div className="pt-1 text-[#cbd5e1] leading-relaxed">
                For account safety, enter the 6-digit one-time passcode (OTP) dispatched to your current email:
              </div>
              <div className="flex items-center gap-1.5 text-[#38bdf8] font-bold text-xs pt-1">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
            </div>

            {otpError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmOtpProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
                  <span>6-Digit Verification Code</span>
                  <button
                    type="button"
                    onClick={sendProfileOtp}
                    disabled={otpCooldown > 0 || otpSending}
                    className="text-[11px] text-[#d4af37] hover:underline disabled:text-[#64748b] disabled:no-underline font-semibold flex items-center gap-1"
                  >
                    {otpSending && <RefreshCw size={12} className="animate-spin" />}
                    {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : "Resend code"}
                  </button>
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-[#0b1120] border border-[#d4af37]/40 text-white rounded-lg pl-10 pr-4 py-2.5 text-base font-mono-num font-extrabold tracking-widest text-center focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setPendingProfilePayload(null);
                    setOtpError("");
                  }}
                  className="py-2.5 rounded-lg border border-[#1e293b] text-[#94a3b8] hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="btn-primary py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & Save"}
                  {!loading && <CheckCircle2 size={14} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
