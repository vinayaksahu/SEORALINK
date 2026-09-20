import { db } from "@/lib/db";
import { getClientIp } from "@/lib/rateLimit";

export interface GeoDeviceInfo {
  ipAddress: string;
  country: string;
  city: string;
  userAgent: string;
  deviceType: "MOBILE" | "DESKTOP" | "TABLET" | "UNKNOWN";
  browser: string;
  os: string;
}

/**
 * Parses client IP, Geo location headers (Cloudflare / Vercel), and User-Agent
 */
export function parseDeviceAndGeo(req: Request): GeoDeviceInfo {
  const ipAddress = getClientIp(req);

  // Cloudflare & Vercel edge geolocation headers
  const countryHeader =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    "";
  const cityHeader =
    req.headers.get("cf-ipcity") ||
    req.headers.get("x-vercel-ip-city") ||
    "";

  const rawUserAgent = req.headers.get("user-agent") || "Unknown Browser / Client";

  // Device detection
  let deviceType: "MOBILE" | "DESKTOP" | "TABLET" | "UNKNOWN" = "DESKTOP";
  const uaLower = rawUserAgent.toLowerCase();

  if (/ipad|tablet|(android(?!.*mobile))/i.test(rawUserAgent)) {
    deviceType = "TABLET";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(rawUserAgent)) {
    deviceType = "MOBILE";
  } else if (/macintosh|windows|linux|cros/i.test(rawUserAgent)) {
    deviceType = "DESKTOP";
  } else {
    deviceType = "UNKNOWN";
  }

  // OS detection
  let os = "Other OS";
  if (/windows nt 10\.0/i.test(rawUserAgent)) os = "Windows 10/11";
  else if (/windows nt 6\.3/i.test(rawUserAgent)) os = "Windows 8.1";
  else if (/windows nt 6\.1/i.test(rawUserAgent)) os = "Windows 7";
  else if (/windows/i.test(rawUserAgent)) os = "Windows";
  else if (/iphone os ([0-9_]+)/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/iphone os ([0-9_]+)/i)?.[1]?.replace(/_/g, ".") || "";
    os = `iOS ${v}`;
  } else if (/ipad.*os ([0-9_]+)/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/os ([0-9_]+)/i)?.[1]?.replace(/_/g, ".") || "";
    os = `iPadOS ${v}`;
  } else if (/android ([0-9.]+)/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/android ([0-9.]+)/i)?.[1] || "";
    os = `Android ${v}`;
  } else if (/mac os x ([0-9_]+)/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/mac os x ([0-9_]+)/i)?.[1]?.replace(/_/g, ".") || "";
    os = `macOS ${v}`;
  } else if (/cros/i.test(rawUserAgent)) os = "ChromeOS";
  else if (/linux/i.test(rawUserAgent)) os = "Linux";

  // Browser detection
  let browser = "Web Browser";
  if (/edg\/([0-9.]+)/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/edg\/([0-9.]+)/i)?.[1]?.split(".")[0] || "";
    browser = `Edge ${v}`;
  } else if (/samsungbrowser\/([0-9.]+)/i.test(rawUserAgent)) {
    browser = "Samsung Internet";
  } else if (/chrome\/([0-9.]+)/i.test(rawUserAgent) && !/edg/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/chrome\/([0-9.]+)/i)?.[1]?.split(".")[0] || "";
    browser = `Chrome ${v}`;
  } else if (/firefox\/([0-9.]+)/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/firefox\/([0-9.]+)/i)?.[1]?.split(".")[0] || "";
    browser = `Firefox ${v}`;
  } else if (/version\/([0-9.]+).*safari/i.test(rawUserAgent)) {
    const v = rawUserAgent.match(/version\/([0-9.]+)/i)?.[1]?.split(".")[0] || "";
    browser = `Safari ${v}`;
  } else if (/opera|opr\/([0-9.]+)/i.test(rawUserAgent)) {
    browser = "Opera";
  }

  // Country / City formatting
  let country = countryHeader ? countryHeader.toUpperCase().trim() : "Local/Internal";
  let city = cityHeader ? decodeURIComponent(cityHeader).trim() : "";

  if (ipAddress === "127.0.0.1" || ipAddress === "::1" || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
    country = "Local/Private";
    city = "Internal Network";
  }

  return {
    ipAddress,
    country,
    city: city || "Unknown City",
    userAgent: rawUserAgent,
    deviceType,
    browser,
    os,
  };
}

export interface RecordLoginParams {
  req: Request;
  userId?: string | null;
  customId: string;
  fullName?: string | null;
  role?: string;
  adminId?: string | null;
  status: "SUCCESS" | "FAILED";
  failureReason?: string | null;
  portal?: "member" | "admin" | "super_root";
}

/**
 * Safely record a login session event
 */
export async function recordLoginSession(params: RecordLoginParams): Promise<void> {
  try {
    const geo = parseDeviceAndGeo(params.req);

    await db.userSessionLog.create({
      data: {
        userId: params.userId || null,
        customId: params.customId.toUpperCase().trim(),
        fullName: params.fullName || null,
        role: params.role || "USER",
        adminId: params.adminId || null,
        ipAddress: geo.ipAddress,
        country: geo.country,
        city: geo.city,
        userAgent: geo.userAgent,
        deviceType: geo.deviceType,
        browser: geo.browser,
        os: geo.os,
        status: params.status,
        failureReason: params.failureReason || null,
        portal: params.portal || "member",
      },
    });
  } catch (err) {
    // Non-blocking logger: never fail primary request
    console.error("[AuditLogger recordLoginSession Error]:", err);
  }
}

export interface RecordActivityParams {
  req?: Request | null;
  userId?: string | null;
  customId: string;
  fullName?: string | null;
  role?: string;
  adminId?: string | null;
  action: string;
  category: "AUTH" | "FINANCE" | "SECURITY" | "SYSTEM" | "MEMBER";
  details?: any;
  targetUserId?: string | null;
  targetCustomId?: string | null;
}

/**
 * Safely record a function usage or administrative audit activity
 */
export async function recordActivity(params: RecordActivityParams): Promise<void> {
  try {
    let geo: GeoDeviceInfo = {
      ipAddress: "127.0.0.1",
      country: "System",
      city: "Server Internal",
      userAgent: "System Automated Trigger",
      deviceType: "UNKNOWN",
      browser: "Node.js / Internal",
      os: "Server",
    };

    if (params.req) {
      geo = parseDeviceAndGeo(params.req);
    }

    let detailsString: string | null = null;
    if (params.details !== undefined && params.details !== null) {
      if (typeof params.details === "string") {
        detailsString = params.details;
      } else {
        try {
          detailsString = JSON.stringify(params.details);
        } catch {
          detailsString = String(params.details);
        }
      }
    }

    await db.activityLog.create({
      data: {
        userId: params.userId || null,
        customId: params.customId.toUpperCase().trim(),
        fullName: params.fullName || null,
        role: params.role || "USER",
        adminId: params.adminId || null,
        action: params.action.toUpperCase().trim(),
        category: params.category,
        details: detailsString,
        targetUserId: params.targetUserId || null,
        targetCustomId: params.targetCustomId ? params.targetCustomId.toUpperCase().trim() : null,
        ipAddress: geo.ipAddress,
        country: geo.country,
        city: geo.city,
        userAgent: geo.userAgent,
        deviceType: geo.deviceType,
        browser: geo.browser,
        os: geo.os,
      },
    });
  } catch (err) {
    // Non-blocking logger: never fail primary request
    console.error("[AuditLogger recordActivity Error]:", err);
  }
}
