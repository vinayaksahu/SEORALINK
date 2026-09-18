import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

interface BackupDataPayload {
  systemConfigs: any[];
  users: any[];
  queueEntries: any[];
  ledgerEntries: any[];
  depositRequests: any[];
  withdrawalRequests: any[];
  supportTickets: any[];
}

function parseBackupData(buffer: Buffer, filename: string): BackupDataPayload {
  const isExcel = filename.endsWith(".xlsx") || filename.endsWith(".xls");

  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const getSheetData = (sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      return sheet ? XLSX.utils.sheet_to_json(sheet) : [];
    };

    return {
      systemConfigs: getSheetData("SystemConfigs"),
      users: getSheetData("Users"),
      queueEntries: getSheetData("QueueEntries"),
      ledgerEntries: getSheetData("LedgerEntries"),
      depositRequests: getSheetData("DepositRequests"),
      withdrawalRequests: getSheetData("WithdrawalRequests"),
      supportTickets: getSheetData("SupportTickets"),
    };
  }

  // Parse JSON
  const text = buffer.toString("utf-8");
  const json = JSON.parse(text);
  const data = json.data || json;

  return {
    systemConfigs: Array.isArray(data.systemConfigs) ? data.systemConfigs : [],
    users: Array.isArray(data.users) ? data.users : [],
    queueEntries: Array.isArray(data.queueEntries) ? data.queueEntries : [],
    ledgerEntries: Array.isArray(data.ledgerEntries) ? data.ledgerEntries : [],
    depositRequests: Array.isArray(data.depositRequests) ? data.depositRequests : [],
    withdrawalRequests: Array.isArray(data.withdrawalRequests) ? data.withdrawalRequests : [],
    supportTickets: Array.isArray(data.supportTickets) ? data.supportTickets : [],
  };
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = (formData.get("action") as string) || "preview"; // "preview" | "restore"
    const mode = (formData.get("mode") as string) || "clean"; // "clean" | "merge"

    if (!file) {
      return NextResponse.json({ error: "No backup file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = parseBackupData(buffer, file.name.toLowerCase());

    const summary = {
      users: data.users.length,
      queueEntries: data.queueEntries.length,
      ledgerEntries: data.ledgerEntries.length,
      depositRequests: data.depositRequests.length,
      withdrawalRequests: data.withdrawalRequests.length,
      supportTickets: data.supportTickets.length,
      systemConfigs: data.systemConfigs.length,
      totalRecords:
        data.users.length +
        data.queueEntries.length +
        data.ledgerEntries.length +
        data.depositRequests.length +
        data.withdrawalRequests.length +
        data.supportTickets.length +
        data.systemConfigs.length,
    };

    // If only preview requested, return parsed summary counts
    if (action === "preview") {
      return NextResponse.json({
        success: true,
        preview: true,
        filename: file.name,
        summary,
      });
    }

    // Execution / Restoration Phase
    if (action === "restore") {
      // 1. If Clean mode, wipe target tables in reverse dependency order
      if (mode === "clean") {
        await db.supportTicket.deleteMany();
        await db.withdrawalRequest.deleteMany();
        await db.depositRequest.deleteMany();
        await db.ledgerEntry.deleteMany();
        await db.queueEntry.deleteMany();
        // Disconnect self-referential sponsorId first to avoid FK constraint on user deletion
        await db.user.updateMany({ data: { sponsorId: null } });
        await db.user.deleteMany();
        await db.systemConfig.deleteMany();
      }

      // 2. Restore SystemConfig
      for (const c of data.systemConfigs) {
        if (!c.key) continue;
        await db.systemConfig.upsert({
          where: { key: String(c.key) },
          update: {
            value: String(c.value ?? ""),
            description: c.description ? String(c.description) : null,
          },
          create: {
            id: c.id ? String(c.id) : undefined,
            key: String(c.key),
            value: String(c.value ?? ""),
            description: c.description ? String(c.description) : null,
          },
        });
      }

      // 3. Restore Users - Pass 1: Insert all users without sponsorId to avoid FK errors
      for (const u of data.users) {
        if (!u.id || !u.email) continue;
        const validRole = ["SUPER_ADMIN", "ADMIN", "USER"].includes(u.role) ? u.role : "USER";
        const validStatus = ["INACTIVE", "ACTIVE", "SUSPENDED", "BLOCKED"].includes(u.status)
          ? u.status
          : "INACTIVE";

        await db.user.upsert({
          where: { id: String(u.id) },
          update: {
            customId: String(u.customId || `SL${Math.floor(100000 + Math.random() * 900000)}`),
            fullName: String(u.fullName || "Member"),
            email: String(u.email),
            phone: u.phone ? String(u.phone) : null,
            passwordHash: String(u.passwordHash),
            transactionPin: u.transactionPin ? String(u.transactionPin) : null,
            role: validRole,
            status: validStatus,
            referralCode: String(u.referralCode || u.customId),
            usdtAddress: u.usdtAddress ? String(u.usdtAddress) : null,
            usdtNetwork: u.usdtNetwork ? String(u.usdtNetwork) : "USDT_BEP20",
            currentTier: Number(u.currentTier || 0),
            directCount: Number(u.directCount || 0),
            fundBalance: String(u.fundBalance ?? 0),
            incomeBalance: String(u.incomeBalance ?? 0),
            totalEarned: String(u.totalEarned ?? 0),
            totalWithdrawn: String(u.totalWithdrawn ?? 0),
            createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
            updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
          },
          create: {
            id: String(u.id),
            customId: String(u.customId || `SL${Math.floor(100000 + Math.random() * 900000)}`),
            fullName: String(u.fullName || "Member"),
            email: String(u.email),
            phone: u.phone ? String(u.phone) : null,
            passwordHash: String(u.passwordHash),
            transactionPin: u.transactionPin ? String(u.transactionPin) : null,
            role: validRole,
            status: validStatus,
            referralCode: String(u.referralCode || u.customId),
            sponsorId: null, // Linked in pass 2
            usdtAddress: u.usdtAddress ? String(u.usdtAddress) : null,
            usdtNetwork: u.usdtNetwork ? String(u.usdtNetwork) : "USDT_BEP20",
            currentTier: Number(u.currentTier || 0),
            directCount: Number(u.directCount || 0),
            fundBalance: String(u.fundBalance ?? 0),
            incomeBalance: String(u.incomeBalance ?? 0),
            totalEarned: String(u.totalEarned ?? 0),
            totalWithdrawn: String(u.totalWithdrawn ?? 0),
            createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
            updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined,
          },
        });
      }

      // 3. Restore Users - Pass 2: Link sponsor referrals
      for (const u of data.users) {
        if (u.id && u.sponsorId && String(u.sponsorId) !== String(u.id)) {
          try {
            await db.user.update({
              where: { id: String(u.id) },
              data: { sponsorId: String(u.sponsorId) },
            });
          } catch (err) {
            console.warn(`[Restore User Sponsor Link Warn] User ${u.id}:`, err);
          }
        }
      }

      // 4. Restore QueueEntries
      for (const q of data.queueEntries) {
        if (!q.id || !q.userId) continue;
        const validStatus = ["WAITING", "COMPLETED"].includes(q.status) ? q.status : "WAITING";
        await db.queueEntry.upsert({
          where: { id: String(q.id) },
          update: {
            userId: String(q.userId),
            tier: Number(q.tier || 0),
            queueIndex: Number(q.queueIndex || 0),
            childrenPlaced: Number(q.childrenPlaced || 0),
            status: validStatus,
            matchedAt: q.matchedAt ? new Date(q.matchedAt) : null,
            upgradedAt: q.upgradedAt ? new Date(q.upgradedAt) : null,
          },
          create: {
            id: String(q.id),
            userId: String(q.userId),
            tier: Number(q.tier || 0),
            queueIndex: Number(q.queueIndex || 0),
            childrenPlaced: Number(q.childrenPlaced || 0),
            status: validStatus,
            matchedAt: q.matchedAt ? new Date(q.matchedAt) : null,
            upgradedAt: q.upgradedAt ? new Date(q.upgradedAt) : null,
            createdAt: q.createdAt ? new Date(q.createdAt) : undefined,
          },
        });
      }

      // 5. Restore LedgerEntries
      for (const l of data.ledgerEntries) {
        if (!l.id || !l.userId) continue;
        await db.ledgerEntry.upsert({
          where: { id: String(l.id) },
          update: {
            userId: String(l.userId),
            type: l.type,
            wallet: String(l.wallet || "FUND"),
            amount: String(l.amount ?? 0),
            balanceBefore: String(l.balanceBefore ?? 0),
            balanceAfter: String(l.balanceAfter ?? 0),
            referenceKey: String(l.referenceKey || `REF_${Date.now()}_${Math.random()}`),
            description: String(l.description || ""),
            sourceUserId: l.sourceUserId ? String(l.sourceUserId) : null,
            tierNumber: l.tierNumber !== undefined && l.tierNumber !== null ? Number(l.tierNumber) : null,
          },
          create: {
            id: String(l.id),
            userId: String(l.userId),
            type: l.type,
            wallet: String(l.wallet || "FUND"),
            amount: String(l.amount ?? 0),
            balanceBefore: String(l.balanceBefore ?? 0),
            balanceAfter: String(l.balanceAfter ?? 0),
            referenceKey: String(l.referenceKey || `REF_${Date.now()}_${Math.random()}`),
            description: String(l.description || ""),
            sourceUserId: l.sourceUserId ? String(l.sourceUserId) : null,
            tierNumber: l.tierNumber !== undefined && l.tierNumber !== null ? Number(l.tierNumber) : null,
            createdAt: l.createdAt ? new Date(l.createdAt) : undefined,
          },
        });
      }

      // 6. Restore DepositRequests
      for (const d of data.depositRequests) {
        if (!d.id || !d.userId) continue;
        const validStatus = ["PENDING", "APPROVED", "REJECTED"].includes(d.status) ? d.status : "PENDING";
        await db.depositRequest.upsert({
          where: { id: String(d.id) },
          update: {
            userId: String(d.userId),
            amount: String(d.amount ?? 0),
            txHash: String(d.txHash || `TX_${Date.now()}_${Math.random()}`),
            network: String(d.network || "USDT_BEP20"),
            screenshotUrl: d.screenshotUrl ? String(d.screenshotUrl) : null,
            adminNote: d.adminNote ? String(d.adminNote) : null,
            status: validStatus,
            approvedAt: d.approvedAt ? new Date(d.approvedAt) : null,
            approvedById: d.approvedById ? String(d.approvedById) : null,
          },
          create: {
            id: String(d.id),
            userId: String(d.userId),
            amount: String(d.amount ?? 0),
            txHash: String(d.txHash || `TX_${Date.now()}_${Math.random()}`),
            network: String(d.network || "USDT_BEP20"),
            screenshotUrl: d.screenshotUrl ? String(d.screenshotUrl) : null,
            adminNote: d.adminNote ? String(d.adminNote) : null,
            status: validStatus,
            approvedAt: d.approvedAt ? new Date(d.approvedAt) : null,
            approvedById: d.approvedById ? String(d.approvedById) : null,
            createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
          },
        });
      }

      // 7. Restore WithdrawalRequests
      for (const w of data.withdrawalRequests) {
        if (!w.id || !w.userId) continue;
        const validStatus = ["PENDING", "APPROVED", "REJECTED"].includes(w.status) ? w.status : "PENDING";
        await db.withdrawalRequest.upsert({
          where: { id: String(w.id) },
          update: {
            userId: String(w.userId),
            amount: String(w.amount ?? 0),
            feePercent: String(w.feePercent ?? 0),
            feeAmount: String(w.feeAmount ?? 0),
            netAmount: String(w.netAmount ?? 0),
            toAddress: String(w.toAddress || ""),
            network: String(w.network || "USDT_BEP20"),
            txHash: w.txHash ? String(w.txHash) : null,
            adminNote: w.adminNote ? String(w.adminNote) : null,
            status: validStatus,
            processedAt: w.processedAt ? new Date(w.processedAt) : null,
            processedById: w.processedById ? String(w.processedById) : null,
          },
          create: {
            id: String(w.id),
            userId: String(w.userId),
            amount: String(w.amount ?? 0),
            feePercent: String(w.feePercent ?? 0),
            feeAmount: String(w.feeAmount ?? 0),
            netAmount: String(w.netAmount ?? 0),
            toAddress: String(w.toAddress || ""),
            network: String(w.network || "USDT_BEP20"),
            txHash: w.txHash ? String(w.txHash) : null,
            adminNote: w.adminNote ? String(w.adminNote) : null,
            status: validStatus,
            processedAt: w.processedAt ? new Date(w.processedAt) : null,
            processedById: w.processedById ? String(w.processedById) : null,
            createdAt: w.createdAt ? new Date(w.createdAt) : undefined,
          },
        });
      }

      // 8. Restore SupportTickets
      for (const t of data.supportTickets) {
        if (!t.id || !t.userId) continue;
        await db.supportTicket.upsert({
          where: { id: String(t.id) },
          update: {
            userId: String(t.userId),
            subject: String(t.subject || "Support Query"),
            category: String(t.category || "GENERAL"),
            message: String(t.message || ""),
            status: String(t.status || "OPEN"),
            adminReply: t.adminReply ? String(t.adminReply) : null,
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
          },
          create: {
            id: String(t.id),
            userId: String(t.userId),
            subject: String(t.subject || "Support Query"),
            category: String(t.category || "GENERAL"),
            message: String(t.message || ""),
            status: String(t.status || "OPEN"),
            adminReply: t.adminReply ? String(t.adminReply) : null,
            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Database successfully restored (${summary.totalRecords} records restored).`,
        summary,
        mode,
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("[Backup Import Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to import and restore backup" },
      { status: 500 }
    );
  }
}
