import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

export default async function MemberLedgerPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ledgers = await db.ledgerEntry.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText size={20} className="text-[#d4af37]" />
          Financial Ledger &bull; Immutable Transaction History
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Every balance alteration is permanently timestamped with pre- and post-transaction values.
        </p>
      </div>

      <div className="card-seoralink p-6 space-y-4">
        {ledgers.length === 0 ? (
          <div className="text-center py-12 text-[#94a3b8] text-xs border border-dashed border-[#1e293b] rounded-xl">
            No transaction records found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-num text-xs">
              <thead>
                <tr className="border-b border-[#1e293b] text-[#94a3b8] text-[10px] uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Wallet</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Balance After</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50 text-[#cbd5e1]">
                {ledgers.map((l) => {
                  const amt = parseFloat(l.amount.toString());
                  const isPositive = amt >= 0;

                  return (
                    <tr key={l.id} className="hover:bg-[#0f172a]/30">
                      <td className="py-2.5 px-3 text-[#94a3b8] text-[11px] whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-white font-bold text-[11px]">{l.type}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.wallet === "FUND" ? "bg-[#38bdf8]/10 text-[#38bdf8]" : "bg-[#10b981]/10 text-[#10b981]"
                        }`}>
                          {l.wallet}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-bold whitespace-nowrap ${
                        isPositive ? "text-[#10b981]" : "text-red-400"
                      }`}>
                        {isPositive ? `+$${amt.toFixed(2)}` : `-$${Math.abs(amt).toFixed(2)}`}
                      </td>
                      <td className="py-2.5 px-3 text-white font-bold whitespace-nowrap">
                        ${parseFloat(l.balanceAfter.toString()).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-[#94a3b8] font-sans text-xs max-w-xs truncate">
                        {l.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
