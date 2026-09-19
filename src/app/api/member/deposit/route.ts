import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isUserSystemExited } from "@/lib/userStatus";
import Decimal from "decimal.js";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const isExited = await isUserSystemExited(session.userId);
    if (isExited) {
      return NextResponse.json(
        { error: "This account has permanently exited the network under the Single-Exit protocol and is prohibited from making deposits." },
        { status: 403 }
      );
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { status: true },
    });

    if (currentUser?.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Your account is already activated. Deposits are disabled for active IDs." },
        { status: 403 }
      );
    }

    const { amount, txHash, network, depositAddress } = await req.json();

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum !== 10) {
      return NextResponse.json(
        { error: "Deposit amount is strictly fixed at $10.00 USDT" },
        { status: 400 }
      );
    }

    if (!txHash || txHash.trim().length < 10) {
      return NextResponse.json({ error: "A valid blockchain Transaction Hash (TxID) is required" }, { status: 400 });
    }

    const trimmedHash = txHash.trim();

    // Check if txHash already submitted
    const existing = await db.depositRequest.findUnique({
      where: { txHash: trimmedHash },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This transaction hash has already been submitted" },
        { status: 400 }
      );
    }

    const deposit = await db.depositRequest.create({
      data: {
        userId: session.userId,
        amount: new Decimal(10).toFixed(8),
        txHash: trimmedHash,
        network: "USDT_BEP20",
        adminNote: depositAddress ? `Sent to wallet: ${depositAddress.trim()}` : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deposit request submitted successfully! Funds will be credited after admin review.",
      deposit,
    });
  } catch (error: any) {
    console.error("[Deposit Request Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit deposit request" },
      { status: 500 }
    );
  }
}
