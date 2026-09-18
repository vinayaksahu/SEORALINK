import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, createSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { identifier, password, requireAdmin } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Member ID/Email and password are required" },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();

    // Find user by customId or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { customId: trimmed },
          { email: trimmed.toLowerCase() },
          { referralCode: trimmed },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid Member ID or password" },
        { status: 401 }
      );
    }

    if (user.status === "BLOCKED") {
      return NextResponse.json(
        { error: "This ID has been permanently deactivated/banned due to an intermediate rank reward cashout under the Single-Exit protocol. It cannot be reactivated." },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Account is suspended. Please contact administration." },
        { status: 403 }
      );
    }

    if (requireAdmin && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Administrative privileges required" },
        { status: 403 }
      );
    }

    if (!requireAdmin && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Invalid Member ID or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid Member ID or password" },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      customId: user.customId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("sl_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        customId: user.customId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("[Login Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process login" },
      { status: 500 }
    );
  }
}
