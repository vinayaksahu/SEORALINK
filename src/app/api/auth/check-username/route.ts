import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateUsernameFormat } from "@/lib/utils";
import { getClientIp, checkRateLimitAsync, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: max 30 username checks per minute per IP to prevent automated enumeration
    const limit = await checkRateLimitAsync(`check-username:ip:${clientIp}`, {
      maxRequests: 30,
      windowSeconds: 60,
    });
    if (!limit.success) {
      return rateLimitResponse(
        limit.resetInSeconds,
        "Too many username checks. Please wait a moment."
      );
    }

    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");

    const validation = validateUsernameFormat(rawUsername);
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        normalized: validation.normalized,
        error: validation.error,
      });
    }

    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: { equals: validation.normalized, mode: "insensitive" } },
          { customId: { equals: validation.normalized, mode: "insensitive" } },
          { referralCode: { equals: validation.normalized, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        available: false,
        normalized: validation.normalized,
        error: `Username "${validation.normalized}" is already taken. Please choose another.`,
      });
    }

    return NextResponse.json({
      available: true,
      normalized: validation.normalized,
    });
  } catch (error: any) {
    console.error("[Check Username Error]", error);
    return NextResponse.json(
      { available: false, error: "Unable to verify username availability." },
      { status: 500 }
    );
  }
}
