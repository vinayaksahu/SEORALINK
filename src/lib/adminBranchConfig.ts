import { db } from "@/lib/db";

/**
 * Resolves both internal CUID and custom display ID (e.g. SL000001, SL122436) for an admin.
 * This guarantees 100% isolation across branch-scoped keys regardless of whether
 * an API route or query references an admin by id or customId.
 */
export async function resolveAdminIdentifiers(adminRef?: string | null): Promise<string[]> {
  if (!adminRef || adminRef === "GLOBAL") return [];
  const clean = adminRef.trim();
  const ids = [clean];

  try {
    const admin = await db.user.findFirst({
      where: {
        OR: [
          { id: clean },
          { customId: { equals: clean, mode: "insensitive" } },
        ],
      },
      select: { id: true, customId: true },
    });

    if (admin) {
      if (!ids.includes(admin.id)) ids.push(admin.id);
      if (!ids.includes(admin.customId)) ids.push(admin.customId);
    }
  } catch (err) {
    console.error("[resolveAdminIdentifiers] DB lookup error:", err);
  }

  return ids;
}

/**
 * Gets a system configuration value scoped to an admin branch.
 * Checks candidate keys for this specific admin, falling back to global default.
 */
export async function getBranchSystemConfig(
  baseKey: string,
  adminRef?: string | null
): Promise<{ value: string | null; isBranchOverride: boolean }> {
  try {
    if (adminRef && adminRef !== "GLOBAL") {
      const identifiers = await resolveAdminIdentifiers(adminRef);
      const branchKeys = identifiers.map((id) => `${baseKey}_${id}`);

      const branchRecord = await db.systemConfig.findFirst({
        where: { key: { in: branchKeys } },
        select: { value: true },
      });

      if (branchRecord && branchRecord.value !== null) {
        return { value: branchRecord.value, isBranchOverride: true };
      }
    }

    // Global platform fallback
    const globalRecord = await db.systemConfig.findUnique({
      where: { key: baseKey },
      select: { value: true },
    });

    return { value: globalRecord?.value ?? null, isBranchOverride: false };
  } catch (err) {
    console.error(`[getBranchSystemConfig] Error reading ${baseKey}:`, err);
    return { value: null, isBranchOverride: false };
  }
}

/**
 * Saves a system configuration value scoped to an admin branch under both CUID and customId.
 * Guarantees that neither global nor other admin branches are touched.
 */
export async function saveBranchSystemConfig(
  baseKey: string,
  value: string,
  adminRef: string,
  description?: string
): Promise<void> {
  const identifiers = await resolveAdminIdentifiers(adminRef);
  const desc = description || `Branch isolated config for ${baseKey} (Admin ${adminRef})`;

  for (const id of identifiers) {
    const scopedKey = `${baseKey}_${id}`;
    await db.systemConfig.upsert({
      where: { key: scopedKey },
      update: { value, description: desc },
      create: { key: scopedKey, value, description: desc },
    });
  }
}
