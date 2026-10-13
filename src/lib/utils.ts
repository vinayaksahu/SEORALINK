import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateCustomId(prefix = "SL"): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomDigits}`;
}

export function formatUSDT(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function shortenAddress(address?: string | null, start = 6, end = 4): string {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "superadmin",
  "superroot",
  "superrootadmin",
  "root",
  "system",
  "support",
  "seoralink",
  "official",
  "security",
  "moderator",
  "null",
  "undefined",
]);

/**
 * Validates and normalizes a member username.
 * Enforces strict format & prevents collision with Member IDs (e.g. SL595592) or system accounts.
 */
export function validateUsernameFormat(rawUsername?: string | null): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (!rawUsername || typeof rawUsername !== "string") {
    return { valid: false, normalized: "", error: "Username is required." };
  }

  const normalized = rawUsername.trim().toLowerCase();

  if (normalized.length < 3 || normalized.length > 20) {
    return {
      valid: false,
      normalized,
      error: "Username must be between 3 and 20 characters long.",
    };
  }

  if (!/^[a-z][a-z0-9_]*$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Username must start with a letter and contain only lowercase letters, numbers, or underscores (_).",
    };
  }

  // Prevent impersonating or colliding with Member ID format (e.g. sl595592)
  if (/^sl\d+$/i.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Username cannot follow the Member ID format (SL + numbers). Please choose a custom username.",
    };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      valid: false,
      normalized,
      error: "This username is reserved by the system. Please choose another username.",
    };
  }

  return { valid: true, normalized };
}

