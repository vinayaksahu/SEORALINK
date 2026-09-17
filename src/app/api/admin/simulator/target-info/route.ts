import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTargetUserTelemetry } from "@/lib/simulator";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Administrative privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get("identifier");

    if (!identifier) {
      return NextResponse.json({ error: "Identifier is required" }, { status: 400 });
    }

    const telemetry = await getTargetUserTelemetry(identifier);
    if (!telemetry) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(telemetry);
  } catch (err: any) {
    console.error("[Target Info Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch target user info" },
      { status: 500 }
    );
  }
}
