import React from "react";
import Link from "next/link";
import { getSession, isAdmin } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
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
  if (!session || !isAdmin(session.role)) {
    redirect("/adminlogin");
  }

  const { q } = await searchParams;
  const searchQuery = q?.trim();

  // Branch isolation: Each admin must ONLY see their own branch members + their own account.
  // Cross-admins, other parallel branches, and Super Root Admin are strictly invisible.
  const branchFilter = [
    { adminId: session.userId },
    { id: session.userId },
  ];

  const whereClause: any = {
    customId: { not: "SUPERROOT" },
    NOT: { role: "SUPER_ROOT_ADMIN" },
    OR: branchFilter,
  };

  if (searchQuery) {
    const searchConditions = [
      { customId: { contains: searchQuery, mode: "insensitive" } },
      { fullName: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
      { phone: { contains: searchQuery, mode: "insensitive" } },
    ];
    whereClause.AND = [
      { OR: branchFilter },
      { OR: searchConditions },
    ];
    delete whereClause.OR;
  }

  const [users, rankWithdrawals] = await withDbRetry(async () => {
    return await Promise.all([
      db.user.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customId: true,
          fullName: true,
          email: true,
          phone: true,
          usdtAddress: true,
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
      }),
      db.withdrawalRequest.findMany({
        where: {
          OR: [
            { feePercent: 20 },
            { adminNote: { contains: "CASHOUT" } },
            { adminNote: { contains: "RANK_EXIT" } },
            { amount: 20480 },
          ],
          status: { not: "REJECTED" },
        },
        select: { userId: true },
      }),
    ]);
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
      fullName: u.fullName || "Member",
      email: u.email,
      phone: u.phone,
      usdtAddress: u.usdtAddress || "",
      status: u.status,
      isSystemExited: hasWithdrawn,
      currentTier: u.currentTier || 0,
      directCount: u.directCount || 0,
      fundBalance: (u.fundBalance ?? 0).toString(),
      incomeBalance: (u.incomeBalance ?? 0).toString(),
      poolBalance,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
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
