import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();

    // Fetch all database records across models
    const [
      systemConfigs,
      users,
      queueEntries,
      ledgerEntries,
      depositRequests,
      withdrawalRequests,
      supportTickets,
    ] = await Promise.all([
      db.systemConfig.findMany({ orderBy: { key: "asc" } }),
      db.user.findMany({ orderBy: { createdAt: "asc" } }),
      db.queueEntry.findMany({ orderBy: [{ tier: "asc" }, { queueIndex: "asc" }] }),
      db.ledgerEntry.findMany({ orderBy: { createdAt: "asc" } }),
      db.depositRequest.findMany({ orderBy: { createdAt: "asc" } }),
      db.withdrawalRequest.findMany({ orderBy: { createdAt: "asc" } }),
      db.supportTicket.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    // Format for serialization (convert Decimals to string/number and Dates to ISO strings)
    const formattedUsers = users.map((u) => ({
      ...u,
      fundBalance: u.fundBalance.toString(),
      incomeBalance: u.incomeBalance.toString(),
      totalEarned: u.totalEarned.toString(),
      totalWithdrawn: u.totalWithdrawn.toString(),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    const formattedQueueEntries = queueEntries.map((q) => ({
      ...q,
      matchedAt: q.matchedAt ? q.matchedAt.toISOString() : null,
      upgradedAt: q.upgradedAt ? q.upgradedAt.toISOString() : null,
      createdAt: q.createdAt.toISOString(),
    }));

    const formattedLedgerEntries = ledgerEntries.map((l) => ({
      ...l,
      amount: l.amount.toString(),
      balanceBefore: l.balanceBefore.toString(),
      balanceAfter: l.balanceAfter.toString(),
      createdAt: l.createdAt.toISOString(),
    }));

    const formattedDepositRequests = depositRequests.map((d) => ({
      ...d,
      amount: d.amount.toString(),
      approvedAt: d.approvedAt ? d.approvedAt.toISOString() : null,
      createdAt: d.createdAt.toISOString(),
    }));

    const formattedWithdrawalRequests = withdrawalRequests.map((w) => ({
      ...w,
      amount: w.amount.toString(),
      feePercent: w.feePercent.toString(),
      feeAmount: w.feeAmount.toString(),
      netAmount: w.netAmount.toString(),
      processedAt: w.processedAt ? w.processedAt.toISOString() : null,
      createdAt: w.createdAt.toISOString(),
    }));

    const formattedSupportTickets = supportTickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    const formattedSystemConfigs = systemConfigs.map((c) => ({
      ...c,
      updatedAt: c.updatedAt.toISOString(),
    }));

    const dateSlug = new Date().toISOString().split("T")[0];

    // 1. JSON Export Format
    if (format === "json") {
      const payload = {
        metadata: {
          app: "SEORALINK",
          version: "1.0.0",
          exportDate: new Date().toISOString(),
          exportedBy: session.email,
          totalRecords:
            formattedUsers.length +
            formattedQueueEntries.length +
            formattedLedgerEntries.length +
            formattedDepositRequests.length +
            formattedWithdrawalRequests.length +
            formattedSupportTickets.length +
            formattedSystemConfigs.length,
          counts: {
            users: formattedUsers.length,
            queueEntries: formattedQueueEntries.length,
            ledgerEntries: formattedLedgerEntries.length,
            depositRequests: formattedDepositRequests.length,
            withdrawalRequests: formattedWithdrawalRequests.length,
            supportTickets: formattedSupportTickets.length,
            systemConfigs: formattedSystemConfigs.length,
          },
        },
        data: {
          systemConfigs: formattedSystemConfigs,
          users: formattedUsers,
          queueEntries: formattedQueueEntries,
          ledgerEntries: formattedLedgerEntries,
          depositRequests: formattedDepositRequests,
          withdrawalRequests: formattedWithdrawalRequests,
          supportTickets: formattedSupportTickets,
        },
      };

      return new Response(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="seoralink-backup-${dateSlug}.json"`,
        },
      });
    }

    // 2. Excel (.xlsx) Export Format
    if (format === "excel" || format === "xlsx") {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        { Parameter: "Platform", Value: "SEORALINK Enterprise" },
        { Parameter: "Backup Generated At", Value: new Date().toISOString() },
        { Parameter: "Exported By Admin", Value: session.email },
        { Parameter: "Total Users", Value: formattedUsers.length },
        { Parameter: "Total Queue Entries", Value: formattedQueueEntries.length },
        { Parameter: "Total Ledger Transactions", Value: formattedLedgerEntries.length },
        { Parameter: "Total Deposit Requests", Value: formattedDepositRequests.length },
        { Parameter: "Total Withdrawal Requests", Value: formattedWithdrawalRequests.length },
        { Parameter: "Total Support Tickets", Value: formattedSupportTickets.length },
        { Parameter: "Total System Configs", Value: formattedSystemConfigs.length },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Overview");

      // Users sheet
      if (formattedUsers.length > 0) {
        const usersSheet = XLSX.utils.json_to_sheet(formattedUsers);
        XLSX.utils.book_append_sheet(workbook, usersSheet, "Users");
      }

      // Queue Entries sheet
      if (formattedQueueEntries.length > 0) {
        const queueSheet = XLSX.utils.json_to_sheet(formattedQueueEntries);
        XLSX.utils.book_append_sheet(workbook, queueSheet, "QueueEntries");
      }

      // Ledger Entries sheet
      if (formattedLedgerEntries.length > 0) {
        const ledgerSheet = XLSX.utils.json_to_sheet(formattedLedgerEntries);
        XLSX.utils.book_append_sheet(workbook, ledgerSheet, "LedgerEntries");
      }

      // Deposit Requests sheet
      if (formattedDepositRequests.length > 0) {
        const depositSheet = XLSX.utils.json_to_sheet(formattedDepositRequests);
        XLSX.utils.book_append_sheet(workbook, depositSheet, "DepositRequests");
      }

      // Withdrawal Requests sheet
      if (formattedWithdrawalRequests.length > 0) {
        const withdrawSheet = XLSX.utils.json_to_sheet(formattedWithdrawalRequests);
        XLSX.utils.book_append_sheet(workbook, withdrawSheet, "WithdrawalRequests");
      }

      // Support Tickets sheet
      if (formattedSupportTickets.length > 0) {
        const ticketsSheet = XLSX.utils.json_to_sheet(formattedSupportTickets);
        XLSX.utils.book_append_sheet(workbook, ticketsSheet, "SupportTickets");
      }

      // System Configs sheet
      if (formattedSystemConfigs.length > 0) {
        const configsSheet = XLSX.utils.json_to_sheet(formattedSystemConfigs);
        XLSX.utils.book_append_sheet(workbook, configsSheet, "SystemConfigs");
      }

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="seoralink-backup-${dateSlug}.xlsx"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format requested. Must be 'json' or 'excel'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Backup Export Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate database backup" },
      { status: 500 }
    );
  }
}
