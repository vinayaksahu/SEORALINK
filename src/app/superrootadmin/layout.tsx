import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SuperRootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ROOT_ADMIN") {
    redirect("/superrootadminlogin");
  }

  return <>{children}</>;
}
