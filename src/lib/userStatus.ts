import { db } from "./db";
import { Prisma } from "@prisma/client";

/**
 * Checks whether a user has concluded their Single-Exit (Rank Pool Cashout) settlement
 * and permanently exited from the network.
 */
export async function isUserSystemExited(
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<boolean> {
  const client = tx || db;
  const exitRequest = await client.withdrawalRequest.findFirst({
    where: {
      userId,
      OR: [
        { feePercent: 20 },
        { adminNote: { contains: "CASHOUT" } },
        { adminNote: { contains: "RANK_EXIT" } },
      ],
      status: { not: "REJECTED" },
    },
    select: { id: true },
  });

  return Boolean(exitRequest);
}
