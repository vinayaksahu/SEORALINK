import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { activateUserAccount } from "@/lib/activation";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const result = await activateUserAccount(session.userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Activation Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to activate account" },
      { status: 400 }
    );
  }
}
