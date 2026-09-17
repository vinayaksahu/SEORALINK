import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES } from "@/lib/constants";
import { Users, Search, Zap, UserPlus } from "lucide-react";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const { q } = await searchParams;
  const searchQuery = q?.trim();

  const whereClause: any = {};
  if (searchQuery) {
    whereClause.OR = [
      { customId: { contains: searchQuery, mode: "insensitive" } },
      { fullName: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const users = await db.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customId: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      currentTier: true,
      directCount: true,
      fundBalance: true,
      incomeBalance: true,
      totalEarned: true,
      createdAt: true,
      sponsor: {
        select: {
          customId: true,
          fullName: true,
        },
      },
    },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-red-400" />
            Member Directory ({users.length})
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Search, audit balances, inspect rank tier advancement, and review sponsorship relations.
          </p>
        </div>

        <Link
          href="/admin/simulator"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Zap size={16} />
          <span>Dummy Users & Rank Booster</span>
        </Link>
      </div>

      {/* Search Input */}
      <form method="GET" className="max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery || ""}
            placeholder="Search by ID, Name, or Email..."
            className="w-full bg-[#0d1424] border border-[#1e293b] text-white rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
          />
        </div>
        <button type="submit" className="btn-primary px-4 py-2 text-xs font-bold cursor-pointer">
          Search
        </button>
      </form>

      {/* Users Table */}
      <div className="overflow-x-auto card-seoralink border-[#1e293b]">
        <table className="w-full text-left font-mono-num text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[#94a3b8] bg-[#0b1120] text-[10px] uppercase">
              <th className="py-3 px-4">Member ID</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Sponsor</th>
              <th className="py-3 px-4">Rank Tier</th>
              <th className="py-3 px-4">Directs</th>
              <th className="py-3 px-4">Fund Wallet</th>
              <th className="py-3 px-4">Income Wallet</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#0f172a]/40">
                <td className="py-3 px-4 font-bold text-[#d4af37]">{u.customId}</td>
                <td className="py-3 px-4">
                  <div className="font-bold text-white font-sans">{u.fullName}</div>
                  <div className="text-[10px] text-[#94a3b8]">{u.email}</div>
                </td>
                <td className="py-3 px-4 text-[#cbd5e1]">
                  {u.sponsor ? (
                    <div>
                      <span className="font-bold text-[#38bdf8]">{u.sponsor.customId}</span>
                      <span className="text-[10px] text-[#94a3b8] block">{u.sponsor.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-[#64748b]">Genesis / Root</span>
                  )}
                </td>
                <td className="py-3 px-4 text-[#38bdf8] font-bold">
                  T{u.currentTier} ({TIER_NAMES[u.currentTier]})
                </td>
                <td className="py-3 px-4 font-bold text-white">{u.directCount}</td>
                <td className="py-3 px-4 font-bold text-[#38bdf8]">
                  ${parseFloat(u.fundBalance.toString()).toFixed(2)}
                </td>
                <td className="py-3 px-4 font-bold text-[#10b981]">
                  ${parseFloat(u.incomeBalance.toString()).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#94a3b8] text-[11px]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/simulator?target=${u.customId}`}
                    className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 font-sans font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Zap size={12} />
                    <span>Boost / Directs</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
