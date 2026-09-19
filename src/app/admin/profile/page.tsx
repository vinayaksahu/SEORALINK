import React from "react";
import { getSession, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminProfileClient from "./AdminProfileClient";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProfilePage() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/adminlogin");
  }

  const admin = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      customId: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!admin) {
    redirect("/adminlogin");
  }

  const totalMembers = await db.user.count({
    where: { adminId: admin.id, role: "USER" },
  });

  const activeMembers = await db.user.count({
    where: { adminId: admin.id, role: "USER", status: "ACTIVE" },
  });

  const serializedAdmin = {
    id: admin.id,
    customId: admin.customId,
    fullName: admin.fullName,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    status: admin.status,
    createdAt: admin.createdAt.toISOString(),
    totalMembers,
    activeMembers,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck size={20} className="text-red-500 dark:text-[#d4af37]" />
          Admin Profile &bull; Account &amp; Security Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
          Manage your administrative profile, contact email, phone, and master security password with OTP verification.
        </p>
      </div>

      <AdminProfileClient admin={serializedAdmin} />
    </div>
  );
}
