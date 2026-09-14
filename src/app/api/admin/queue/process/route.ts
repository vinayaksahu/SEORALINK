import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processTierQueue } from "@/lib/queueEngine";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { tier } = await req.json().catch(() => ({ tier: 0 }));

    let totalMatches = 0;
    if (typeof tier === "number" && tier >= 0 && tier <= 12) {
      totalMatches = await processTierQueue(tier);
    } else {
      // Process all tiers
      for (let t = 0; t <= 12; t++) {
        totalMatches += await processTierQueue(t);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Queue reconciliation complete. Processed ${totalMatches} matches across tiers.`,
      totalMatches,
    });
  } catch (error: any) {
    console.error("[Queue Process Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process queue" },
      { status: 500 }
    );
  }
}
