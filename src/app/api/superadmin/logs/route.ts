import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin surveillance privilege required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // "all" | "logins" | "activities"
    const adminId = searchParams.get("adminId") || "all";
    const category = searchParams.get("category") || "all";
    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    // Build common admin branch filter
    // If adminId specified, we include records where adminId == targetAdminId OR userId == targetAdminId (the admin themselves)
    const adminCondition: any = {};
    if (adminId && adminId !== "all") {
      adminCondition.OR = [
        { adminId },
        { userId: adminId },
      ];
    }

    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Calculate surveillance summary statistics
    const [totalLogins24h, totalActivities24h, distinctLoginIps] = await Promise.all([
      db.userSessionLog.count({ where: { createdAt: { gte: past24h } } }),
      db.activityLog.count({ where: { createdAt: { gte: past24h } } }),
      db.userSessionLog.groupBy({
        by: ["ipAddress"],
        where: { createdAt: { gte: past24h } },
      }),
    ]);

    const stats = {
      totalLogins24h,
      totalActivities24h,
      uniqueIps24h: distinctLoginIps.length,
    };

    if (type === "logins") {
      const where: any = { ...adminCondition };
      if (search) {
        where.OR = [
          ...(where.OR || []),
          { customId: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
          { ipAddress: { contains: search } },
          { country: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        db.userSessionLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.userSessionLog.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        type: "logins",
        items: items.map((item) => ({ ...item, logType: "LOGIN" })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats,
      });
    }

    if (type === "activities") {
      const where: any = { ...adminCondition };
      if (category && category !== "all") {
        where.category = category;
      }
      if (search) {
        where.OR = [
          ...(where.OR || []),
          { customId: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
          { action: { contains: search, mode: "insensitive" } },
          { targetCustomId: { contains: search, mode: "insensitive" } },
          { ipAddress: { contains: search } },
        ];
      }

      const [items, total] = await Promise.all([
        db.activityLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.activityLog.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        type: "activities",
        items: items.map((item) => ({ ...item, logType: "ACTIVITY" })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        stats,
      });
    }

    // "all" Unified Timeline: Fetch top recent from both and interleave
    const loginWhere: any = { ...adminCondition };
    const activityWhere: any = { ...adminCondition };

    if (search) {
      loginWhere.OR = [
        ...(loginWhere.OR || []),
        { customId: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search } },
      ];
      activityWhere.OR = [
        ...(activityWhere.OR || []),
        { customId: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { targetCustomId: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search } },
      ];
    }

    const [recentLogins, recentActivities, totalLogins, totalActivities] = await Promise.all([
      db.userSessionLog.findMany({
        where: loginWhere,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: Math.floor(skip / 2),
      }),
      db.activityLog.findMany({
        where: activityWhere,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: Math.floor(skip / 2),
      }),
      db.userSessionLog.count({ where: loginWhere }),
      db.activityLog.count({ where: activityWhere }),
    ]);

    const combined = [
      ...recentLogins.map((item) => ({ ...item, logType: "LOGIN" as const })),
      ...recentActivities.map((item) => ({ ...item, logType: "ACTIVITY" as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = totalLogins + totalActivities;

    return NextResponse.json({
      success: true,
      type: "all",
      items: combined.slice(0, limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (error: any) {
    console.error("[SuperAdmin Logs GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve surveillance logs" },
      { status: 500 }
    );
  }
}
