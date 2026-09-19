import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, createSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const currentSession = await getSession();

    if (!currentSession || currentSession.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const { targetAdminId } = await req.json();
    if (!targetAdminId) {
      return NextResponse.json({ error: "targetAdminId is required." }, { status: 400 });
    }

    const targetAdmin = await db.user.findFirst({
      where: {
        OR: [{ id: targetAdminId }, { customId: targetAdminId }],
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      },
    });

    if (!targetAdmin) {
      return NextResponse.json({ error: "Target admin branch not found." }, { status: 404 });
    }

    // Preserve the super root admin token in `sl_super_session`
    const superRootToken = cookieStore.get("sl_session")?.value;
    const isProduction = process.env.NODE_ENV === "production";

    if (superRootToken) {
      cookieStore.set("sl_super_session", superRootToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }

    // Create session token for the target admin
    const adminSessionToken = await createSessionToken({
      userId: targetAdmin.id,
      customId: targetAdmin.customId,
      fullName: targetAdmin.fullName,
      email: targetAdmin.email,
      role: targetAdmin.role,
      adminId: targetAdmin.id,
    });

    // Set active session to the branch admin
    cookieStore.set("sl_session", adminSessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: `Impersonating Admin ${targetAdmin.customId} (${targetAdmin.fullName}).`,
      redirectUrl: "/admin",
    });
  } catch (error: any) {
    console.error("[SuperAdmin Impersonate Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to impersonate admin." },
      { status: 500 }
    );
  }
}
