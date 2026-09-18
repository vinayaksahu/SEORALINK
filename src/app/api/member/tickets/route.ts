import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await db.supportTicket.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (err: any) {
    console.error("[Member Tickets GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, category, message } = body;

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json({ error: "Subject must be at least 3 characters long." }, { status: 400 });
    }

    if (!category || typeof category !== "string" || category.trim().length === 0) {
      return NextResponse.json({ error: "Please select a valid ticket category." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters long with sufficient details." }, { status: 400 });
    }

    // Limit maximum open tickets per member to prevent spam
    const openCount = await db.supportTicket.count({
      where: {
        userId: session.userId,
        status: "OPEN",
      },
    });

    if (openCount >= 5) {
      return NextResponse.json(
        { error: "You already have 5 open tickets. Please wait for an administrator to respond before opening more." },
        { status: 429 }
      );
    }

    const newTicket = await db.supportTicket.create({
      data: {
        userId: session.userId,
        subject: subject.trim(),
        category: category.trim(),
        message: message.trim(),
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (err: any) {
    console.error("[Member Tickets POST Error]", err);
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }
}
