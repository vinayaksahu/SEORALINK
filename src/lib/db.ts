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
    max: isServerless ? 15 : 25,
    idleTimeoutMillis: 300000, // Keep connections warm for 5 minutes instead of 30 seconds
    connectionTimeoutMillis: 15000, // 15s connection acquisition window
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    allowExitOnIdle: false,
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
export async function withDbRetry<T>(operation: () => Promise<T>, retries = 3, initialDelayMs = 800): Promise<T> {
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
        msg.includes("econnreset") ||
        msg.includes("econnrefused") ||
        msg.includes("socket") ||
        msg.includes("terminated") ||
        msg.includes("broken pipe") ||
        msg.includes("57p01") ||
        msg.includes("08006") ||
        msg.includes("08001") ||
        msg.includes("prismaclientinitializationerror") ||
        msg.includes("prepared statement");

      if (attempt < retries && isTransient) {
        const delay = initialDelayMs * (attempt + 1);
        console.warn(`[withDbRetry] Transient DB glitch on attempt ${attempt + 1}/${retries}. Retrying in ${delay}ms... (Error: ${err?.message})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
