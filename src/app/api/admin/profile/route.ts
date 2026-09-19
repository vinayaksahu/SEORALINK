import { NextResponse } from "next/server";
import { getSession, isAdmin, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateAndConsumeOtp, isOtpFeatureEnabled } from "@/lib/otp";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const admin = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        usdtAddress: true,
        usdtNetwork: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    // Get branch member counts
    const totalMembers = await db.user.count({
      where: { adminId: admin.id, role: "USER" },
    });

    const activeMembers = await db.user.count({
      where: { adminId: admin.id, role: "USER", status: "ACTIVE" },
    });

    return NextResponse.json({
      success: true,
      admin: {
        ...admin,
        totalMembers,
        activeMembers,
        createdAt: admin.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Admin Profile GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, phone, newPassword, otpCode } = body;

    const existingAdmin = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    // 1. Validate Full Name
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Admin Full Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    // 2. Validate Email
    const trimmedEmail = email ? email.trim().toLowerCase() : "";
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      return NextResponse.json(
        { error: "Please provide a valid administrative email address." },
        { status: 400 }
      );
    }

    // Check if email changed and is taken
    if (trimmedEmail !== existingAdmin.email.toLowerCase()) {
      const emailInUse = await db.user.findUnique({
        where: { email: trimmedEmail },
      });
      if (emailInUse && emailInUse.id !== session.userId) {
        return NextResponse.json(
          { error: "This email address is already registered with another account." },
          { status: 400 }
        );
      }
    }

    // 3. Process Phone Number
    const cleanPhone = phone && typeof phone === "string" ? phone.trim() : null;

    // 4. Validate New Password if provided
    let passwordHashToUpdate: string | undefined = undefined;
    if (newPassword && typeof newPassword === "string" && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      passwordHashToUpdate = await hashPassword(newPassword.trim());
    }

    // 5. Check if any sensitive details changed
    const isNameChanged = fullName.trim() !== existingAdmin.fullName;
    const isEmailChanged = trimmedEmail !== existingAdmin.email.toLowerCase();
    const isPhoneChanged = (cleanPhone || "") !== (existingAdmin.phone || "");
    const isPasswordChanged = Boolean(passwordHashToUpdate);

    const isSensitiveChanged = isNameChanged || isEmailChanged || isPhoneChanged || isPasswordChanged;

    if (isSensitiveChanged) {
      const isOtpEnabled = await isOtpFeatureEnabled("PROFILE_UPDATE");
      if (isOtpEnabled) {
        if (!otpCode || typeof otpCode !== "string" || otpCode.trim().length !== 6) {
          return NextResponse.json(
            { error: "A 6-digit email verification OTP is required to update administrative profile." },
            { status: 400 }
          );
        }

        const otpValidation = await validateAndConsumeOtp({
          email: existingAdmin.email,
          code: otpCode.trim(),
          purpose: "PROFILE_UPDATE",
        });

        if (!otpValidation.success) {
          return NextResponse.json(
            { error: otpValidation.error || "Invalid or expired profile update OTP code. Please check your email." },
            { status: 400 }
          );
        }
      }
    }

    // 6. Update database record
    const updateData: any = {
      fullName: fullName.trim(),
      email: trimmedEmail,
      phone: cleanPhone,
    };

    if (passwordHashToUpdate) {
      updateData.passwordHash = passwordHashToUpdate;
    }

    const updatedAdmin = await db.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        customId: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin profile updated successfully.",
      admin: updatedAdmin,
    });
  } catch (error: any) {
    console.error("[Admin Profile PATCH Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin profile" },
      { status: 500 }
    );
  }
}
