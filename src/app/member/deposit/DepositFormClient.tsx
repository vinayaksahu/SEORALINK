'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  AlertTriangle,
  Info,
} from "lucide-react";
import QRCode from "qrcode";

interface DepositFormClientProps {
  mode: "AUTOMATIC" | "MANUAL";
  depositAddress: string;
  walletLabel?: string;
  qrCodeUrl?: string | null;
  requiredConfirmations?: number;
  isPaused?: boolean;
}

export default function DepositFormClient({
  mode,
  depositAddress,
  walletLabel,
  qrCodeUrl,
  requiredConfirmations = 3,
  isPaused = false,
}: DepositFormClientProps) {
  const router = useRouter();
  const fixedAmount = "10.00";
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [showOptionalTxInput, setShowOptionalTxInput] = useState(false);

  useEffect(() => {
    if (qrCodeUrl) {
      setQrCodeDataUrl(qrCodeUrl);
    } else if (depositAddress) {
      QRCode.toDataURL(depositAddress, {
        width: 240,
        margin: 1.5,
        color: {
          dark: "#0b1120",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [depositAddress, qrCodeUrl]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedHash = txHash.trim().toLowerCase();
    if (!trimmedHash.startsWith("0x") || trimmedHash.length !== 66) {
      setError("Please enter a valid BNB Smart Chain Transaction Hash (66 characters starting with 0x).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/member/crypto-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: trimmedHash,
          declaredAmount: fixedAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deposit submission failed");
      }

      setSuccess(data.message || "Deposit submitted successfully!");
      setTxHash("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAutomatic = mode === "AUTOMATIC";

  return (
    <div className="card-seoralink p-6 space-y-6 border border-[#1e293b]">
      {/* Mode Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isAutomatic ? "bg-emerald-400 animate-pulse" : "bg-[#d4af37]"}`}></span>
          {isAutomatic ? "Automated Instant Deposit" : "Manual Branch Approval Deposit"}
        </h3>
        <span
          className={`text-[10px] font-mono-num font-bold px-2.5 py-1 rounded-full border ${
            isAutomatic
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          {isAutomatic ? "⚡ AUTO-CREDIT ACTIVE" : "🛡️ ADMIN REVIEW REQUIRED"}
        </span>
      </div>

      {/* Emergency Pause Notice if applicable */}
      {isPaused && (
        <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-bold">System Notice:</span> Automatic wallet balance crediting is temporarily paused for routine ledger reconciliation. Blockchain scans remain active, and deposits will credit automatically upon resume.
          </div>
        </div>
      )}

      {/* Mode Explanation Notice */}
      <div className={`p-4 rounded-xl border ${isAutomatic ? "border-emerald-500/30 bg-emerald-950/20" : "border-[#d4af37]/30 bg-[#0b1325]"}`}>
        <p className="text-xs text-[#cbd5e1] leading-relaxed">
          {isAutomatic ? (
            <>
              Send exactly <strong className="text-emerald-300 font-mono">$10.00 USDT (BEP-20)</strong> to your personal dedicated receiving address below. Our automated blockchain monitor detects incoming transfers instantly on BSC and credits your Fund Wallet within <strong>{requiredConfirmations} block confirmations (~9 seconds)</strong>.
            </>
          ) : (
            <>
              Send exactly <strong className="text-[#d4af37] font-mono">$10.00 USDT (BEP-20)</strong> to your assigned Branch Admin&apos;s vault below. After sending, enter your on-chain Transaction Hash (TxID) to queue the deposit for review.
            </>
          )}
        </p>
      </div>

      {/* QR Code and Address Box */}
      <div className="p-5 rounded-xl border border-[#1e293b] bg-[#070e1b] space-y-4">
        <div className="text-[11px] font-mono-num uppercase text-[#94a3b8] flex justify-between items-center">
          <span className="font-bold text-white">{walletLabel || (isAutomatic ? "Your Personal BSC Deposit Address" : "Branch Vault Address")}</span>
          <span className="text-[#38bdf8] font-bold px-2 py-0.5 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30">
            USDT &bull; BEP-20 (BSC)
          </span>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl max-w-[240px] mx-auto shadow-lg">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="Deposit QR Code" className="w-[210px] h-[210px] object-contain" />
          ) : (
            <div className="w-[210px] h-[210px] flex items-center justify-center text-slate-400">
              <QrCode size={48} className="animate-pulse" />
            </div>
          )}
          <span className="text-[10px] text-[#0b1120] font-mono font-bold mt-1 text-center tracking-tight">
            SCAN WITH BINANCE / TRUST WALLET / METAMASK
          </span>
        </div>

        {/* Deposit Address Box with Copy */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-[#94a3b8]">Deposit Receiving Address</label>
          <div className="flex items-center gap-2 bg-[#0b1325] border border-[#1e293b] rounded-xl p-2.5">
            <span className="text-xs font-mono text-[#38bdf8] break-all select-all font-semibold flex-1">
              {depositAddress}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(depositAddress)}
              className="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-[#38bdf8] border border-[#38bdf8]/30 transition-all shrink-0"
              title="Copy Address"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Network & Contract Details */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono-num border-t border-[#1e293b]/70">
          <div>
            <span className="text-[#64748b] block text-[9px] uppercase font-bold">Network</span>
            <span className="text-white font-semibold">BNB Smart Chain (BSC)</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[9px] uppercase font-bold">Token Standard</span>
            <span className="text-[#38bdf8] font-semibold">BEP-20 (Chain ID 56)</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[9px] uppercase font-bold">Required Amount</span>
            <span className="text-emerald-400 font-bold">$10.00 USDT</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[9px] uppercase font-bold">Explorer</span>
            <a
              href={`https://bscscan.com/address/${depositAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38bdf8] hover:underline flex items-center gap-1"
            >
              <span>View Address</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* AUTOMATIC MODE: Optional instant trigger toggle */}
      {isAutomatic ? (
        <div className="space-y-4 pt-2 border-t border-[#1e293b]">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#070e1b] border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">No TxID submission required!</p>
                <p className="text-[11px] text-[#94a3b8]">Your wallet will credit automatically once 3 confirmations occur on BSC.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors shrink-0"
            >
              Refresh Status
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowOptionalTxInput(!showOptionalTxInput)}
              className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1.5 transition-colors font-medium"
            >
              <span>Want faster verification? Submit TxHash manually (optional)</span>
              {showOptionalTxInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showOptionalTxInput && (
              <form onSubmit={handleSubmit} className="mt-3 space-y-3 p-4 rounded-xl bg-[#0b1325] border border-[#1e293b]">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#cbd5e1]">Transaction Hash (TxID)</label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#070e1b] border border-[#1e293b] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-2"
                >
                  {loading ? "Verifying On-Chain..." : "Trigger Instant Verification"}
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* MANUAL MODE: Required TxHash submission form */
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-[#1e293b]">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span>Blockchain Transaction Hash (TxID)</span>
              <span className="text-[10px] text-red-400 font-mono uppercase">* Required for manual mode</span>
            </label>
            <input
              type="text"
              required
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Paste 66-character 0x... hash here"
              className="w-full bg-[#0b1325] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
            <p className="text-[10px] text-[#94a3b8]">
              Copy the transaction hash from your wallet (Binance, Trust Wallet, MetaMask) after sending USDT.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0b1325] border border-[#1e293b] flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">Declared Micro-Entry:</span>
            <span className="text-white font-mono font-bold">$10.00 USDT</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[#0b1120] bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? "Verifying Transaction on BSC..." : "Submit Deposit for Branch Review"}
            <ArrowRight size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
