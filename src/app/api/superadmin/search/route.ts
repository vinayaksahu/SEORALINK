import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      // Return latest 25 users across all branches
      const users = await db.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          assignedAdmin: {
            select: { id: true, customId: true, fullName: true },
          },
          sponsor: {
            select: { id: true, customId: true, fullName: true },
          },
        },
      });

      return NextResponse.json({ success: true, users });
    }

    const users = await db.user.findMany({
      where: {
        role: "USER",
        OR: [
          { customId: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        assignedAdmin: {
          select: { id: true, customId: true, fullName: true },
        },
        sponsor: {
          select: { id: true, customId: true, fullName: true },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("[SuperAdmin Search Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search members." },
      { status: 500 }
    );
  }
}
