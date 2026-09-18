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

      <SettingsFormClient
        initialAddress={usdtAddress}
        initialAddresses={initialAddresses}
        initialDistributionMode={distributionMode}
        initialNetwork={network}
      />
    </div>
  );
}
