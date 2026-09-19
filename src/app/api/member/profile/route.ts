import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        phone: true,
        usdtAddress: true,
        usdtNetwork: true,
        status: true,
        role: true,
        currentTier: true,
        directCount: true,
        fundBalance: true,
        incomeBalance: true,
        createdAt: true,
        sponsor: {
          select: {
            customId: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        fundBalance: user.fundBalance.toString(),
        incomeBalance: user.incomeBalance.toString(),
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Get Profile Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, email, phone, usdtAddress, usdtNetwork } = body;

    const existingUser = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Validate Full Name
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Full Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    // 2. Validate Email
    const trimmedEmail = email ? email.trim().toLowerCase() : "";
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check if email changed and is taken
    if (trimmedEmail !== existingUser.email.toLowerCase()) {
      const emailInUse = await db.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (emailInUse && emailInUse.id !== session.userId) {
        return NextResponse.json(
          { error: "This email is already registered with another account." },
          { status: 400 }
        );
      }
    }

    // 3. Process Phone Number
    const cleanPhone = phone && typeof phone === "string" ? phone.trim() : null;

    // 4. Validate and Process USDT Address (BEP-20 only)
    const cleanAddress = usdtAddress && typeof usdtAddress === "string" ? usdtAddress.trim() : null;
    const cleanNetwork = "USDT_BEP20";

    if (cleanAddress) {
      if (!cleanAddress.startsWith("0x") || cleanAddress.length !== 42) {
        return NextResponse.json(
          { error: "Please provide a valid BNB Smart Chain (BEP-20) address starting with 0x (42 characters)." },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updated = await db.user.update({
      where: { id: session.userId },
      data: {
        fullName: fullName.trim(),
        email: trimmedEmail,
        phone: cleanPhone || null,
        usdtAddress: cleanAddress || null,
        usdtNetwork: cleanNetwork,
      },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        phone: true,
        usdtAddress: true,
        usdtNetwork: true,
        status: true,
        currentTier: true,
        fundBalance: true,
        incomeBalance: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your profile and wallet settings have been updated successfully!",
      user: {
        ...updated,
        fundBalance: updated.fundBalance.toString(),
        incomeBalance: updated.incomeBalance.toString(),
      },
    });
  } catch (error: any) {
    console.error("[Update Profile Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
