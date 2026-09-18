import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminActivateUserAccount } from "@/lib/activation";

export async function PATCH(
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
    const { action, status, fullName, email, phone } = body;

    // Check if target user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // --- Administrative Status Actions (Activate / Block / Unblock) ---
    if (action || (status && (status === "ACTIVE" || status === "BLOCKED" || status === "INACTIVE"))) {
      // Check if target member has executed Rank Pool Single-Exit
      const hasRankExit = await db.withdrawalRequest.findFirst({
        where: {
          userId: id,
          adminNote: { contains: "CASHOUT" },
          status: { not: "REJECTED" },
        },
      });

      if (hasRankExit) {
        return NextResponse.json(
          { error: "This member permanently exited the network under the Single-Exit protocol. Status modification and re-entry are strictly prohibited." },
          { status: 400 }
        );
      }

      const targetAction = (action || status).toUpperCase();

      if (targetAction === "ACTIVATE" || (targetAction === "ACTIVE" && existingUser.status === "INACTIVE")) {
        if (existingUser.status === "ACTIVE") {
          return NextResponse.json({ error: "Member is already active" }, { status: 400 });
        }

        const result = await adminActivateUserAccount(id);
        return NextResponse.json({
          ...result,
          status: "ACTIVE",
        });
      }

      if (targetAction === "BLOCK" || targetAction === "BLOCKED") {
        if (existingUser.id === session.userId || existingUser.role === "ADMIN" || existingUser.role === "SUPER_ADMIN") {
          return NextResponse.json({ error: "Cannot block an administrator account" }, { status: 400 });
        }

        await db.user.update({
          where: { id },
          data: { status: "BLOCKED" },
        });

        return NextResponse.json({
          success: true,
          message: `Member ${existingUser.customId} (${existingUser.fullName}) has been blocked.`,
          status: "BLOCKED",
        });
      }

      if (targetAction === "UNBLOCK" || (targetAction === "ACTIVE" && existingUser.status === "BLOCKED")) {
        await db.user.update({
          where: { id },
          data: { status: "ACTIVE" },
        });

        return NextResponse.json({
          success: true,
          message: `Member ${existingUser.customId} (${existingUser.fullName}) has been unblocked and restored to ACTIVE.`,
          status: "ACTIVE",
        });
      }

      return NextResponse.json({ error: "Invalid status action specified" }, { status: 400 });
    }

    // --- Profile Information Update ---
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Full Name must be at least 2 characters" }, { status: 400 });
    }

    const trimmedEmail = email ? email.trim().toLowerCase() : "";
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }


    // Check email uniqueness if email changed
    if (trimmedEmail !== existingUser.email.toLowerCase()) {
      const emailInUse = await db.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (emailInUse && emailInUse.id !== id) {
        return NextResponse.json({ error: "This email is already in use by another member" }, { status: 400 });
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        fullName: fullName.trim(),
        email: trimmedEmail,
        phone: phone ? phone.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Member ${updated.customId} profile updated successfully`,
      user: {
        id: updated.id,
        customId: updated.customId,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
      },
    });
  } catch (error: any) {
    console.error("[Admin Update User Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update member profile" },
      { status: 500 }
    );
  }
}
