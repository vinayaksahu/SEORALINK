import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SimulatorClient from "./SimulatorClient";
import { Bot, Sparkles, ShieldAlert } from "lucide-react";

export default async function AdminSimulatorPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const { target } = await searchParams;

  // Fetch recent active users for quick-select dropdown
  const recentUsers = await db.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customId: true,
      fullName: true,
      email: true,
      currentTier: true,
      directCount: true,
      role: true,
    },
    take: 30,
  });

  const totalUsersCount = await db.user.count();
  const activeQueuesCount = await db.queueEntry.count({
    where: { status: "WAITING" },
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-[#070a14] to-purple-950/30 border border-red-500/30 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <Bot size={24} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                Simulated Users & Rank Upgrade Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase">
                  Admin Tool
                </span>
              </h1>
              <p className="text-xs text-[#94a3b8] mt-1">
                Generate simulated accounts directly under specific leaders, inject global queue momentum, or auto-promote any ID to higher ranks.
              </p>
            </div>
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

      {/* Main Interactive Client Component */}
      <SimulatorClient
        initialTarget={target || ""}
        recentUsers={recentUsers}
      />
    </div>
  );
}
