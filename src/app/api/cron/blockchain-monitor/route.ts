import { NextResponse } from "next/server";
import { runBlockchainMonitor } from "@/lib/blockchain/monitor";
import { serializeBlockchainData } from "@/lib/blockchain/config";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s timeout for serverless runner

async function handleMonitor(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET || "SL-cr0n-s3cr3t-2026-seoralink-key-x9p4";
    const providedSecret = authHeader?.replace("Bearer ", "").trim() || querySecret?.trim();

    let authorized = Boolean(providedSecret && providedSecret === expectedSecret);

    if (!authorized) {
      // Allow logged-in Admin or SuperRootAdmin to manually trigger reconciliation
      const session = await getSession();
      if (
        session &&
        (session.role === "SUPER_ROOT_ADMIN" || session.role === "SUPER_ADMIN" || session.role === "ADMIN")
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized cron or reconciliation trigger" }, { status: 401 });
    }

    const blocksParam = url.searchParams.get("blocks");
    const maxBlocks = blocksParam ? parseInt(blocksParam, 10) : 80;

    const result = await runBlockchainMonitor(isNaN(maxBlocks) ? 80 : maxBlocks);

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      result: serializeBlockchainData(result),
    });
  } catch (error: any) {
    console.error("[Cron Blockchain Monitor Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute blockchain monitor cycle" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleMonitor(req);
}

export async function POST(req: Request) {
  return handleMonitor(req);
}
