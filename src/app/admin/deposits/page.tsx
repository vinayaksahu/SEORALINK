import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DepositsTableClient from "./DepositsTableClient";
import { Wallet } from "lucide-react";

export default async function AdminDepositsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const rawDeposits = await db.depositRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          customId: true,
          fullName: true,
          email: true,
        },
      },
    },
    take: 100,
  });

  const deposits = rawDeposits.map((d) => ({
    id: d.id,
    amount: d.amount.toString(),
    txHash: d.txHash,
    network: d.network,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    user: d.user,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet size={20} className="text-red-400" />
          Deposit Verification Queue
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Review member blockchain transactions and credit verified funds to user Fund Wallets.
        </p>
      </div>

      <DepositsTableClient initialDeposits={deposits} />
    </div>
  );
}
