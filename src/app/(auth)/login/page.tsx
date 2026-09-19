'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Email or Custom ID (e.g. SL108420)
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/member/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
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

      <div className="w-full max-w-md space-y-8">
        <div className="text-center flex flex-col items-center space-y-2">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide pt-4">
            Member Portal Sign In
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
            Access your SEORALINK wallet, queue position, and team earnings.
          </p>
        </div>

        <div className="card-seoralink p-8 space-y-6 bg-white dark:bg-[#0d1424]/95 border-slate-200 dark:border-[#d4af37]/35 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-[#cbd5e1] uppercase tracking-wider">
                Email or Member ID
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. member@seoralink.com or SL108420"
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-[#d4af37]/30 text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-[#cbd5e1] uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-[#b8860b] dark:text-[#d4af37] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0b1120] border border-slate-300 dark:border-[#d4af37]/30 text-slate-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verifying..." : "Sign In to Dashboard"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-200 dark:border-[#1e293b] text-xs text-slate-600 dark:text-[#94a3b8]">
            Don't have a member account?{" "}
            <Link href="/register" className="text-[#b8860b] dark:text-[#d4af37] font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
