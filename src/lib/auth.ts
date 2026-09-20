import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const DEFAULT_FALLBACK_SECRET = "seoralink-default-jwt-secret-key-2026-auth";
const rawSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === "production" && (!rawSecret || rawSecret === DEFAULT_FALLBACK_SECRET)) {
  console.error(
    "⚠️ [CRITICAL SECURITY WARNING] JWT_SECRET is not configured or is using default insecure fallback in production environment! Set a strong random JWT_SECRET in your environment variables immediately."
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
