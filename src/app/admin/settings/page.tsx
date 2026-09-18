import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import SettingsFormClient from "./SettingsFormClient";
import { Settings, Database, ArrowRight } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const addressConfig = await db.systemConfig.findUnique({
    where: { key: "USDT_DEPOSIT_ADDRESS" },
  });
  const addressesListConfig = await db.systemConfig.findUnique({
    where: { key: "USDT_DEPOSIT_ADDRESSES" },
  });
  const distributionConfig = await db.systemConfig.findUnique({
    where: { key: "DEPOSIT_DISTRIBUTION_MODE" },
  });
  const networkConfig = await db.systemConfig.findUnique({
    where: { key: "DEFAULT_NETWORK" },
  });

  const usdtAddress = addressConfig?.value || "0x71C569E9903b41D8B4eAE6b22312dE9d89Ae0001";
  const network = networkConfig?.value || "USDT_BEP20";
  const distributionMode = distributionConfig?.value || "MULTI_USER";

  let initialAddresses = [];
  try {
    if (addressesListConfig?.value) {
      initialAddresses = JSON.parse(addressesListConfig.value);
    }
  } catch (e) {
    initialAddresses = [];
  }

  if (!Array.isArray(initialAddresses) || initialAddresses.length === 0) {
    initialAddresses = [
      {
        id: "addr_1",
        address: usdtAddress,
        label: "Master Hot Wallet 1",
        network: network,
        isActive: true,
        isPrimary: true,
      },
    ];
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings size={20} className="text-red-400" />
          System Administration Settings
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Configure master payout parameters, deposit target addresses, and global operating settings.
        </p>
      </div>

      {/* Database Backup & Disaster Recovery Link Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shrink-0">
            <Database size={20} className="text-[#d4af37]" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Database Backup & Disaster Recovery
              <span className="text-[10px] bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded font-mono font-semibold">JSON & Excel (.xlsx)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Download your full database locally in JSON or Excel sheets, and restore anytime when setting up a fresh database.
            </p>
          </div>
        </div>

        <Link
          href="/admin/backup"
          className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#c49f27] text-black font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-lg shadow-[#d4af37]/10"
        >
          Open Backup Console <ArrowRight size={14} />
        </Link>
      </div>

      <SettingsFormClient
        initialAddress={usdtAddress}
        initialAddresses={initialAddresses}
        initialDistributionMode={distributionMode}
        initialNetwork={network}
      />
    </div>
  );
}
