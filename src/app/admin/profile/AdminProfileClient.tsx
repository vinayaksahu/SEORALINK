'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  KeyRound,
  RefreshCw,
  X,
  ChevronDown,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";

interface AdminProfileClientProps {
  admin: {
    id: string;
    customId: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    createdAt: string;
    totalMembers: number;
    activeMembers: number;
  };
}

export default function AdminProfileClient({ admin: initialAdmin }: AdminProfileClientProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState(initialAdmin);

  // Form State
  const [fullName, setFullName] = useState(initialAdmin.fullName || "");
  const [email, setEmail] = useState(initialAdmin.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Country & Phone
  const initialCountry = (() => {
    if (initialAdmin.phone) {
      const match = COUNTRIES.find((c) => initialAdmin.phone?.startsWith(c.dialCode));
      if (match) return match;
    }
    return DEFAULT_COUNTRY;
  })();

  const initialDigits = (() => {
    if (initialAdmin.phone) {
      const match = COUNTRIES.find((c) => initialAdmin.phone?.startsWith(c.dialCode));
      if (match) {
        return initialAdmin.phone.slice(match.dialCode.length).trim();
      }
      return initialAdmin.phone;
    }
    return "";
  })();

  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [phoneDigits, setPhoneDigits] = useState(initialDigits);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(admin.customId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const sendProfileOtp = async (): Promise<{ success: boolean; bypassed?: boolean }> => {
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
      if (data.bypassed) {
        return { success: true, bypassed: true };
      }
      setOtpCooldown(60);
      return { success: true, bypassed: false };
    } catch (err: any) {
      setOtpError(err.message || "Failed to dispatch verification OTP.");
      throw err;
    } finally {
      setOtpSending(false);
    }
  };

  const executeProfileUpdate = async (payloadWithOtp: any) => {
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithOtp),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update administrative profile.");
    }

    setAdmin((prev) => ({
      ...prev,
      fullName: payloadWithOtp.fullName,
      email: payloadWithOtp.email,
      phone: payloadWithOtp.phone,
    }));

    setNewPassword("");
    setConfirmPassword("");
    setSuccess(data.message || "Admin profile updated successfully!");
    router.refresh();
    setTimeout(() => {
      setSuccess("");
    }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Admin Full Name must be at least 2 characters long.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid administrative email address.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirmation password do not match.");
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
      newPassword: newPassword.trim() || undefined,
    };

    const isNameChanged = fullName.trim() !== (admin.fullName || "");
    const isEmailChanged = email.trim().toLowerCase() !== (admin.email || "").toLowerCase();
    const isPhoneChanged = (fullPhone || "") !== (admin.phone || "");
    const isPasswordChanged = Boolean(newPassword);

    const isSensitiveChanged = isNameChanged || isEmailChanged || isPhoneChanged || isPasswordChanged;

    if (!isSensitiveChanged) {
      setSuccess("No changes detected.");
      return;
    }

    setLoading(true);
    try {
      // Check if OTP is enabled for profile updates
      const otpStatusRes = await fetch("/api/auth/otp/status?purpose=PROFILE_UPDATE");
      const otpStatus = await otpStatusRes.json();
      const isOtpRequired = otpStatus?.enabled !== false && otpStatus?.settings?.PROFILE_UPDATE !== false;

      if (isOtpRequired) {
        setPendingPayload(payload);
        setOtpCode("");
        setOtpError("");
        const otpResult = await sendProfileOtp();
        if (otpResult?.bypassed) {
          await executeProfileUpdate(payload);
          return;
        }
        setShowOtpModal(true);
      } else {
        await executeProfileUpdate(payload);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate profile update.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      await executeProfileUpdate({
        ...pendingPayload,
        otpCode: otpCode.trim(),
      });
      setShowOtpModal(false);
      setPendingPayload(null);
      setOtpCode("");
    } catch (err: any) {
      setOtpError(err.message || "Verification code rejected. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-[#d4af37] shrink-0 shadow-lg">
              <Building2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-wide">
                  {admin.fullName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {admin.role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {admin.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Admin ID: <strong className="text-slate-900 dark:text-amber-400">{admin.customId}</strong> &bull; Branch Size: {admin.totalMembers} Members ({admin.activeMembers} Active)
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyId}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer self-start sm:self-auto"
          >
            {copiedId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copiedId ? "ID Copied!" : "Copy Admin ID"}</span>
          </button>
        </div>
      </div>

      {/* Profile Edit Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500 dark:text-[#d4af37]" />
            Administrative Account Credentials &amp; Contact Info
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Updating your administrative details or password is secure and protected by Email OTP verification.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Custom ID (Read-only) */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Admin Custom ID (Locked)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={admin.customId}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Assigned system identifier for your parallel administration branch.
              </p>
            </div>

            {/* Admin Full Name */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Administrator Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Primary Branch Admin"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-[#d4af37] transition"
                />
                <User size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Email */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Official Admin Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@seoralink.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-[#d4af37] transition"
                />
                <Mail size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Used for admin login and receiving security verification OTP codes.
              </p>
            </div>

            {/* Admin Phone */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Administrative Phone (Optional)
              </label>
              <div className="flex gap-2">
                <div className="relative w-32 shrink-0">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const c = COUNTRIES.find((x) => x.code === e.target.value);
                      if (c) setSelectedCountry(c);
                    }}
                    className="w-full appearance-none px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-[#d4af37] transition font-mono pr-8"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={phoneDigits}
                    onChange={(e) => setPhoneDigits(e.target.value)}
                    placeholder="50 123 4567"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-[#d4af37] transition"
                  />
                  <Phone size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          {/* Password Reset Section Card */}
          <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <KeyRound size={15} className="text-amber-500" />
                <span>Security &amp; Password Reset</span>
              </h4>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 font-bold">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter a new password below to reset your administrative credentials. Leave both fields blank if you wish to keep your existing password.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-500" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-[#d4af37] transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock size={13} className="text-amber-500" />
                  <span>Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-[#d4af37] transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Minimum 6 characters. If OTP verification is enabled, a security code will be sent to your email to authorize the password reset.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 dark:from-[#d4af37] dark:to-[#b89628] text-black font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading && <RefreshCw size={14} className="animate-spin" />}
              <span>{loading ? "Processing..." : "Save Profile Changes"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={22} className="text-amber-500 dark:text-[#d4af37]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Security OTP Verification
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setPendingPayload(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <p className="font-bold">Authorization Required</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                A 6-digit administrative verification code has been dispatched to:
              </p>
              <p className="font-mono font-bold text-amber-700 dark:text-amber-400">{admin.email}</p>
            </div>

            {otpError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndSubmitOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit Email OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-mono text-[11px]">
                  {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : "Didn't receive code?"}
                </span>
                <button
                  type="button"
                  disabled={otpCooldown > 0 || otpSending}
                  onClick={sendProfileOtp}
                  className="font-bold text-amber-600 dark:text-[#d4af37] hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  {otpSending ? "Sending..." : "Resend Code"}
                </button>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setPendingPayload(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 dark:from-[#d4af37] dark:to-[#b89628] text-black font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {loading ? "Verifying..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
