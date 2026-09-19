import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    "postgresql://postgres:postgres@localhost:5432/seoralink?sslmode=disable";

  const isSSL = Boolean(
    connectionString.includes("sslmode=") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("aws") ||
    connectionString.includes("supabase.co")
  );

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NODE_ENV === "production"
  );

  const pool = new Pool({
    connectionString,
    max: isServerless ? 2 : 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 25000, // 25s to allow Neon cold-start wakeups
    ...(isSSL ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  pool.on("error", (err) => {
    console.error("[PG Pool Error]", err);
  });

  const schema = process.env.DB_SCHEMA || "public";
  const adapter = new PrismaPg(pool, { schema });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// In serverless/production, caching db in globalThis prevents opening multiple pg Pools per request
globalForPrisma.prisma = db;

/**
 * Executes a database operation with automatic retry for transient serverless cold-start connection timeouts
 */
export async function withDbRetry<T>(operation: () => Promise<T>, retries = 2, delayMs = 600): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message || "").toLowerCase();
      const isTransient =
        msg.includes("connection") ||
        msg.includes("timeout") ||
        msg.includes("slots are reserved") ||
        msg.includes("can't reach database") ||
        msg.includes("closed") ||
        msg.includes("econnreset");

      if (attempt < retries && isTransient) {
        console.warn(`[withDbRetry] Transient DB glitch on attempt ${attempt + 1}. Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
