import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {
      user: {
        adminId: session.userId,
      },
    };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const tickets = await db.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            customId: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            currentTier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (err: any) {
    console.error("[Admin Tickets GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 });
  }
}
