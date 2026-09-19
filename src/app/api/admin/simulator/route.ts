import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { runDummyUserSimulation } from "@/lib/simulator";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: "Administrative privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      mode,
      targetUserIdentifier,
      targetTier,
      count,
      autoActivate,
      sponsorStrategy,
      namePrefix,
    } = body;

    if (!mode) {
      return NextResponse.json({ error: "Simulation mode is required" }, { status: 400 });
    }

    const result = await runDummyUserSimulation({
      mode,
      targetUserIdentifier,
      targetTier: typeof targetTier === "number" ? targetTier : undefined,
      count: typeof count === "number" ? count : 1,
      autoActivate: autoActivate !== false,
      sponsorStrategy,
      namePrefix,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Simulator API Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute simulation" },
      { status: 500 }
    );
  }
}
