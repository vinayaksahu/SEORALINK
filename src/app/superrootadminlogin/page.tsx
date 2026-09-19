'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SuperRootAdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, portal: "super_root" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Super Root Administrator authentication failed.");
      }

      router.push(data.redirectTo || "/superrootadmin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate Super Root credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#040711] text-slate-100 selection:bg-rose-500 selection:text-white font-sans">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link
          href="/"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md transition-colors"
        >
          &larr; Back to Portal
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-400 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 tracking-wider">
            <Terminal className="w-3.5 h-3.5" /> ROOT SECURITY LAYER
          </span>
          <ThemeToggle variant="compact" size="sm" showLabels={false} />
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/95 border border-rose-500/30 p-8 rounded-3xl relative z-10 shadow-2xl backdrop-blur-2xl mt-12 sm:mt-0">
        {/* Security Shield Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 via-slate-900 to-amber-500/20 border border-rose-500/40 p-1 mb-4 shadow-xl shadow-rose-500/10">
            <div className="w-full h-full rounded-xl bg-[#040711] flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            SEORALINK <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-400">Super Root</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-mono">
            Master Super Root Administrative Terminal
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-6 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
              Super Root Identifier
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Root Identifier (e.g. superrootadmin)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white text-sm outline-none transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Root Master Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter root master password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white text-sm outline-none transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 mt-6 transition disabled:opacity-50 tracking-wide cursor-pointer"
          >
            {loading ? "Authenticating Root..." : "Authenticate Root Access"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            CONFIDENTIAL &bull; AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
