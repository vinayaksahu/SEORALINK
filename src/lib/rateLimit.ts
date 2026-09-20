import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export interface RateLimitConfig {
  maxRequests: number; // Maximum allowed requests
  windowSeconds: number; // Time window in seconds
}

interface RateLimitRecord {
  count: number;
  resetTime: number; // Epoch timestamp in ms
}

// ---------------------------------------------------------------------------
// 1. Upstash Redis Distributed Engine (Used if credentials are in .env)
// ---------------------------------------------------------------------------
const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Cache Ratelimit instances by window config to avoid re-instantiation
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const configKey = `${maxRequests}:${windowSeconds}`;
  if (!upstashLimiters.has(configKey)) {
    upstashLimiters.set(
      configKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
        prefix: "seoralink_rl",
        analytics: true,
      })
    );
  }
  return upstashLimiters.get(configKey)!;
}

// ---------------------------------------------------------------------------
// 2. In-Memory Sliding Window Fallback (Used if Upstash is not configured or fails)
// ---------------------------------------------------------------------------
const memoryStore = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;

  for (const [key, record] of memoryStore.entries()) {
    if (record.resetTime <= now) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Extracts client IP safely supporting Cloudflare and reverse proxies.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;

  // Cloudflare header takes highest priority
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // X-Real-IP
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // X-Forwarded-For (take first IP in comma-separated list)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "127.0.0.1";
}

/**
 * In-Memory synchronous check (Fallback engine).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  cleanupStaleEntries();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const existing = memoryStore.get(key);

  if (!existing || existing.resetTime <= now) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetInSeconds: config.windowSeconds,
    };
  }

  if (existing.count >= config.maxRequests) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
  return {
    success: true,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetInSeconds,
  };
}

/**
 * Hybrid Distributed Rate Limit Check:
 * Uses Upstash Redis when available; seamlessly falls back to memory if not.
 */
export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig
): Promise<{
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}> {
  if (redis) {
    try {
      const limiter = getUpstashLimiter(config.maxRequests, config.windowSeconds);
      if (limiter) {
        const result = await limiter.limit(key);
        const resetInSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
        return {
          success: result.success,
          remaining: result.remaining,
          resetInSeconds,
        };
      }
    } catch (error) {
      console.warn("[Upstash RateLimit Error - Falling back to in-memory]", error);
    }
  }

  // Graceful fallback to memory
  return checkRateLimit(key, config);
}

/**
 * Standard HTTP 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(
  resetInSeconds: number,
  customMessage?: string
): NextResponse {
  const message =
    customMessage ||
    `Too many requests. Please slow down and try again in ${resetInSeconds} seconds.`;

  return NextResponse.json(
    {
      error: message,
      retryAfter: resetInSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetInSeconds),
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
