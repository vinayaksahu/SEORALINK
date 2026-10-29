import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBranchSystemConfig } from "@/lib/adminBranchConfig";
import NoticePopClient from "./NoticePopClient";

export const dynamic = "force-dynamic";

const DEFAULT_SCROLLING_NOTICE =
  "Welcome to the official Catalyst Capital trading platform • High Frequency AI Trading • Instant 0% Withdrawal Payouts • Daily ROI Active •";

export default async function AdminNoticePage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
    redirect("/adminlogin");
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

  const initialScrollingNotice = scrollingConfig.value ?? DEFAULT_SCROLLING_NOTICE;
  const initialPopupEnabled = popupEnabledConfig.value === "true";
  const initialPopupTitle = popupTitleConfig.value ?? "Catalyst Capital Ambassador Salary & Dividend Structure";
  const initialPopupImageUrl = popupImageUrlConfig.value ?? "/seoralink_promotional_poster.jpg";

  return (
    <NoticePopClient
      initialScrollingNotice={initialScrollingNotice}
      initialPopupEnabled={initialPopupEnabled}
      initialPopupTitle={initialPopupTitle}
      initialPopupImageUrl={initialPopupImageUrl}
    />
  );
}
