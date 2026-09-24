import { db } from "./db";
import { sendOtpEmail } from "./mail";
import { randomInt } from "node:crypto";
import { checkRateLimitAsync } from "./rateLimit";

export type OtpPurpose =
  | "REGISTRATION"
  | "FORGOT_PASSWORD"
  | "WITHDRAWAL"
  | "PROFILE_UPDATE";

const PURPOSE_CONFIG_KEYS: Record<OtpPurpose, string> = {
  REGISTRATION: "OTP_ENABLED_REGISTRATION",
  FORGOT_PASSWORD: "OTP_ENABLED_FORGOT_PASSWORD",
  WITHDRAWAL: "OTP_ENABLED_WITHDRAWAL",
  PROFILE_UPDATE: "OTP_ENABLED_PROFILE_UPDATE",
};

const PURPOSE_LABELS: Record<OtpPurpose, string> = {
  REGISTRATION: "Account Registration",
  FORGOT_PASSWORD: "Password Reset",
  WITHDRAWAL: "Withdrawal Authorization",
  PROFILE_UPDATE: "Profile & Wallet Update",
};

import { getBranchSystemConfig } from "@/lib/adminBranchConfig";

/**
 * Check if OTP is enabled for a given operation.
 * Scoped to specific admin branch if adminId provided, otherwise falls back to global default.
 * Defaults to true if setting is not yet explicitly configured.
 */
export async function isOtpFeatureEnabled(purpose: OtpPurpose, adminId?: string | null): Promise<boolean> {
  try {
    const configKey = PURPOSE_CONFIG_KEYS[purpose];
    const { value } = await getBranchSystemConfig(configKey, adminId);

    if (value === null) {
      // Default: enabled
      return true;
    }

    return value === "true" || value === "1";
  } catch (err) {
    console.error(`[isOtpFeatureEnabled Error for ${purpose}]`, err);
    return true; // Safe fallback to secure default
  }
}

/**
 * Fetch all OTP governance statuses in a single call for Admin or Client check.
 * Scoped to specific admin branch if adminId provided.
 */
export async function getAllOtpSettings(adminId?: string | null): Promise<Record<OtpPurpose, boolean>> {
  try {
    const [reg, forgot, withdr, prof] = await Promise.all([
      getBranchSystemConfig(PURPOSE_CONFIG_KEYS.REGISTRATION, adminId),
      getBranchSystemConfig(PURPOSE_CONFIG_KEYS.FORGOT_PASSWORD, adminId),
      getBranchSystemConfig(PURPOSE_CONFIG_KEYS.WITHDRAWAL, adminId),
      getBranchSystemConfig(PURPOSE_CONFIG_KEYS.PROFILE_UPDATE, adminId),
    ]);

    return {
      REGISTRATION: reg.value === null ? true : reg.value === "true" || reg.value === "1",
      FORGOT_PASSWORD: forgot.value === null ? true : forgot.value === "true" || forgot.value === "1",
      WITHDRAWAL: withdr.value === null ? true : withdr.value === "true" || withdr.value === "1",
      PROFILE_UPDATE: prof.value === null ? false : prof.value === "true" || prof.value === "1",
    };
  } catch (err) {
    console.error("[getAllOtpSettings Error]", err);
    return {
      REGISTRATION: true,
      FORGOT_PASSWORD: true,
      WITHDRAWAL: true,
      PROFILE_UPDATE: true,
    };
  }
}

/**
 * Generate a 6-digit numeric OTP, save to DB, and send via Namecheap Private Email
 */
export async function generateAndSendOtp({
  email,
  purpose,
  recipientName = "Member",
  adminId,
}: {
  email: string;
  purpose: OtpPurpose;
  recipientName?: string;
  adminId?: string | null;
}): Promise<{ success: boolean; message: string; cooldownSeconds?: number }> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check if OTP is required for this action
  const isEnabled = await isOtpFeatureEnabled(purpose, adminId);
  if (!isEnabled) {
    return {
      success: true,
      message: `OTP verification is currently bypassed by administrator for ${PURPOSE_LABELS[purpose]}.`,
    };
  }

  // 2. Anti-spam rate limiting: 45 seconds between OTP dispatches
  const recentOtp = await db.emailOtp.findFirst({
    where: {
      email: cleanEmail,
      purpose,
      createdAt: { gt: new Date(Date.now() - 45 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const elapsed = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
    const remaining = Math.max(1, 45 - elapsed);
    return {
      success: false,
      message: `Please wait ${remaining} seconds before requesting a new code.`,
      cooldownSeconds: remaining,
    };
  }

  // 3. Mark previous unused OTPs for this email & purpose as used/invalidated
  await db.emailOtp.updateMany({
    where: {
      email: cleanEmail,
      purpose,
      used: false,
    },
    data: {
      used: true,
    },
  });

  // 4. Generate cryptographically secure 6-digit code
  const code = randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // 5. Store new OTP record
  await db.emailOtp.create({
    data: {
      email: cleanEmail,
      code,
      purpose,
      expiresAt,
      used: false,
    },
  });

  // 6. Send email via Namecheap Private Email SMTP
  try {
    await sendOtpEmail({
      to: cleanEmail,
      otp: code,
      purpose: PURPOSE_LABELS[purpose],
      recipientName,
    });

    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
    };
  } catch (error: any) {
    console.error("[generateAndSendOtp SMTP Error]", error);
    return {
      success: false,
      message: error?.message || "Failed to send email. Please verify your email address or try again shortly.",
    };
  }
}

/**
 * Validates and consumes an OTP code
 */
export async function validateAndConsumeOtp({
  email,
  code,
  purpose,
  adminId,
}: {
  email: string;
  code?: string | null;
  purpose: OtpPurpose;
  adminId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  // 1. If feature is disabled by Admin, bypass check
  const isEnabled = await isOtpFeatureEnabled(purpose, adminId);
  if (!isEnabled) {
    return { success: true };
  }

  // 2. Validate input
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code ? code.trim() : "";

  if (!cleanCode) {
    return {
      success: false,
      error: `Security verification OTP code is required for ${PURPOSE_LABELS[purpose]}.`,
    };
  }

  // 3. Brute force defense: Max 5 verification attempts per 10-minute window
  const attemptLimitKey = `otp:verify:${cleanEmail}:${purpose}`;
  const attemptCheck = await checkRateLimitAsync(attemptLimitKey, {
    maxRequests: 5,
    windowSeconds: 600,
  });

  if (!attemptCheck.success) {
    // Invalidate any pending OTP for this purpose due to brute force detection
    await db.emailOtp.updateMany({
      where: {
        email: cleanEmail,
        purpose,
        used: false,
      },
      data: { used: true },
    });

    return {
      success: false,
      error: "Too many failed attempts. For your security, this verification code has been permanently cancelled. Please request a fresh code.",
    };
  }

  // 4. Check matching valid OTP
  const otpRecord = await db.emailOtp.findFirst({
    where: {
      email: cleanEmail,
      code: cleanCode,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    const remaining = Math.max(0, attemptCheck.remaining);
    return {
      success: false,
      error: remaining > 0
        ? `Invalid verification code. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining before code is locked)`
        : "Invalid or expired verification code. Please request a new code.",
    };
  }

  // 5. Mark code as used immediately (single-use)
  await db.emailOtp.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return { success: true };
}
