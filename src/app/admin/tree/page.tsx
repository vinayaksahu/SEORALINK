import React from "react";
import { getSession, isAdmin } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import { redirect } from "next/navigation";
import TreeView from "../simulator/TreeView";
import { GitBranch, Users, GitCommit } from "lucide-react";

export default async function AdminTreePage() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/adminlogin");
  }

  const [totalUsersCount, activeQueuesCount] = await withDbRetry(async () => {
    return await Promise.all([
      db.user.count({
        where: {
          customId: { not: "SUPERROOT" },
          NOT: { role: "SUPER_ROOT_ADMIN" },
          OR: [{ adminId: session.userId }, { id: session.userId }],
        },
      }),
      db.queueEntry.count({
        where: {
          status: "WAITING",
          adminId: session.userId,
        },
      }),
    ]);
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-[#070a14] to-purple-950/30 border border-red-500/30 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <GitBranch size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
              Network Tree & Global Rank Upgrade Engine
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase">
                Tree View
              </span>
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1">
              Live genealogy tree explorer. Inspect downline structures, select any user to auto-boost ranks, inject direct referrals, or pump global Tripod queues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-[10px] text-[#94a3b8] uppercase font-bold">Network Users</div>
            <div className="text-base font-extrabold text-white">{totalUsersCount}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-[10px] text-[#94a3b8] uppercase font-bold">Waiting Queue Nodes</div>
            <div className="text-base font-extrabold text-sky-400">{activeQueuesCount}</div>
          </div>
        </div>
      </div>

      {/* Interactive Tree View */}
      <TreeView />
    </div>
  );
}
