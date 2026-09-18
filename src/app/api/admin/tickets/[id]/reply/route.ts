import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { adminReply, status } = body;

    const existingTicket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            customId: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    const validStatuses = ["OPEN", "RESOLVED", "CLOSED"];
    const targetStatus = validStatuses.includes(status) ? status : "RESOLVED";

    const updated = await db.supportTicket.update({
      where: { id },
      data: {
        adminReply: typeof adminReply === "string" ? adminReply.trim() : existingTicket.adminReply,
        status: targetStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ticket #${id.slice(-6).toUpperCase()} updated to ${targetStatus}`,
      ticket: updated,
    });
  } catch (error: any) {
    console.error("[Admin Ticket Reply Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update support ticket" },
      { status: 500 }
    );
  }
}
