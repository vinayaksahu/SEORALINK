import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import WithdrawalsTableClient from "./WithdrawalsTableClient";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminWithdrawalsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const rawWithdrawals = await db.withdrawalRequest.findMany({
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

  const withdrawals = rawWithdrawals.map((w) => ({
    id: w.id,
    amount: w.amount.toString(),
    feePercent: w.feePercent.toString(),
    feeAmount: w.feeAmount.toString(),
    netAmount: w.netAmount.toString(),
    toAddress: w.toAddress,
    network: w.network,
    txHash: w.txHash,
    status: w.status,
    createdAt: w.createdAt.toISOString(),
    user: w.user,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ArrowUpRight size={20} className="text-red-400" />
          Withdrawal Payout Queue
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Review member withdrawal requests, verify network addresses, and execute or refund payouts.
        </p>
      </div>

      <WithdrawalsTableClient initialWithdrawals={withdrawals} />
    </div>
  );
}
