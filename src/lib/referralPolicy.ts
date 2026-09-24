import { db } from "@/lib/db";

export const REQUIRE_ACTIVE_SPONSOR_KEY = "REQUIRE_ACTIVE_SPONSOR";

import { getBranchSystemConfig } from "@/lib/adminBranchConfig";

/**
 * Checks if the system policy requires an active account to sponsor/refer new members.
 * Scoped to specific admin branch if adminId provided, otherwise falls back to global default.
 * Defaults to true if not configured.
 */
export async function isRequireActiveSponsorEnabled(adminId?: string | null): Promise<boolean> {
  try {
    const { value } = await getBranchSystemConfig(REQUIRE_ACTIVE_SPONSOR_KEY, adminId);
    if (value === null) {
      // Default: enabled
      return true;
    }
    return value !== "false" && value !== "0";
  } catch (err) {
    console.error("[isRequireActiveSponsorEnabled Error]", err);
    return true; // Default secure policy
  }
}

/**
 * Validates whether a given user/admin is permitted to sponsor new members under current policy.
 * Scoped to the sponsor's admin branch.
 */
export async function canUserSponsor(sponsor: {
  id: string;
  customId: string;
  role: string;
  status: string;
  adminId?: string | null;
}): Promise<{ allowed: boolean; reason?: string }> {
  // Administrators are always authorized to sponsor
  if (
    sponsor.role === "ADMIN" ||
    sponsor.role === "SUPER_ADMIN" ||
    sponsor.role === "SUPER_ROOT_ADMIN"
  ) {
    return { allowed: true };
  }

  const sponsorAdminId =
    sponsor.role === "ADMIN" || sponsor.role === "SUPER_ADMIN"
      ? sponsor.id
      : sponsor.adminId;

  const isPolicyActive = await isRequireActiveSponsorEnabled(sponsorAdminId);
  if (!isPolicyActive) {
    // Policy disabled by admin: inactive members are allowed to sponsor
    return { allowed: true };
  }

  // Under active policy, only ACTIVE accounts can refer
  if (sponsor.status === "ACTIVE") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Sponsor account (${sponsor.customId}) is not yet activated. Members must activate their account ($10 USDT) before they can refer or sponsor new partners.`,
  };
}
