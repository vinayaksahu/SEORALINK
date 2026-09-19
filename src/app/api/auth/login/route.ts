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

    // Find user by customId or email (with alias support for superrootadmin)
    const orConditions: any[] = [
      { customId: { equals: trimmed, mode: "insensitive" } },
      { email: { equals: trimmed.toLowerCase(), mode: "insensitive" } },
      { referralCode: { equals: trimmed, mode: "insensitive" } },
    ];

    if (
      portal === "super_root" ||
      trimmed.toLowerCase() === "superrootadmin" ||
      trimmed.toLowerCase() === "superroot"
    ) {
      if (
        trimmed.toLowerCase() === "superrootadmin" ||
        trimmed.toLowerCase() === "superroot" ||
        trimmed.toLowerCase() === "superroot@seoralink.com"
      ) {
        orConditions.push({ customId: "SUPERROOT" });
        orConditions.push({ email: "superroot@seoralink.com" });
        orConditions.push({ role: "SUPER_ROOT_ADMIN" });
      }
    }

    const user = await db.user.findFirst({
      where: {
        OR: orConditions,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            portal === "super_root"
              ? "Invalid Super Root Identifier or password"
              : "Invalid Member ID or password",
        },
        { status: 401 }
      );
    }

    const isSuperRoot = user.role === "SUPER_ROOT_ADMIN";
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (user.status === "BLOCKED") {
      // If an Admin branch is blocked by Super Root Admin, show a technical gateway error
      // so zero-knowledge isolation is preserved (admin thinks it is a server/network timeout)
      if (isAdmin || portal === "admin") {
        return NextResponse.json(
          { error: "Error Code: ERR_CONNECTION_TIMED_OUT (504 Gateway Security Handshake Failed: 0x8004100E). Master cluster unreachable. Please try again later." },
          { status: 504 }
        );
      }

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
      if (isAdmin || portal === "admin") {
        return NextResponse.json(
          { error: "Service Error: 503 Service Unavailable (ERR_NODE_MAINTENANCE_LOCKED). Master node currently in maintenance. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Account is suspended. Please contact administration." },
        { status: 403 }
      );
    }

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
      // Default member portal - do not reveal administrator status for security
      if (isSuperRoot || isAdmin) {
        return NextResponse.json(
          { error: "Invalid Member ID or password" },
          { status: 401 }
        );
      }
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          error:
            portal === "super_root"
              ? "Invalid Super Root Identifier or password"
              : "Invalid Member ID or password",
        },
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
