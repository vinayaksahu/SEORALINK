'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Copy, Check, ArrowRight, AlertCircle, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";

export default function DepositFormClient({
  depositAddress,
  initialNetwork,
  walletLabel,
}: {
  depositAddress: string;
  initialNetwork?: string;
  walletLabel?: string;
}) {
  const router = useRouter();
  const fixedAmount = "10.00";
  const [txHash, setTxHash] = useState("");
  const network = "USDT_BEP20"; // Fixed to USDT BEP-20
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (depositAddress) {
      QRCode.toDataURL(depositAddress, {
        width: 220,
        margin: 1.5,
        color: {
          dark: "#0b1120",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [depositAddress]);

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedHash = txHash.trim();
    if (!trimmedHash.startsWith("0x") || trimmedHash.length < 20) {
      setError("Please enter a valid BNB Smart Chain Transaction Hash (TxID) starting with 0x.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/member/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: fixedAmount,
          txHash: trimmedHash,
          network,
          depositAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deposit submission failed");
      }

      setSuccess("Deposit request submitted successfully! Funds will be credited after admin review.");
      setTxHash("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-seoralink p-6 space-y-6">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
        Deposit Instructions
      </h3>

      {/* Company Address & Auto-Generated QR Code Box */}
      <div className="p-4 rounded-xl border border-[#d4af37]/30 bg-[#0b1120] space-y-4">
        <div className="text-[10px] font-mono-num uppercase text-[#94a3b8] flex justify-between items-center">
          <span className="font-bold text-white">{walletLabel || "Official Company Deposit Address"}</span>
          <span className="text-[#38bdf8] font-bold px-2 py-0.5 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30">
            USDT &bull; BEP-20 (BSC)
          </span>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#070a14] p-3.5 rounded-xl border border-[#1e293b]">
          <div className="bg-white p-2 rounded-lg shadow-md flex-shrink-0 flex items-center justify-center">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Deposit Wallet QR Code"
                className="w-32 h-32 object-contain"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-zinc-400 text-[10px]">
                <QrCode size={28} className="animate-pulse text-[#d4af37]" />
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="text-xs font-bold text-[#f1f5f9] flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode size={14} className="text-[#d4af37]" />
              Scan QR Code to Pay
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed">
              Scan this QR code using <strong>Binance</strong>, <strong>Trust Wallet</strong>, or <strong>MetaMask</strong> to directly transfer exactly <strong>$10.00 USDT</strong> on BNB Smart Chain.
            </p>
            <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1">
              <ShieldCheck size={12} /> Direct Verified BSC Deposit Gateway
            </div>
          </div>
        </div>

        {/* Address String & Copy Button */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider">
            Deposit Wallet Address
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={depositAddress}
              className="w-full bg-[#070a14] border border-[#1e293b] text-white font-mono-num text-xs px-3 py-2.5 rounded-lg focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn-primary px-3 py-2.5 text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-[#94a3b8]">
          Send only <strong>USDT via BNB Smart Chain (BEP-20)</strong> to this address. Amount is strictly <strong>$10.00 USDT</strong>.
        </p>
      </div>

      {/* Submission Form */}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fixed Deposit Amount Field - Non editable */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
              Deposit Amount (USDT)
            </label>
            <span className="text-[10px] font-bold text-[#d4af37] flex items-center gap-1 bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/30">
              <Lock size={10} /> Fixed Entry Amount
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              disabled
              value={`$${fixedAmount} USDT`}
              className="w-full bg-[#0b1120]/80 border border-[#1e293b] text-white/90 rounded-lg px-4 py-2.5 text-xs font-mono-num font-extrabold cursor-not-allowed select-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#94a3b8] font-bold">
              Standard Membership Pack
            </div>
          </div>
          <p className="text-[10px] text-[#94a3b8]">
            Deposit amount is strictly fixed at $10.00 USDT for universal cycle entry.
          </p>
        </div>

        {/* Fixed Network Field - Only BEP-20 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider flex items-center justify-between">
            <span>Network</span>
            <span className="text-[10px] text-[#38bdf8] font-mono font-bold">Only BEP-20 Supported</span>
          </label>
          <div className="w-full bg-[#0b1120] border border-[#1e293b] text-white rounded-lg px-4 py-2.5 text-xs font-mono-num flex items-center justify-between">
            <span className="font-bold text-[#38bdf8]">USDT &bull; BNB Smart Chain (BEP-20)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
              BSC
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">
            Blockchain Transaction Hash (TxID) *
          </label>
          <input
            type="text"
            required
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            className="w-full bg-[#0b1120] border border-[#d4af37]/30 text-white rounded-lg px-4 py-2.5 text-xs font-mono-num focus:outline-none focus:border-[#d4af37]"
          />
          <p className="text-[10px] text-[#94a3b8]">
            Paste the TX hash generated after transferring $10 USDT on BSC.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-xs font-extrabold flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {loading ? "Submitting Request..." : "Submit Deposit for Verification"}
          {!loading && <ArrowRight size={14} />}
        </button>
      </form>
    </div>
  );
}
