import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, createSessionToken, verifySessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const currentSession = await getSession();
    const existingAdminToken = cookieStore.get("sl_admin_session")?.value;

    let adminSession = currentSession;
    let adminToken = cookieStore.get("sl_session")?.value;

    // Verify admin privileges (either directly in sl_session or saved in sl_admin_session)
    if (!adminSession || (adminSession.role !== "ADMIN" && adminSession.role !== "SUPER_ADMIN")) {
      if (existingAdminToken) {
        const verifiedAdmin = await verifySessionToken(existingAdminToken);
        if (verifiedAdmin && (verifiedAdmin.role === "ADMIN" || verifiedAdmin.role === "SUPER_ADMIN")) {
          adminSession = verifiedAdmin;
          adminToken = existingAdminToken;
        }
      }
    }

    if (!adminSession || (adminSession.role !== "ADMIN" && adminSession.role !== "SUPER_ADMIN") || !adminToken) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    // Find the target user in the database
    const targetUser = await db.user.findFirst({
      where: {
        OR: [{ id: targetUserId }, { customId: targetUserId }],
      },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Create session token for the target user
    const userSessionToken = await createSessionToken({
      userId: targetUser.id,
      customId: targetUser.customId,
      fullName: targetUser.fullName,
      email: targetUser.email,
      role: targetUser.role,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    // 1. Preserve the Admin token in sl_admin_session (if not already preserved)
    if (!existingAdminToken) {
      cookieStore.set("sl_admin_session", adminToken, cookieOptions);
    }

    // 2. Set active session to the target member
    cookieStore.set("sl_session", userSessionToken, cookieOptions);

    // 3. Store helper tag for client indication
    cookieStore.set("sl_impersonating", targetUser.customId, {
      ...cookieOptions,
      httpOnly: false, // accessible to client if needed
    });

    return NextResponse.json({
      success: true,
      message: `Switched to ${targetUser.fullName} (${targetUser.customId}) portal`,
      redirectUrl: "/member/dashboard",
    });
  } catch (error: any) {
    console.error("[Impersonate Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to switch to user portal" },
      { status: 500 }
    );
  }
}
