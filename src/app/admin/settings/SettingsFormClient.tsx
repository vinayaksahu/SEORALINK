'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsFormClient({
  initialAddress,
  initialNetwork,
}: {
  initialAddress: string;
  initialNetwork: string;
}) {
  const router = useRouter();
  const [usdtAddress, setUsdtAddress] = useState(initialAddress);
  const [network, setNetwork] = useState(initialNetwork);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdtAddress, network }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-seoralink p-6 max-w-xl space-y-6">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <Settings size={16} className="text-red-400" />
        Deposit & System Parameters
      </h3>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Official Company Deposit USDT Address
          </label>
          <input
            type="text"
            required
            value={usdtAddress}
            onChange={(e) => setUsdtAddress(e.target.value)}
            className="w-full bg-[#0b1120] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 text-xs font-mono-num focus:outline-none focus:border-[#d4af37]"
          />
          <p className="text-[10px] text-[#94a3b8]">
            This address will be displayed to all members on the deposit page.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Default Network
          </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full bg-[#0b1120] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 text-xs font-mono-num focus:outline-none focus:border-[#d4af37]"
          >
            <option value="USDT_BEP20">USDT &bull; BNB Smart Chain (BEP-20)</option>
            <option value="USDT_TRC20">USDT &bull; TRON (TRC-20)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-xs font-extrabold disabled:opacity-50 mt-2"
        >
          {loading ? "Saving Settings..." : "Save System Configuration"}
        </button>
      </form>
    </div>
  );
}
