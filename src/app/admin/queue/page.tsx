import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TIER_NAMES, TIER_VALUES } from "@/lib/constants";
import QueueAdminClient from "./QueueAdminClient";
import { GitCommit } from "lucide-react";

export default async function AdminQueuePage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  // Aggregate stats per tier
  const tierStats = await Promise.all(
    TIER_NAMES.map(async (name, tier) => {
      const totalNodes = await db.queueEntry.count({ where: { tier } });
      const waitingNodes = await db.queueEntry.count({ where: { tier, status: "WAITING" } });
      const completedNodes = await db.queueEntry.count({ where: { tier, status: "COMPLETED" } });

      return {
        tier,
        name,
        value: TIER_VALUES[tier],
        totalNodes,
        waitingNodes,
        completedNodes,
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitCommit size={20} className="text-red-400" />
          Single-Leg Queue Engine Telemetry
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Monitor FIFO progression across all 12 doubling ladder tiers and execute manual reconciliation audits.
        </p>
      </div>

      <QueueAdminClient tierStats={tierStats} />
    </div>
  );
}
