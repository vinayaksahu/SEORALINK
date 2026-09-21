import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileFormClient from "./ProfileFormClient";
import { UserCheck } from "lucide-react";
import { isUserSystemExited } from "@/lib/userStatus";
import { isRequireActiveSponsorEnabled } from "@/lib/referralPolicy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MemberProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      sponsor: {
        select: {
          customId: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isSystemExited = await isUserSystemExited(user.id);
  const requireActiveSponsor = await isRequireActiveSponsorEnabled();

  const serializedUser = {
    id: user.id,
    customId: user.customId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    usdtAddress: user.usdtAddress,
    usdtNetwork: user.usdtNetwork || "USDT_BEP20",
    status: user.status,
    isSystemExited,
    isSponsorLocked: Boolean(requireActiveSponsor && user.status !== "ACTIVE" && session.role === "USER"),
    currentTier: user.currentTier,
    directCount: user.directCount,
    fundBalance: user.fundBalance.toString(),
    incomeBalance: user.incomeBalance.toString(),
    createdAt: user.createdAt.toISOString(),
    sponsor: user.sponsor,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <UserCheck size={20} className="text-[#d4af37]" />
          My Profile &bull; Account &amp; USDT Wallet Settings
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Manage your personal information, contact email, phone, and default USDT withdrawal wallet.
        </p>
      </div>

      <ProfileFormClient user={serializedUser} />
    </div>
  );
}
