"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Send,
  X,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicketsClientProps {
  initialTickets: Ticket[];
  customId: string;
}

const CATEGORIES = [
  "Deposit / Payment Verification",
  "Withdrawal / Payout Assistance",
  "Tripod Queue & Rank Progression",
  "Account Security & Credentials",
  "Commission & Direct Overrides",
  "General Inquiry / Other",
];

export function SupportTicketsClient({ initialTickets, customId }: SupportTicketsClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Form states
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === "OPEN").length;
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED").length;

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "ALL") return true;
    return t.status === filterStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!subject.trim() || subject.trim().length < 3) {
      setError("Please enter a descriptive subject (at least 3 characters).");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError("Please provide full details in your message (at least 10 characters).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/member/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit support ticket.");
      }

      setSuccess("Support ticket submitted successfully! Administrator will review it shortly.");
      setTickets([data.ticket, ...tickets]);
      setSubject("");
      setMessage("");
      setCategory(CATEGORIES[0]);

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1424] to-[#131d33] border border-[#d4af37]/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <LifeBuoy size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
              Support & Help Desk
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8] max-w-xl leading-relaxed">
            Need assistance with transactions, queue matching, or account questions? Submit a ticket directly to the SEORALINK administrative desk.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setIsModalOpen(true);
          }}
          className="btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#d4af37]/10 cursor-pointer"
        >
          <PlusCircle size={16} />
          <span>Open New Ticket</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8] flex items-center gap-1.5">
            <MessageSquare size={13} className="text-[#38bdf8]" />
            <span>Total Tickets</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
            {totalTickets}
          </div>
        </div>

        <div className="bg-white dark:bg-[#070a14] border border-amber-500/30 rounded-xl p-3.5 sm:p-4 shadow-sm bg-amber-500/5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>In Review (Open)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-500 mt-1.5 font-mono">
            {openTickets}
          </div>
        </div>

        <div className="bg-white dark:bg-[#070a14] border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 shadow-sm bg-emerald-500/5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Resolved</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-500 mt-1.5 font-mono">
            {resolvedTickets}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] pb-3">
        <div className="flex items-center gap-2">
          {(['ALL', 'OPEN', 'RESOLVED', 'CLOSED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === tab
                  ? "bg-[#d4af37] text-black shadow-sm"
                  : "text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#0d1424]"
              }`}
            >
              {tab === "ALL" ? "All Tickets" : tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-[#64748b]">
          Showing {filteredTickets.length} of {totalTickets}
        </span>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] rounded-2xl shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#0d1424] border border-slate-200 dark:border-[#d4af37]/20 flex items-center justify-center text-slate-400 dark:text-[#d4af37]">
            <LifeBuoy size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Support Tickets Found</h3>
          <p className="text-xs text-slate-500 dark:text-[#94a3b8] max-w-sm mx-auto">
            {filterStatus === "ALL"
              ? "You have not submitted any support tickets yet. Click 'Open New Ticket' if you have any questions or issues."
              : `No tickets with status '${filterStatus}'.`}
          </p>
          {filterStatus === "ALL" && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <PlusCircle size={14} />
              <span>Create Ticket</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => {
            const isResolved = t.status === "RESOLVED";
            const isOpenStatus = t.status === "OPEN";

            return (
              <div
                key={t.id}
                className={`bg-white dark:bg-[#070a14] border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                  isOpenStatus
                    ? "border-amber-500/40 hover:border-amber-500/70"
                    : isResolved
                    ? "border-emerald-500/40 hover:border-emerald-500/70"
                    : "border-slate-200 dark:border-[#1e293b]"
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1e293b] pb-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#38bdf8]/10 text-[#0284c7] dark:text-[#38bdf8] border border-[#38bdf8]/30">
                      {t.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-[#64748b]">
                      #{t.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-[#64748b] flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {isOpenStatus && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        In Review
                      </span>
                    )}
                    {isResolved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        Resolved
                      </span>
                    )}
                    {t.status === "CLOSED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/30">
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject & User Message */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.subject}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#cbd5e1] whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-[#0c1220] p-3.5 rounded-xl border border-slate-100 dark:border-[#1a2333]">
                    {t.message}
                  </p>
                </div>

                {/* Administrator Reply Box */}
                {t.adminReply && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
                    <div className="bg-gradient-to-br from-[#0c182d] to-[#08101e] border border-[#d4af37]/35 rounded-xl p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#d4af37]">
                          <ShieldCheck size={14} className="text-[#d4af37]" />
                          <span>SEORALINK Administration Response</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-[#94a3b8]">
                          Updated {new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-xs text-white whitespace-pre-wrap leading-relaxed pl-1">
                        {t.adminReply}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for New Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-[#d4af37]/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e293b] flex items-center justify-between bg-slate-50 dark:bg-[#0d1424]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                  <LifeBuoy size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Open Support Ticket</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">Member ID: {customId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] mb-1.5">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070a14] border border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-white dark:bg-[#070a14]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue (e.g. Deposit TxID pending)"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070a14] border border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] mb-1.5">
                  Detailed Message / TxID
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please specify details, blockchain hash, or questions so our staff can assist immediately..."
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070a14] border border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] resize-none"
                />
                <div className="text-right text-[10px] text-slate-400 dark:text-[#64748b] mt-1">
                  {message.length}/1000
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
