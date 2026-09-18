import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SupportTicketsClient } from "./SupportTicketsClient";

export const metadata = {
  title: "Support Tickets | SEORALINK",
  description: "Direct assistance, issue resolution, and administrator ticketing.",
};

export default async function MemberSupportPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const rawTickets = await db.supportTicket.findMany({
    where: { userId: session.userId },
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
  }));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <SupportTicketsClient initialTickets={serializedTickets} customId={session.customId} />
    </div>
  );
}
