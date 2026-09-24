import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DepositsTableClient from "./DepositsTableClient";
import { Wallet } from "lucide-react";
import { serializeBlockchainData } from "@/lib/blockchain/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDepositsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
    redirect("/adminlogin");
  }

  const where: any = {};
  if (session.role !== "SUPER_ROOT_ADMIN") {
    where.user = { adminId: session.userId };
  }

  const rawDeposits = await db.depositRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          customId: true,
          fullName: true,
          email: true,
          adminId: true,
        },
      },
    },
    take: 100,
  });

  const deposits = serializeBlockchainData(rawDeposits);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet size={20} className="text-red-400" />
          Deposit Verification Queue
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Review member blockchain transactions, verify on BNB Smart Chain, and credit verified funds to member Fund Wallets.
        </p>
      </div>

      <DepositsTableClient initialDeposits={deposits} />
    </div>
  );
}
