import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Decimal from "decimal.js";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { amount, txHash, network } = await req.json();

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: "Please enter a valid deposit amount" }, { status: 400 });
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
        amount: new Decimal(amount).toFixed(8),
        txHash: trimmedHash,
        network: network || "USDT_BEP20",
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
