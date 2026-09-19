import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const configs = await db.systemConfig.findMany({
      orderBy: { key: "asc" },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    return NextResponse.json({
      success: true,
      configs: configMap,
      rawConfigs: configs,
    });
  } catch (error: any) {
    console.error("[SuperAdmin Config GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load configurations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ROOT_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Root Admin access required." },
        { status: 403 }
      );
    }

    const { configs } = await req.json();
    if (!configs || typeof configs !== "object") {
      return NextResponse.json({ error: "configs object is required." }, { status: 400 });
    }

    for (const [key, value] of Object.entries(configs)) {
      if (typeof value === "string") {
        await db.systemConfig.upsert({
          where: { key },
          update: { value },
          create: {
            key,
            value,
            description: `Super Root updated configuration for ${key}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Global system configurations saved live successfully.",
    });
  } catch (error: any) {
    console.error("[SuperAdmin Config POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configurations." },
      { status: 500 }
    );
  }
}
