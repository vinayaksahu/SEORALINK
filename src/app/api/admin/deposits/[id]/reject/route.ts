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
    const body = await req.json().catch(() => ({}));
    const adminNote = body?.adminNote || "Transaction hash invalid or unverified on blockchain";

    const deposit = await db.depositRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!deposit || deposit.user.adminId !== session.userId) {
      return NextResponse.json({ error: "Deposit request not found" }, { status: 404 });
    }

    if (deposit.status !== "PENDING") {
      return NextResponse.json(
        { error: `Deposit has already been ${deposit.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    await db.depositRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNote,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deposit request has been rejected.",
    });
  } catch (error: any) {
    console.error("[Reject Deposit Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject deposit" },
      { status: 500 }
    );
  }
}
