'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mail, Lock, KeyRound, ArrowRight, AlertCircle, CheckCircle, ShieldCheck, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState<"REQUEST_CODE" | "ENTER_NEW_PASSWORD">("REQUEST_CODE");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid registered email address.");
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "FORGOT_PASSWORD",
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch verification code");
      }

      setStep("ENTER_NEW_PASSWORD");
      setOtpCooldown(45);
      setSuccess("A 6-digit recovery code has been sent to your email!");
      setTimeout(() => setSuccess(""), 6000);
    } catch (err: any) {
      setError(err.message || "Something went wrong while sending code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otpCode: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess("Your password has been reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
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

      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center space-y-2">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide pt-2">
            Reset Your Password
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
            Authenticate using email verification to recover your member account.
          </p>
        </div>

        <div className="card-seoralink p-7 space-y-5 bg-white dark:bg-[#0d1424]/95 border-slate-200 dark:border-[#d4af37]/35 shadow-2xl rounded-2xl">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {step === "REQUEST_CODE" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-[#cbd5e1] uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-[#d4af37]/30 text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-[#94a3b8]">
                  We will dispatch a one-time 6-digit recovery code via Namecheap Private Email.
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {sendingOtp ? "Dispatching Code..." : "Send Verification Code"}
                {!sendingOtp && <ArrowRight size={14} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0b1325] border border-[#1e293b] flex items-center justify-between text-xs">
                <span className="text-[#94a3b8] text-[11px] truncate max-w-[200px]">
                  Sending code to: <strong className="text-white">{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep("REQUEST_CODE")}
                  className="text-[11px] text-[#38bdf8] font-bold hover:underline"
                >
                  Change Email
                </button>
              </div>

              {/* 6-Digit Code */}
              <div className="space-y-1.5 p-3.5 rounded-xl border border-[#38bdf8]/40 bg-[#071124]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#38bdf8]" />
                    <span>6-Digit Verification Code *</span>
                  </label>
                  <button
                    type="button"
                    disabled={sendingOtp || otpCooldown > 0}
                    onClick={() => handleSendCode()}
                    className="text-[11px] font-bold text-[#38bdf8] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {sendingOtp
                      ? "Sending..."
                      : otpCooldown > 0
                      ? `Resend in ${otpCooldown}s`
                      : "Resend Code"}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-[#0b1120] border border-[#38bdf8]/40 text-white rounded-lg px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-[#cbd5e1] uppercase tracking-wider">
                  New Security Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-[#d4af37]/30 text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-[#cbd5e1] uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-[#d4af37]/30 text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Updating Password..." : "Confirm & Reset Password"}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>
          )}

          <div className="text-center pt-3 border-t border-slate-200 dark:border-[#1e293b] text-xs text-slate-600 dark:text-[#94a3b8]">
            Remember your password?{" "}
            <Link href="/login" className="text-[#b8860b] dark:text-[#d4af37] font-bold hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
