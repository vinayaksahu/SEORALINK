import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES, TIER_VALUES } from "@/lib/constants";
import { Users, Search, Zap } from "lucide-react";
import UsersTableClient from "./UsersTableClient";

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
      { phone: { contains: searchQuery, mode: "insensitive" } },
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

  // Check rank pool cashouts for active users
  const rankWithdrawals = await db.withdrawalRequest.findMany({
    where: {
      adminNote: { contains: "CASHOUT" },
      status: { not: "REJECTED" },
    },
    select: { userId: true },
  });
  const rankWithdrawnUserIds = new Set(rankWithdrawals.map((w) => w.userId));

  const mappedUsers = users.map((u) => {
    const hasWithdrawn = rankWithdrawnUserIds.has(u.id);
    const poolBalance =
      u.status === "ACTIVE" && !hasWithdrawn && u.currentTier > 0
        ? TIER_VALUES[u.currentTier] || 0
        : 0;

    return {
      id: u.id,
      customId: u.customId,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      currentTier: u.currentTier,
      directCount: u.directCount,
      fundBalance: u.fundBalance.toString(),
      incomeBalance: u.incomeBalance.toString(),
      poolBalance,
      createdAt: u.createdAt.toISOString(),
      sponsor: u.sponsor
        ? {
            customId: u.sponsor.customId,
            fullName: u.sponsor.fullName,
          }
        : null,
    };
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
            placeholder="Search by ID, Name, Email, Phone..."
            className="w-full bg-[#0d1424] border border-[#1e293b] text-white rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#d4af37]"
          />
        </div>
        <button type="submit" className="btn-primary px-4 py-2 text-xs font-bold cursor-pointer">
          Search
        </button>
      </form>

      {/* Users Interactive Table */}
      <UsersTableClient initialUsers={mappedUsers} />
    </div>
  );
}
