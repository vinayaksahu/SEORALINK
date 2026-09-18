import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminTicketsClient } from "./AdminTicketsClient";

export const metadata = {
  title: "Support Tickets Console | SEORALINK Admin",
  description: "Executive administrative portal for managing member inquiries and technical tickets.",
};

export default async function AdminTicketsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    redirect("/adminlogin");
  }

  const rawTickets = await db.supportTicket.findMany({
    include: {
      user: {
        select: {
          id: true,
          customId: true,
          fullName: true,
          email: true,
          phone: true,
          currentTier: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedTickets = rawTickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    category: t.category,
    message: t.message,
    status: t.status,
    adminReply: t.adminReply,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    user: {
      id: t.user.id,
      customId: t.user.customId,
      fullName: t.user.fullName,
      email: t.user.email,
      phone: t.user.phone,
      currentTier: t.user.currentTier,
      status: t.user.status,
    },
  }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <AdminTicketsClient initialTickets={serializedTickets} />
    </div>
  );
}
