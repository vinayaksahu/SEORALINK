import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { usdtAddress, network } = await req.json();

    if (usdtAddress) {
      await db.systemConfig.upsert({
        where: { key: "USDT_DEPOSIT_ADDRESS" },
        update: { value: usdtAddress.trim() },
        create: {
          key: "USDT_DEPOSIT_ADDRESS",
          value: usdtAddress.trim(),
          description: "Official USDT deposit wallet address for member fund top-up",
        },
      });
    }

    if (network) {
      await db.systemConfig.upsert({
        where: { key: "DEFAULT_NETWORK" },
        update: { value: network.trim() },
        create: {
          key: "DEFAULT_NETWORK",
          value: network.trim(),
          description: "Default deposit blockchain network",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "System configuration updated successfully.",
    });
  } catch (error: any) {
    console.error("[Settings Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update configuration" },
      { status: 500 }
    );
  }
}
