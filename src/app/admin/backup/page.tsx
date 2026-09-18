import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import BackupClient from "./BackupClient";
import { Database, ShieldCheck } from "lucide-react";

export default async function AdminBackupPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const [
    totalUsers,
    totalQueues,
    totalLedgers,
    totalDeposits,
    totalWithdrawals,
    totalTickets,
    totalConfigs,
  ] = await Promise.all([
    db.user.count(),
    db.queueEntry.count(),
    db.ledgerEntry.count(),
    db.depositRequest.count(),
    db.withdrawalRequest.count(),
    db.supportTicket.count(),
    db.systemConfig.count(),
  ]);

  const currentStats = {
    users: totalUsers,
    queues: totalQueues,
    ledgers: totalLedgers,
    deposits: totalDeposits,
    withdrawals: totalWithdrawals,
    tickets: totalTickets,
    configs: totalConfigs,
    totalRecords:
      totalUsers +
      totalQueues +
      totalLedgers +
      totalDeposits +
      totalWithdrawals +
      totalTickets +
      totalConfigs,
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database size={22} className="text-red-400" />
          Database Backup, Export & Disaster Recovery
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Complete local backup in JSON and multi-sheet Excel (.xlsx) formats, with automated restoration for new database instances.
        </p>
      </div>

      <BackupClient currentStats={currentStats} adminEmail={session.email} />
    </div>
  );
}
