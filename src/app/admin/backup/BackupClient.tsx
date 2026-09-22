"use client";

import React, { useState, useRef } from "react";
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Users,
  Wallet,
  GitCommit,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

interface BackupStats {
  users: number;
  queues: number;
  ledgers: number;
  deposits: number;
  withdrawals: number;
  tickets: number;
  configs: number;
  totalRecords: number;
}

interface BackupClientProps {
  currentStats: BackupStats;
  adminEmail: string;
}

export default function BackupClient({ currentStats, adminEmail }: BackupClientProps) {
  // Export states
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [restoreMode, setRestoreMode] = useState<"clean" | "merge">("clean");
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle Export Download
  const handleExport = async (format: "json" | "excel") => {
    try {
      if (format === "json") setDownloadingJson(true);
      else setDownloadingExcel(true);
      setErrorMessage(null);

      const res = await fetch(`/api/admin/backup/export?format=${format}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = format === "json" ? `seoralink-backup-${dateStr}.json` : `seoralink-backup-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to download backup");
    } finally {
      setDownloadingJson(false);
      setDownloadingExcel(false);
    }
  };

  // 2. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      setRestoreResult(null);
      setErrorMessage(null);
      inspectFile(file);
    }
  };

  // 3. Inspect / Preview Uploaded File
  const inspectFile = async (file: File) => {
    try {
      setPreviewLoading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "preview");
      formData.append("mode", restoreMode);

      const res = await fetch("/api/admin/backup/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to inspect backup file");
      }

      setPreviewData(json);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid or corrupt backup file");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 4. Execute Restore
  const handleExecuteRestore = async () => {
    if (!selectedFile) return;

    const confirmMsg =
      restoreMode === "clean"
        ? "⚠️ WARNING: Clean Restore mode will replace all existing data in this database with the backup data. Are you sure you want to proceed?"
        : "Proceed with merging backup records into the database?";

    if (!window.confirm(confirmMsg)) return;

    try {
      setRestoring(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("action", "restore");
      formData.append("mode", restoreMode);

      const res = await fetch("/api/admin/backup/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Database restoration failed");
      }

      setRestoreResult(json);
      setPreviewData(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to execute restoration");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Live System State Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold flex items-center gap-1.5">
              <Layers size={14} /> Live Telemetry
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">Active Database Footprint</h3>
          </div>
          <div className="text-xs text-slate-400">
            Total Entities in Database: <strong className="text-white font-mono text-sm">{currentStats.totalRecords.toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Members</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">{currentStats.users}</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Queues</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">{currentStats.queues}</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Ledgers</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">{currentStats.ledgers}</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Deposits</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">{currentStats.deposits}</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Withdrawals</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">{currentStats.withdrawals}</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Tickets</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">{currentStats.tickets}</div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Configs</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">{currentStats.configs}</div>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Global Success Banner */}
      {restoreResult && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span>Database Restoration Complete!</span>
          </div>
          <p className="text-xs text-emerald-200/90">{restoreResult.message}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-xs">
            <div>Users Restored: <strong className="font-mono text-white">{restoreResult.summary?.users ?? 0}</strong></div>
            <div>Queue Entries: <strong className="font-mono text-white">{restoreResult.summary?.queueEntries ?? 0}</strong></div>
            <div>Ledger Entries: <strong className="font-mono text-white">{restoreResult.summary?.ledgerEntries ?? 0}</strong></div>
            <div>Total Entities: <strong className="font-mono text-white">{restoreResult.summary?.totalRecords ?? 0}</strong></div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Refresh Page to Update Telemetry
          </button>
        </div>
      )}

      {/* Main Grid: Card 1 (Export) & Card 2 (Import) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ==================================================== */}
        {/* 1. EXPORT / DOWNLOAD CARD                            */}
        {/* ==================================================== */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Download size={20} className="text-[#d4af37]" />
              Export & Download Backup Locally
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a snapshot of your entire database right now. Download it in <strong>JSON</strong> (for exact system restore) or <strong>Excel (.xlsx)</strong> (for human review and spreadsheets).
            </p>

            <div className="space-y-3 pt-2">
              {/* Option A: JSON */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <FileCode size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Full System JSON (.json)
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Recommended for Restore</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Includes all 7 tables with relations, passwords, decimals, and timestamps.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExport("json")}
                  disabled={downloadingJson}
                  className="px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#c49f27] text-black font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#d4af37]/10"
                >
                  {downloadingJson ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Download JSON
                    </>
                  )}
                </button>
              </div>

              {/* Option B: Excel */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      Multi-Sheet Excel (.xlsx)
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Human-Readable</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      7 Worksheets: Users, Queue, Ledger, Deposits, Withdrawals, Tickets, Configs.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExport("excel")}
                  disabled={downloadingExcel}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  {downloadingExcel ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Download Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            Export snapshot is generated securely with Operator credentials: <strong>{adminEmail}</strong>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 2. IMPORT / RESTORE CARD                             */}
        {/* ==================================================== */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Upload size={20} className="text-blue-400" />
              Restore / Populate New Database
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload a previously exported <strong>.json</strong> or <strong>.xlsx</strong> backup file to restore or populate your database.
            </p>

            {/* Mode Selector */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-white">Restoration Mode:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode("clean")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    restoreMode === "clean"
                      ? "bg-red-500/15 border-red-500/50 text-white"
                      : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Clean & Restore
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Best for Fresh Database. Wipes conflicting records and restores exact state.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRestoreMode("merge")}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    restoreMode === "merge"
                      ? "bg-blue-500/15 border-blue-500/50 text-white"
                      : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Safe Merge / Upsert
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Updates existing and inserts new entries without clearing database.
                  </div>
                </button>
              </div>
            </div>

            {/* File Upload Zone */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="backup-file-input"
              />
              <label
                htmlFor="backup-file-input"
                className="border-2 border-dashed border-slate-700 hover:border-[#d4af37] bg-slate-950/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Upload size={24} className="text-slate-400" />
                <div className="text-xs font-bold text-white">
                  {selectedFile ? selectedFile.name : "Click to select or drag & drop backup file"}
                </div>
                <div className="text-[11px] text-slate-500">Supports .json and .xlsx files up to 50MB</div>
              </label>
            </div>

            {/* Preview Loading */}
            {previewLoading && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-blue-400" />
                Inspecting and validating backup contents...
              </div>
            )}

            {/* Preview Inspection Box */}
            {previewData && (
              <div className="p-4 bg-slate-950 border border-blue-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-300 flex items-center gap-1.5">
                    <FileCheck size={16} /> File Validated Successfully
                  </span>
                  <span className="font-mono text-white text-[11px]">{previewData.filename}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-800">
                  <div className="bg-slate-900/80 p-2 rounded">
                    <div className="text-[10px] text-slate-400">Users</div>
                    <div className="font-bold text-white font-mono">{previewData.summary?.users ?? 0}</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded">
                    <div className="text-[10px] text-slate-400">Queues</div>
                    <div className="font-bold text-white font-mono">{previewData.summary?.queueEntries ?? 0}</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded">
                    <div className="text-[10px] text-slate-400">Ledgers</div>
                    <div className="font-bold text-white font-mono">{previewData.summary?.ledgerEntries ?? 0}</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded">
                    <div className="text-[10px] text-slate-400">Total</div>
                    <div className="font-bold text-blue-400 font-mono">{previewData.summary?.totalRecords ?? 0}</div>
                  </div>
                </div>

                {restoreMode === "clean" && (
                  <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    ⚠️ <strong>Notice:</strong> Clean mode selected. Target database will be wiped before restoring these {previewData.summary?.totalRecords ?? 0} records.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={restoring}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {restoring ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Restoring Database (Please do not close)...
                    </>
                  ) : (
                    <>
                      <Database size={14} />
                      Confirm & Execute Restore
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
            Two-pass referral resolution ensures user network trees (`sponsorId`) are linked without foreign key violations.
          </div>
        </div>
      </div>
    </div>
  );
}
