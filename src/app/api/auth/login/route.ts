import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, createSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { identifier, password, requireAdmin, portal } = await req.json();

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
          { customId: { equals: trimmed, mode: "insensitive" } },
          { email: { equals: trimmed.toLowerCase(), mode: "insensitive" } },
          { referralCode: { equals: trimmed, mode: "insensitive" } },
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
      const hasRankExit = await db.withdrawalRequest.findFirst({
        where: {
          userId: user.id,
          OR: [
            { feePercent: 20 },
            { adminNote: { contains: "CASHOUT" } },
            { adminNote: { contains: "RANK_EXIT" } },
            { amount: 20480 },
          ],
          status: { not: "REJECTED" },
        },
      });

      if (!hasRankExit) {
        return NextResponse.json(
          { error: "This account has been blocked by administration. Please contact support." },
          { status: 403 }
        );
      }
      // Accounts retired under Single-Exit protocol are permitted to log in and manage remaining commission balance
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Account is suspended. Please contact administration." },
        { status: 403 }
      );
    }

    const isSuperRoot = user.role === "SUPER_ROOT_ADMIN";
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    // Strict portal separation
    if (portal === "super_root") {
      if (!isSuperRoot) {
        return NextResponse.json(
          { error: "Access Denied. Invalid Super Root Administrator credentials." },
          { status: 403 }
        );
      }
    } else if (portal === "admin" || requireAdmin) {
      if (isSuperRoot) {
        return NextResponse.json(
          { error: "Access Denied. Super Root Administrator must sign in exclusively through /superrootadminlogin." },
          { status: 403 }
        );
      }
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Administrative privileges required" },
          { status: 403 }
        );
      }
    } else {
      // Default member portal
      if (isSuperRoot) {
        return NextResponse.json(
          { error: "Invalid Member ID or password" },
          { status: 401 }
        );
      }
      if (isAdmin) {
        return NextResponse.json(
          { error: "Access Denied. Administrator accounts cannot log in through the Member Portal. Please use the official Admin Portal at /adminlogin." },
          { status: 403 }
        );
      }
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid Member ID or password" },
        { status: 401 }
      );
    }

    // Determine redirect
    let redirectTo = "/member/dashboard";
    if (isSuperRoot) {
      redirectTo = "/superrootadmin";
    } else if (isAdmin) {
      redirectTo = "/admin";
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      customId: user.customId,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      adminId: user.adminId,
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
      redirectTo,
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
