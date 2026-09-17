import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES } from "@/lib/constants";
import { Users, UserCheck, ArrowUpRight } from "lucide-react";

export default async function MemberTeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      directs: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customId: true,
          fullName: true,
          email: true,
          status: true,
          currentTier: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  const activeDirectsCount = user.directs.filter((d) => d.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users size={20} className="text-[#a855f7]" />
          Team Network &bull; Frontline Sponsoring
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Monitor your personally sponsored direct mentees and your 5% upline override revenue stream.
        </p>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-seoralink p-5 flex flex-col justify-between border-[#a855f7]/30">
          <span className="text-xs font-mono-num uppercase text-[#94a3b8]">Active Direct Mentees</span>
          <div className="text-3xl font-mono-num font-bold text-white my-2">
            {activeDirectsCount} <span className="text-xs text-[#94a3b8] font-normal">/ 6 Directs</span>
          </div>
          <span className="text-[10px] text-[#10b981]">
            Earned ${(activeDirectsCount * 0.5).toFixed(2)} USDT instant cash
          </span>
        </div>

        <div className="card-seoralink p-5 flex flex-col justify-between border-[#d4af37]/30">
          <span className="text-xs font-mono-num uppercase text-[#94a3b8]">Max Cumulative Override</span>
          <div className="text-3xl font-mono-num font-bold text-[#d4af37] my-2">
            ${(activeDirectsCount * 2047.5).toLocaleString()} <span className="text-xs font-normal text-[#94a3b8]">USDT</span>
          </div>
          <span className="text-[10px] text-[#94a3b8]">
            Full 12-tier cycle completion value
          </span>
        </div>

        <div className="card-seoralink p-5 flex flex-col justify-between border-[#38bdf8]/30">
          <span className="text-xs font-mono-num uppercase text-[#94a3b8]">Qualification Status</span>
          <div className="text-2xl font-mono-num font-bold text-[#38bdf8] my-2">
            {user.directCount >= 6 ? "Pinnacle Unlocked" : `${6 - user.directCount} to Ultima`}
          </div>
          <span className="text-[10px] text-[#94a3b8]">
            {user.directCount >= 6 ? "Eligible for all 12 tiers" : "Cumulative requirement"}
          </span>
        </div>
      </div>

      {/* Protocol Mentorship Policy Callout */}
      <div className="card-seoralink p-4 border-[#10b981]/30 bg-[#061814]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="text-[#94a3b8]">
          <strong className="text-white">5% Mentorship Override Rules:</strong> Direct sponsor overrides ($0.50 up to $1,024.00 per tier, max $2,047.50 cumulative per mentee) credit instantly to your Commission Wallet whenever active mentees advance. Commission withdrawals carry only a flat 10% fee and never affect your account status!
        </div>
        <div className="px-2.5 py-1 rounded bg-[#10b981]/20 text-[#10b981] font-mono-num font-bold text-[11px] whitespace-nowrap">
          10% Flat Cashout Fee
        </div>
      </div>

      {/* Direct Referrals Table */}
      <div className="card-seoralink p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <UserCheck size={16} className="text-[#10b981]" />
          Personally Sponsored Frontline ({user.directs.length})
        </h3>

        {user.directs.length === 0 ? (
          <div className="text-center py-12 text-[#94a3b8] text-xs border border-dashed border-[#1e293b] rounded-xl">
            No direct referrals yet. Share your referral link from the dashboard to start building your team!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-num text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] text-[#94a3b8] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Rank Level</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50 text-[#cbd5e1]">
                {user.directs.map((d) => (
                  <tr key={d.id} className="hover:bg-[#0f172a]/30">
                    <td className="py-2.5 px-3 font-bold text-[#d4af37]">{d.customId}</td>
                    <td className="py-2.5 px-3 text-white font-sans">{d.fullName}</td>
                    <td className="py-2.5 px-3 text-[#38bdf8]">
                      Tier {d.currentTier} &bull; {TIER_NAMES[d.currentTier]}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : d.status === "BLOCKED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}>
                        {d.status === "BLOCKED" ? "RETIRED (EXIT)" : d.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#94a3b8]">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
