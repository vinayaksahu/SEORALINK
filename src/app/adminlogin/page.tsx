'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Lock, Mail, ShieldAlert, ArrowRight, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, requireAdmin: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Admin authentication failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid administrative credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040711] flex items-center justify-center p-6 selection:bg-[#d4af37] selection:text-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center flex flex-col items-center space-y-2">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#d4af37] uppercase tracking-widest pt-2">
            <ShieldAlert size={14} /> Master Administration
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            Enterprise Control Portal
          </h2>
        </div>

        <div className="card-seoralink p-8 space-y-6 bg-[#0d1424]/95 border-red-500/30 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                Admin Email or User ID
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@seoralink.com"
                  className="w-full bg-[#0b1120] border border-red-500/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                Master Security Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b1120] border border-red-500/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? "Authenticating Master Key..." : "Authorize Admin Session"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#1e293b] text-xs text-[#64748b]">
            Restricted access. All connection attempts and IP addresses are audited.
          </div>
        </div>
      </div>
    </div>
  );
}
