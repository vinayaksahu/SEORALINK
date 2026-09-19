'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, Mail, User as UserIcon, Phone, Users, ArrowRight, AlertCircle, CheckCircle, Globe, ChevronDown, ShieldCheck } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [sponsorCode, setSponsorCode] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [checkingSponsor, setCheckingSponsor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Verification States
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/otp/status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.REGISTRATION !== undefined) {
          setOtpEnabled(data.settings.REGISTRATION);
        }
      })
      .catch(() => setOtpEnabled(true));
  }, []);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }
    setError("");
    setOtpSuccessMsg("");
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "REGISTRATION",
          email: email.trim(),
          fullName: fullName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification code");
      setOtpSent(true);
      setOtpCooldown(45);
      setOtpSuccessMsg(data.message || "Verification code sent to your email!");
      setTimeout(() => setOtpSuccessMsg(""), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to dispatch verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setSponsorCode(ref);
      verifySponsor(ref);
    }
  }, [searchParams]);

  const verifySponsor = async (code: string) => {
    if (!code || code.trim().length < 3) {
      setSponsorName("");
      return;
    }
    setCheckingSponsor(true);
    try {
      const res = await fetch(`/api/auth/verify-sponsor?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (res.ok && data.sponsor) {
        setSponsorName(data.sponsor.fullName);
        setError("");
      } else {
        setSponsorName("");
        if (data.error) {
          setError(data.error);
        }
      }
    } catch {
      setSponsorName("");
    } finally {
      setCheckingSponsor(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otpEnabled && (!otpCode || otpCode.trim().length !== 6)) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const fullPhone = phoneDigits.trim()
        ? `${selectedCountry.dialCode} ${phoneDigits.trim()}`
        : undefined;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone: fullPhone,
          password,
          sponsorCode: sponsorCode.trim(),
          otpCode: otpEnabled ? otpCode.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/member/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#040711] text-slate-900 dark:text-[#e2e8f0] flex items-center justify-center p-6 selection:bg-[#d4af37] selection:text-black relative">
      {/* Top Header Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle variant="segmented" size="xs" />
      </div>

      <div className="w-full max-w-lg space-y-8 my-8">
        <div className="text-center flex flex-col items-center space-y-2">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide pt-4">
            Join the SEORALINK Network
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
            Create your account to unlock the 12-tier doubling ladder and universal queue progression.
          </p>
        </div>

        <div className="card-seoralink p-8 space-y-6 bg-white dark:bg-[#0d1424]/95 border-slate-200 dark:border-[#d4af37]/35 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Sponsor Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center justify-between">
                <span>Sponsor Referral Code</span>
                {sponsorName && (
                  <span className="text-[#10b981] font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle size={12} /> {sponsorName}
                  </span>
                )}
              </label>
              <div className="relative">
                <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  required
                  value={sponsorCode}
                  onChange={(e) => {
                    setSponsorCode(e.target.value);
                    verifySponsor(e.target.value);
                  }}
                  placeholder="e.g. SL100000 or sponsor ID"
                  className="w-full bg-[#0b1120] border border-[#d4af37]/40 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alexander Vance"
                  className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Email Verification OTP (when enabled by Admin) */}
            {otpEnabled && (
              <div className="space-y-2 p-3.5 rounded-xl border border-[#38bdf8]/40 bg-[#071124]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#38bdf8]" />
                    <span>Email Verification Code *</span>
                  </label>
                  <button
                    type="button"
                    disabled={sendingOtp || otpCooldown > 0 || !email || !email.includes("@")}
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-[#38bdf8] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {sendingOtp
                      ? "Sending..."
                      : otpCooldown > 0
                      ? `Resend in ${otpCooldown}s`
                      : otpSent
                      ? "Resend Code"
                      : "Send OTP Code"}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-[#0b1120] border border-[#38bdf8]/40 text-white rounded-lg px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-[#38bdf8]"
                />
                {otpSuccessMsg && (
                  <p className="text-[11px] text-emerald-400 font-semibold">{otpSuccessMsg}</p>
                )}
                <p className="text-[10px] text-[#94a3b8]">
                  Click &apos;Send OTP Code&apos; to receive your verification code via Namecheap Private Email.
                </p>
              </div>
            )}

            {/* Country Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
                <span>Select Country</span>
                <span className="text-[11px] text-[#d4af37] font-semibold flex items-center gap-1.5">
                  <span className="text-sm leading-none">{selectedCountry.flag}</span>
                  <span className="font-mono">{selectedCountry.dialCode}</span>
                </span>
              </label>
              <div className="relative">
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = COUNTRIES.find((c) => c.code === e.target.value) || DEFAULT_COUNTRY;
                    setSelectedCountry(found);
                  }}
                  className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg pl-10 pr-10 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37] cursor-pointer appearance-none transition-colors hover:border-[#d4af37]/60"
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

            {/* Phone Number (Optional) with Auto-Selected Country Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider block">
                Phone Number (Optional)
              </label>
              <div className="relative flex items-center">
                {/* Auto-selected Country Dial Code Badge */}
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#151f33] border border-[#d4af37]/40 px-2.5 py-1.5 rounded-md text-xs font-bold text-[#d4af37] pointer-events-none select-none z-10">
                  <span className="text-sm leading-none">{selectedCountry.flag}</span>
                  <span className="font-mono tracking-tight">{selectedCountry.dialCode}</span>
                </div>
                <input
                  type="tel"
                  value={phoneDigits}
                  maxLength={18}
                  onChange={(e) => {
                    // Allow only digits, space, and hyphen
                    const cleaned = e.target.value.replace(/[^0-9\s-]/g, "");
                    setPhoneDigits(cleaned);
                  }}
                  placeholder="e.g. 10-1234-5678"
                  style={{ paddingLeft: `${selectedCountry.dialCode.length > 3 ? "94px" : "86px"}` }}
                  className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div className="text-[10.5px] text-[#94a3b8] pt-0.5">
                Code <strong className="text-[#d4af37]">{selectedCountry.dialCode}</strong> is auto-applied
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                Security Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Complete Registration"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#1e293b] text-xs text-[#94a3b8]">
            Already a member?{" "}
            <Link href="/login" className="text-[#d4af37] font-bold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#040711] flex items-center justify-center">
          <div className="text-[#d4af37] text-sm animate-pulse font-mono tracking-widest">
            LOADING REGISTRATION PORTAL...
          </div>
        </div>
      }
    >
      <RegisterForm />
    </React.Suspense>
  );
}
