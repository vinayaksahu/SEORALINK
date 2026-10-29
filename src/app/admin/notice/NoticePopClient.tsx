"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Image as ImageIcon,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  ExternalLink,
  Sparkles,
  Megaphone,
} from "lucide-react";

interface NoticePopClientProps {
  initialScrollingNotice: string;
  initialPopupEnabled: boolean;
  initialPopupTitle: string;
  initialPopupImageUrl: string;
}

export default function NoticePopClient({
  initialScrollingNotice,
  initialPopupEnabled,
  initialPopupTitle,
  initialPopupImageUrl,
}: NoticePopClientProps) {
  // Card 1 State: Scrolling Notice
  const [scrollingNotice, setScrollingNotice] = useState(initialScrollingNotice);
  const [isSavingNotice, setIsSavingNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Card 2 State: Pop Image Announcement
  const [popupEnabled, setPopupEnabled] = useState(initialPopupEnabled);
  const [popupTitle, setPopupTitle] = useState(initialPopupTitle);
  const [popupImageUrl, setPopupImageUrl] = useState(initialPopupImageUrl);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pop Image Saving & Preview States
  const [isSavingPopup, setIsSavingPopup] = useState(false);
  const [isRemovingPopup, setIsRemovingPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Determine current active preview image (local file preview takes precedence, then direct URL)
  const currentImagePreview = localPreviewUrl || popupImageUrl;

  // Helper: Client-side image compression to keep payload light (<300KB) and serverless-friendly
  const compressImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawData = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1200;
          let { width, height } = img;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawData);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          try {
            const webp = canvas.toDataURL("image/webp", 0.85);
            if (webp && webp.startsWith("data:image/webp")) {
              resolve(webp);
              return;
            }
          } catch {
            // fallback
          }
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => resolve(rawData);
        img.src = rawData;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const optimizedUrl = await compressImageFile(file);
      setLocalPreviewUrl(optimizedUrl);
      setPopupImageUrl(optimizedUrl);
    }
  };

  // Save Scrolling Notice (Card 1)
  const handleSaveScrollingNotice = async () => {
    setIsSavingNotice(true);
    setNoticeMessage(null);

    try {
      const res = await fetch("/api/admin/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_scrolling",
          scrollingNotice,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save scrolling notice.");
      }

      setNoticeMessage({
        type: "success",
        text: "Scrolling header notice updated successfully!",
      });
      setTimeout(() => setNoticeMessage(null), 4000);
    } catch (err: any) {
      setNoticeMessage({
        type: "error",
        text: err.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSavingNotice(false);
    }
  };

  // Save & Update Pop Image (Card 2)
  const handleSavePopImage = async () => {
    setIsSavingPopup(true);
    setPopupMessage(null);

    try {
      let finalImageUrl = popupImageUrl || localPreviewUrl;

      // If user selected a local file, try to upload it; otherwise fall back safely to local data URL
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);

          const uploadRes = await fetch("/api/admin/notice/upload", {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.success && uploadData.url) {
            finalImageUrl = uploadData.url;
            setPopupImageUrl(uploadData.url);
          } else {
            // Serverless fallback: use local optimized base64 data URL
            finalImageUrl = localPreviewUrl || finalImageUrl;
          }
        } catch {
          // Network or server error fallback: use local optimized data URL
          finalImageUrl = localPreviewUrl || finalImageUrl;
        }

        setSelectedFile(null);
      }

      // Save popup configurations
      const res = await fetch("/api/admin/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_popup",
          popupEnabled,
          popupTitle,
          popupImageUrl: finalImageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save pop image announcement.");
      }

      setPopupMessage({
        type: "success",
        text: "Member login pop image announcement saved and updated!",
      });
      setTimeout(() => setPopupMessage(null), 4000);
    } catch (err: any) {
      setPopupMessage({
        type: "error",
        text: err.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSavingPopup(false);
    }
  };

  // Remove Pop Image (Card 2)
  const handleRemovePopImage = async () => {
    if (!confirm("Are you sure you want to remove the pop image announcement? This will disable the login popup.")) {
      return;
    }

    setIsRemovingPopup(true);
    setPopupMessage(null);

    try {
      const res = await fetch("/api/admin/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_popup",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove pop image.");
      }

      setPopupEnabled(false);
      setPopupImageUrl("");
      setSelectedFile(null);
      setLocalPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setPopupMessage({
        type: "success",
        text: "Pop image removed and popup disabled successfully.",
      });
      setTimeout(() => setPopupMessage(null), 4000);
    } catch (err: any) {
      setPopupMessage({
        type: "error",
        text: err.message || "Failed to remove pop image.",
      });
    } finally {
      setIsRemovingPopup(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Megaphone size={20} className="text-sky-400" />
          Notice & Pop Image Management
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Configure real-time scrolling announcement tickers and member login promotional popups.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* CARD 1: Scrolling Header Notification Text                                */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 sm:p-6 shadow-xl space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Bell size={18} className="text-amber-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Scrolling Header Notification Text
            </h3>
          </div>
          <span className="text-xs text-sky-400/90 font-medium tracking-wide">
            Shows in Member Ticker Capsule
          </span>
        </div>

        {/* Subtitle / Description */}
        <p className="text-xs text-slate-400 leading-relaxed">
          Update the announcement ticker text displayed at the top of the member dashboard. Any text saved here will scroll in real time for all members.
        </p>

        {/* Textarea */}
        <div className="space-y-2">
          <textarea
            rows={3}
            value={scrollingNotice}
            onChange={(e) => setScrollingNotice(e.target.value)}
            placeholder="Welcome to the official Catalyst Capital trading platform • High Frequency AI Trading • Instant 0% Withdrawal Payouts • Daily ROI Active •"
            className="w-full bg-[#040711] text-slate-100 placeholder-slate-600 border border-slate-800 rounded-lg p-3.5 text-xs sm:text-sm font-sans focus:outline-none focus:border-amber-500/60 transition shadow-inner resize-y leading-relaxed"
          />
        </div>

        {/* Status message */}
        {noticeMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              noticeMessage.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
            }`}
          >
            {noticeMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{noticeMessage.text}</span>
          </div>
        )}

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={handleSaveScrollingNotice}
            disabled={isSavingNotice}
            className="bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {isSavingNotice ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Saving Notice...</span>
              </>
            ) : (
              <span>Save Scrolling Notice</span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: Member Login Pop Image Announcement                               */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-5 sm:p-6 shadow-xl space-y-5">
        {/* Top Header Row with Enable Checkbox */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <ImageIcon size={18} className="text-sky-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Member Login Pop Image Announcement
            </h3>
          </div>

          {/* Enable Popup on Login Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={popupEnabled}
              onChange={(e) => setPopupEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-[#040711] cursor-pointer accent-amber-500"
            />
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              Enable Popup on Login
            </span>
          </label>
        </div>

        {/* Subtitle / Description */}
        <p className="text-xs text-slate-400 leading-relaxed">
          Upload a promotional poster or announcement banner (PNG / JPG / WebP) that automatically pops up upon member login.
        </p>

        {/* Announcement Title / Caption Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Announcement Title / Caption
          </label>
          <input
            type="text"
            value={popupTitle}
            onChange={(e) => setPopupTitle(e.target.value)}
            placeholder="e.g. Catalyst Capital Ambassador Salary & Dividend Structure"
            className="w-full bg-[#040711] text-slate-100 placeholder-slate-600 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-cyan-500/60 transition shadow-inner font-mono text-[11px]"
          />
        </div>

        {/* Option A & Option B Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Upload Image File */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Option A: Upload Image File
            </label>
            <div className="flex items-center gap-2 bg-[#040711] border border-slate-800 rounded-lg p-1.5">
              <label className="bg-[#1e293b] hover:bg-[#334155] text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md cursor-pointer transition border border-slate-700 shrink-0 flex items-center gap-1.5">
                <Upload size={13} />
                <span>Choose file</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-400 truncate px-1">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </span>
            </div>
          </div>

          {/* Option B: Image Direct URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Option B: Image Direct URL
            </label>
            <input
              type="text"
              value={popupImageUrl}
              onChange={(e) => {
                setPopupImageUrl(e.target.value);
                setLocalPreviewUrl(null);
              }}
              placeholder="https://example.com/banner.png"
              className="w-full bg-[#040711] text-slate-100 placeholder-slate-600 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-cyan-500/60 transition shadow-inner font-mono text-[12px]"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2 pt-2">
          <div className="text-center">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              POP IMAGE LIVE PREVIEW
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#040711] p-4 flex items-center justify-center min-h-[220px] max-h-[460px] overflow-hidden">
            {currentImagePreview ? (
              <img
                src={currentImagePreview}
                alt="Pop Image Live Preview"
                className="max-h-[400px] w-auto max-w-full object-contain rounded-lg shadow-2xl transition duration-300 hover:scale-[1.01]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="text-center py-8 px-4 space-y-2">
                <ImageIcon size={38} className="text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">
                  No pop image configured. Upload a file above or provide an image direct URL.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status message */}
        {popupMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              popupMessage.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
            }`}
          >
            {popupMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{popupMessage.text}</span>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Save & Update Pop Image (Cyan Button) */}
          <button
            type="button"
            onClick={handleSavePopImage}
            disabled={isSavingPopup}
            className="bg-[#06b6d4] hover:bg-[#0891b2] disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {isSavingPopup ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Saving Pop Image...</span>
              </>
            ) : (
              <span>Save & Update Pop Image</span>
            )}
          </button>

          {/* Preview Modal (Gold/Amber Button with Eye icon) */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={!currentImagePreview}
            className="bg-[#785b14] hover:bg-[#8f6d19] disabled:opacity-40 text-amber-200 border border-amber-600/50 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Eye size={16} className="text-amber-300" />
            <span>Preview Modal</span>
          </button>

          {/* Remove Pop Image (Dark Red Button with Trash icon) */}
          <button
            type="button"
            onClick={handleRemovePopImage}
            disabled={isRemovingPopup || (!popupImageUrl && !selectedFile)}
            className="bg-[#450a0a]/90 hover:bg-[#7f1d1d] disabled:opacity-40 text-rose-300 border border-rose-600/50 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {isRemovingPopup ? (
              <div className="w-3.5 h-3.5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} className="text-rose-400" />
            )}
            <span>Remove Pop Image</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIMULATED LOGIN POPUP MODAL (For Previewing)                               */}
      {/* ========================================================================= */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative w-full max-w-xl sm:max-w-2xl bg-[#0b101b] border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-amber-500/20 bg-slate-900/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {popupTitle || "Official Member Announcement"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
                aria-label="Close Preview"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-3 sm:p-5 bg-[#040711] flex items-center justify-center max-h-[70vh] overflow-hidden">
              {currentImagePreview ? (
                <img
                  src={currentImagePreview}
                  alt="Announcement Banner"
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No preview image available.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-400/90 font-mono">
                [Live Preview Mode &bull; {popupEnabled ? "Status: ENABLED" : "Status: DISABLED"}]
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold text-xs px-4 py-2 rounded-lg transition active:scale-95 cursor-pointer shadow"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
