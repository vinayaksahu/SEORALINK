import "dotenv/config";
import { db, withDbRetry } from "../src/lib/db";

async function main() {
  console.log("🚀 Running Deposit System database migration...");

  await withDbRetry(async () => {
    // 1. Add depositMode to User if not exists
    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'User' AND column_name = 'depositMode'
        ) THEN
          ALTER TABLE "seoralink"."User" ADD COLUMN "depositMode" TEXT NOT NULL DEFAULT 'GLOBAL';
        END IF;
      END $$;
    `);
    console.log("✅ User.depositMode column ensured");

    // 2. Extend DepositRequest columns
    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- amountInUsdt
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'amountInUsdt'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "amountInUsdt" NUMERIC(20, 8) NOT NULL DEFAULT 0.0;
          UPDATE "seoralink"."DepositRequest" SET "amountInUsdt" = "amount";
        END IF;

        -- tokenContract
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'tokenContract'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "tokenContract" TEXT;
        END IF;

        -- fromAddress
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'fromAddress'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "fromAddress" TEXT;
        END IF;

        -- toAddress
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'toAddress'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "toAddress" TEXT;
        END IF;

        -- blockNumber
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'blockNumber'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "blockNumber" BIGINT;
        END IF;

        -- confirmations
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'confirmations'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "confirmations" INTEGER NOT NULL DEFAULT 0;
        END IF;

        -- processingMode
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'processingMode'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "processingMode" TEXT NOT NULL DEFAULT 'MANUAL';
        END IF;

        -- Change status from enum to text if needed
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'status' AND data_type = 'USER-DEFINED'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
        END IF;

        -- rejectionReason
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'rejectionReason'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "rejectionReason" TEXT;
        END IF;

        -- approvalNotes
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'approvalNotes'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "approvalNotes" TEXT;
        END IF;

        -- reviewedBy
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'reviewedBy'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "reviewedBy" TEXT;
        END IF;

        -- detectedAt
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'detectedAt'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "detectedAt" TIMESTAMPTZ;
        END IF;

        -- confirmedAt
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'confirmedAt'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "confirmedAt" TIMESTAMPTZ;
        END IF;

        -- creditedAt
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'creditedAt'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "creditedAt" TIMESTAMPTZ;
        END IF;

        -- reviewedAt
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'reviewedAt'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "reviewedAt" TIMESTAMPTZ;
        END IF;

        -- updatedAt
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'seoralink' AND table_name = 'DepositRequest' AND column_name = 'updatedAt'
        ) THEN
          ALTER TABLE "seoralink"."DepositRequest" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();
        END IF;
      END $$;
    `);

    // Indexes for DepositRequest
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DepositRequest_toAddress_tokenContract_idx" ON "seoralink"."DepositRequest"("toAddress", "tokenContract");
      CREATE INDEX IF NOT EXISTS "DepositRequest_processingMode_status_idx" ON "seoralink"."DepositRequest"("processingMode", "status");
      CREATE INDEX IF NOT EXISTS "DepositRequest_blockNumber_idx" ON "seoralink"."DepositRequest"("blockNumber");
    `);
    console.log("✅ DepositRequest columns and indexes ensured");

    // 3. Create DepositAddress table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "seoralink"."DepositAddress" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "network" TEXT NOT NULL DEFAULT 'BSC',
        "asset" TEXT NOT NULL DEFAULT 'USDT',
        "address" TEXT NOT NULL UNIQUE,
        "derivationIndex" INTEGER NOT NULL UNIQUE,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "DepositAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "seoralink"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "DepositAddress_userId_idx" ON "seoralink"."DepositAddress"("userId");
      CREATE INDEX IF NOT EXISTS "DepositAddress_address_idx" ON "seoralink"."DepositAddress"("address");
    `);
    console.log("✅ DepositAddress table ensured");

    // 4. Create BlockchainCheckpoint table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "seoralink"."BlockchainCheckpoint" (
        "id" TEXT PRIMARY KEY,
        "lastProcessedBlock" BIGINT NOT NULL,
        "latestKnownBlock" BIGINT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'IDLE',
        "lastSuccessfulScan" TIMESTAMPTZ,
        "lastError" TEXT,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ BlockchainCheckpoint table ensured");

    // 5. Create AdminDepositPermission table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "seoralink"."AdminDepositPermission" (
        "id" TEXT PRIMARY KEY,
        "adminId" TEXT NOT NULL,
        "permission" TEXT NOT NULL,
        "grantedById" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "AdminDepositPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "seoralink"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "AdminDepositPermission_adminId_permission_key" UNIQUE ("adminId", "permission")
      );
      CREATE INDEX IF NOT EXISTS "AdminDepositPermission_adminId_idx" ON "seoralink"."AdminDepositPermission"("adminId");
    `);
    console.log("✅ AdminDepositPermission table ensured");
  });

  console.log("🎉 All deposit system tables and schema extensions created successfully!");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
