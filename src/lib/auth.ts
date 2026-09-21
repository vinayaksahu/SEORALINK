import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const DEFAULT_FALLBACK_SECRET = "seoralink-default-jwt-secret-key-2026-auth";
const rawSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && (!rawSecret || rawSecret === DEFAULT_FALLBACK_SECRET)) {
  console.error("CRITICAL: Missing JWT_SECRET in production environment!");
  throw new Error(
    "FATAL SECURITY CONFIGURATION: JWT_SECRET must be explicitly configured in production environment variables."
  );
}

const secretKey = rawSecret || DEFAULT_FALLBACK_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  customId: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "SUPER_ROOT_ADMIN";
  email: string;
  fullName: string;
  adminId?: string | null;
}

export function isAdmin(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPER_ROOT_ADMIN";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function comparePin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sl_session")?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Validates session against database to ensure user exists, has not been
 * blocked or suspended, and reflects current live role.
 */
export async function getValidatedSession(): Promise<(SessionPayload & { status: string }) | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const { db } = await import("./db");
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { status: true, role: true },
    });

    if (!user || user.status === "BLOCKED" || user.status === "SUSPENDED") {
      return null;
    }

    return {
      ...session,
      role: user.role,
      status: user.status,
    };
  } catch {
    return null;
  }
}
