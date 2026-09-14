'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Lock, Mail, User as UserIcon, Phone, Users, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [sponsorCode, setSponsorCode] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [checkingSponsor, setCheckingSponsor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      } else {
        setSponsorName("");
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
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          sponsorCode: sponsorCode.trim(),
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
    <div className="min-h-screen bg-[#040711] flex items-center justify-center p-6 selection:bg-[#d4af37] selection:text-black">
      <div className="w-full max-w-lg space-y-8 my-8">
        <div className="text-center flex flex-col items-center space-y-2">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <h2 className="text-2xl font-black text-white tracking-wide pt-4">
            Join the SEORALINK Network
          </h2>
          <p className="text-xs text-[#94a3b8]">
            Create your account to unlock the 12-tier doubling ladder and universal queue progression.
          </p>
        </div>

        <div className="card-seoralink p-8 space-y-6 bg-[#0d1424]/95 border-[#d4af37]/35 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
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

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+82 10-1234-5678"
                  className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
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
