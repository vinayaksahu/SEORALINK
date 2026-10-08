import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Zap, CheckCircle2, ArrowRight, LayoutDashboard, GitCommit } from "lucide-react";
import ActivateFormClient from "./ActivateFormClient";

export const dynamic = "force-dynamic";

export default async function MemberActivatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      customId: true,
      fullName: true,
      status: true,
      currentTier: true,
      fundBalance: true,
    },
  });

  if (!user) redirect("/login");

  const isActivated = user.status === "ACTIVE";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap size={20} className="text-[#d4af37]" />
          Account Activation &bull; $10 Micro-Entry
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Lock in your universal single-leg queue position and unlock 12 rank reward doubling tiers.
        </p>
      </div>

      {isActivated ? (
        <div className="card-seoralink p-8 space-y-6 bg-[#0d1424] border-emerald-500/40 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: ALREADY ACTIVE
            </div>
            <h3 className="text-xl font-bold text-white">Your Account is Already Active!</h3>
            <p className="text-xs text-[#94a3b8] max-w-md mx-auto leading-relaxed">
              Your $10 Micro-Entry has been successfully activated. You are currently active in the universal single-leg queue (Tier {user.currentTier}). No further activation is required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-2 text-left bg-[#070a14] p-4 rounded-xl border border-[#1e293b]">
            <div>
              <div className="text-[10px] text-[#94a3b8] uppercase font-mono-num">Current Rank</div>
              <div className="text-sm font-bold text-[#d4af37] font-mono-num mt-0.5">Tier {user.currentTier}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#94a3b8] uppercase font-mono-num">Member ID</div>
              <div className="text-sm font-bold text-white font-mono-num mt-0.5">{user.customId}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/member/dashboard"
              className="btn-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={14} /> Go to Dashboard
            </Link>
            <Link
              href="/member/queue"
              className="btn-secondary w-full sm:w-auto px-6 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 border-[#1e293b]"
            >
              <GitCommit size={14} /> View Tripod Queue <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <ActivateFormClient
          initialUser={{
            id: user.id,
            customId: user.customId,
            fullName: user.fullName,
            status: user.status,
            currentTier: user.currentTier,
            fundBalance: parseFloat(user.fundBalance?.toString() || "0"),
          }}
        />
      )}
    </div>
  );
}
