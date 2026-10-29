import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchSystemConfig, saveBranchSystemConfig } from "@/lib/adminBranchConfig";

export const dynamic = "force-dynamic";

const DEFAULT_SCROLLING_NOTICE =
  "Welcome to the official Catalyst Capital trading platform • High Frequency AI Trading • Instant 0% Withdrawal Payouts • Daily ROI Active •";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const adminRef = session.userId;

    const [
      scrollingConfig,
      popupEnabledConfig,
      popupTitleConfig,
      popupImageUrlConfig,
    ] = await Promise.all([
      getBranchSystemConfig("SCROLLING_NOTICE_TEXT", adminRef),
      getBranchSystemConfig("POPUP_IMAGE_ENABLED", adminRef),
      getBranchSystemConfig("POPUP_IMAGE_TITLE", adminRef),
      getBranchSystemConfig("POPUP_IMAGE_URL", adminRef),
    ]);

    const scrollingNotice = scrollingConfig.value ?? DEFAULT_SCROLLING_NOTICE;
    const popupEnabled = popupEnabledConfig.value === "true";
    const popupTitle = popupTitleConfig.value ?? "Official Announcement";
    const popupImageUrl = popupImageUrlConfig.value ?? "/seoralink_promotional_poster.jpg";

    return NextResponse.json({
      success: true,
      data: {
        scrollingNotice,
        popupEnabled,
        popupTitle,
        popupImageUrl,
      },
    });
  } catch (error: any) {
    console.error("[Admin Notice GET Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve notice configurations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const adminRef = session.userId;
    const body = await req.json();
    const { action } = body;

    if (action === "save_scrolling") {
      const scrollingNotice = typeof body.scrollingNotice === "string" ? body.scrollingNotice.trim() : "";
      
      await saveBranchSystemConfig("SCROLLING_NOTICE_TEXT", scrollingNotice, adminRef, "Member Dashboard Scrolling Notice Text");
      await db.systemConfig.upsert({
        where: { key: "SCROLLING_NOTICE_TEXT" },
        update: { value: scrollingNotice, description: "Global Member Dashboard Scrolling Notice Text" },
        create: { key: "SCROLLING_NOTICE_TEXT", value: scrollingNotice, description: "Global Member Dashboard Scrolling Notice Text" },
      });

      return NextResponse.json({
        success: true,
        message: "Scrolling notice text updated successfully.",
        scrollingNotice,
      });
    }

    if (action === "save_popup") {
      const popupEnabled = Boolean(body.popupEnabled);
      const popupTitle = typeof body.popupTitle === "string" ? body.popupTitle.trim() : "";
      const popupImageUrl = typeof body.popupImageUrl === "string" ? body.popupImageUrl.trim() : "";

      const enabledStr = popupEnabled ? "true" : "false";

      await Promise.all([
        saveBranchSystemConfig("POPUP_IMAGE_ENABLED", enabledStr, adminRef, "Member Login Pop Image Enabled Status"),
        saveBranchSystemConfig("POPUP_IMAGE_TITLE", popupTitle, adminRef, "Member Login Pop Image Caption/Title"),
        saveBranchSystemConfig("POPUP_IMAGE_URL", popupImageUrl, adminRef, "Member Login Pop Image URL"),
        db.systemConfig.upsert({
          where: { key: "POPUP_IMAGE_ENABLED" },
          update: { value: enabledStr, description: "Global Member Login Pop Image Enabled Status" },
          create: { key: "POPUP_IMAGE_ENABLED", value: enabledStr, description: "Global Member Login Pop Image Enabled Status" },
        }),
        db.systemConfig.upsert({
          where: { key: "POPUP_IMAGE_TITLE" },
          update: { value: popupTitle, description: "Global Member Login Pop Image Caption/Title" },
          create: { key: "POPUP_IMAGE_TITLE", value: popupTitle, description: "Global Member Login Pop Image Caption/Title" },
        }),
        db.systemConfig.upsert({
          where: { key: "POPUP_IMAGE_URL" },
          update: { value: popupImageUrl, description: "Global Member Login Pop Image URL" },
          create: { key: "POPUP_IMAGE_URL", value: popupImageUrl, description: "Global Member Login Pop Image URL" },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Pop image announcement updated successfully.",
        popupEnabled,
        popupTitle,
        popupImageUrl,
      });
    }

    if (action === "remove_popup") {
      await Promise.all([
        saveBranchSystemConfig("POPUP_IMAGE_ENABLED", "false", adminRef, "Member Login Pop Image Enabled Status"),
        saveBranchSystemConfig("POPUP_IMAGE_URL", "", adminRef, "Member Login Pop Image URL"),
        db.systemConfig.upsert({
          where: { key: "POPUP_IMAGE_ENABLED" },
          update: { value: "false", description: "Global Member Login Pop Image Enabled Status" },
          create: { key: "POPUP_IMAGE_ENABLED", value: "false", description: "Global Member Login Pop Image Enabled Status" },
        }),
        db.systemConfig.upsert({
          where: { key: "POPUP_IMAGE_URL" },
          update: { value: "", description: "Global Member Login Pop Image URL" },
          create: { key: "POPUP_IMAGE_URL", value: "", description: "Global Member Login Pop Image URL" },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Pop image announcement removed successfully.",
        popupEnabled: false,
        popupImageUrl: "",
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Notice POST Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notice configurations" },
      { status: 500 }
    );
  }
}
