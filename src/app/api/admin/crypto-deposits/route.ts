import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeLedgerTransaction } from "@/lib/ledger";
import { recordActivity } from "@/lib/auditLogger";
import {
  checkAdminDepositPermission,
  serializeBlockchainData,
} from "@/lib/blockchain/config";
import { verifyOnChainTxHash } from "@/lib/blockchain/monitor";
import Decimal from "decimal.js";

export const dynamic = "force-dynamic";

/**
 * GET: Lists deposit requests scoped strictly to calling Admin's branch
 * (or all if SuperRootAdmin)
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const hasViewPerm = await checkAdminDepositPermission(session.userId, "deposit.view", session.role);
    if (!hasViewPerm) {
      return NextResponse.json({ error: "Access denied. Missing 'deposit.view' permission." }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.trim();
    const branchFilter = url.searchParams.get("branchId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Branch scoping
    if (session.role !== "SUPER_ROOT_ADMIN") {
      where.user = { adminId: session.userId };
    } else if (branchFilter) {
      where.user = { adminId: branchFilter };
    }

    // Status filter
    if (status && status !== "ALL") {
      if (status === "PENDING_ANY") {
        where.status = { in: ["PENDING", "PENDING_REVIEW", "CONFIRMING"] };
      } else {
        where.status = status;
      }
    }

    // Search query
    if (search) {
      where.OR = [
        { txHash: { contains: search, mode: "insensitive" } },
        { user: { customId: { contains: search, mode: "insensitive" } } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, deposits] = await Promise.all([
      db.depositRequest.count({ where }),
      db.depositRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              customId: true,
              fullName: true,
              email: true,
              adminId: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      serializeBlockchainData({
        success: true,
        deposits,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error("[Admin Crypto Deposits GET Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch branch deposits" },
      { status: 500 }
    );
  }
}

/**
 * POST: Handles Approve, Reject, or Re-Verify actions on a deposit request
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "SUPER_ROOT_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized administrative access" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, action, rejectionReason, approvalNotes } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing deposit ID or action" }, { status: 400 });
    }

    // Fetch target deposit
    const deposit = await db.depositRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            customId: true,
            fullName: true,
            email: true,
            adminId: true,
          },
        },
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit request not found" }, { status: 404 });
    }

    // Branch isolation check (unless SuperRootAdmin)
    if (session.role !== "SUPER_ROOT_ADMIN" && deposit.user.adminId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized: Deposit belongs to another admin branch" }, { status: 403 });
    }

    // ACTION: RE_VERIFY ON-CHAIN
    if (action === "RE_VERIFY") {
      const hasVerifyPerm = await checkAdminDepositPermission(session.userId, "deposit.verify", session.role);
      if (!hasVerifyPerm) {
        return NextResponse.json({ error: "Missing 'deposit.verify' permission" }, { status: 403 });
      }

      const minAmount = 0.01;
      const verification = await verifyOnChainTxHash(deposit.txHash, deposit.toAddress || undefined, minAmount);
      return NextResponse.json(
        serializeBlockchainData({
          success: true,
          verification,
        })
      );
    }

    // ACTION: APPROVE
    if (action === "APPROVE") {
      const hasApprovePerm = await checkAdminDepositPermission(session.userId, "deposit.approve", session.role);
      if (!hasApprovePerm) {
        return NextResponse.json({ error: "Missing 'deposit.approve' permission" }, { status: 403 });
      }

      if (deposit.status === "APPROVED" || deposit.status === "CREDITED") {
        return NextResponse.json({ error: "Deposit is already approved or credited" }, { status: 400 });
      }

      return await db.$transaction(async (tx) => {
        const creditAmount = new Decimal(deposit.amountInUsdt.toString());

        // Update deposit request
        const updated = await tx.depositRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedById: session.userId,
            reviewedAt: new Date(),
            reviewedBy: session.userId,
            approvalNotes: approvalNotes || "Approved by Branch Admin",
          },
        });

        // Credit user's Fund Wallet via immutable ledger
        const depositRefKey = `DEPOSIT_APPROVED_${deposit.id}`;
        await executeLedgerTransaction(
          {
            userId: deposit.userId,
            type: "DEPOSIT",
            wallet: "FUND",
            amount: creditAmount,
            referenceKey: depositRefKey,
            description: `USDT Deposit Approved (TxID: ${deposit.txHash.slice(0, 10)}...)`,
          },
          tx
        );

        await recordActivity({
          req,
          userId: session.userId,
          customId: session.customId,
          fullName: session.fullName,
          role: session.role,
          adminId: session.userId,
          action: "DEPOSIT_APPROVED",
          category: "FINANCE",
          targetUserId: deposit.userId,
          targetCustomId: deposit.user.customId,
          details: {
            depositId: deposit.id,
            amount: creditAmount.toString(),
            txHash: deposit.txHash,
            member: `${deposit.user.fullName} (${deposit.user.customId})`,
            approvalNotes,
          },
        });

        return NextResponse.json(
          serializeBlockchainData({
            success: true,
            message: `Deposit of $${creditAmount.toFixed(2)} USDT approved and credited to ${deposit.user.fullName}.`,
            deposit: updated,
          })
        );
      }, { timeout: 30000, maxWait: 10000 });
    }

    // ACTION: REJECT
    if (action === "REJECT") {
      const hasRejectPerm = await checkAdminDepositPermission(session.userId, "deposit.reject", session.role);
      if (!hasRejectPerm) {
        return NextResponse.json({ error: "Missing 'deposit.reject' permission" }, { status: 403 });
      }

      if (deposit.status === "APPROVED" || deposit.status === "CREDITED") {
        return NextResponse.json({ error: "Cannot reject a deposit that has already been approved" }, { status: 400 });
      }

      const updated = await db.depositRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: session.userId,
          rejectionReason: rejectionReason || "Rejected by administrator",
          adminNote: rejectionReason || "Rejected by administrator",
        },
      });

      await recordActivity({
        req,
        userId: session.userId,
        customId: session.customId,
        fullName: session.fullName,
        role: session.role,
        adminId: session.userId,
        action: "DEPOSIT_REJECTED",
        category: "FINANCE",
        targetUserId: deposit.userId,
        targetCustomId: deposit.user.customId,
        details: {
          depositId: deposit.id,
          txHash: deposit.txHash,
          reason: rejectionReason,
        },
      });

      return NextResponse.json(
        serializeBlockchainData({
          success: true,
          message: "Deposit has been rejected.",
          deposit: updated,
        })
      );
    }

    return NextResponse.json({ error: "Invalid action requested" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Crypto Deposits POST Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute deposit action" },
      { status: 500 }
    );
  }
}
