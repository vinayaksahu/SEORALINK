"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Send,
  X,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  User as UserIcon,
} from "lucide-react";
import { TIER_NAMES } from "@/lib/constants";

interface TicketUser {
  id: string;
  customId: string;
  fullName: string;
  email: string;
  phone: string | null;
  currentTier: number;
  status: string;
}

interface AdminTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  user: TicketUser;
}

interface AdminTicketsClientProps {
  initialTickets: AdminTicket[];
}

export function AdminTicketsClient({ initialTickets }: AdminTicketsClientProps) {
  const [tickets, setTickets] = useState<AdminTicket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reply form states
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<string>("RESOLVED");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const closedCount = tickets.filter((t) => t.status === "CLOSED").length;

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchUser =
        t.user.customId.toLowerCase().includes(q) ||
        t.user.fullName.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q);
      const matchSubject = t.subject.toLowerCase().includes(q);
      const matchCategory = t.category.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      return matchUser || matchSubject || matchCategory || matchId;
    }

    return true;
  });

  const handleOpenReplyModal = (ticket: AdminTicket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.adminReply || "");
    setReplyStatus(ticket.status === "OPEN" ? "RESOLVED" : ticket.status);
    setError(null);
    setSuccess(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/tickets");
      if (res.ok) {
        const data = await res.json();
        if (data.tickets) {
          setTickets(data.tickets);
        }
      }
    } catch (err) {
      console.error("Failed to refresh tickets", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    if (!replyText.trim() && replyStatus === "RESOLVED") {
      setError("Please write an administrator reply before marking the ticket as Resolved.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminReply: replyText.trim(),
          status: replyStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update ticket");
      }

      setSuccess("Ticket updated successfully!");

      // Update local ticket list
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                adminReply: replyText.trim(),
                status: replyStatus,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      setTimeout(() => {
        setSelectedTicket(null);
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1424] to-[#1a1c2e] border border-red-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-500">
              <LifeBuoy size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
              Support Tickets Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8] max-w-xl leading-relaxed">
            Review member inquiries, verify transaction difficulties, and reply directly to resolve user issues.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 text-xs font-bold text-[#cbd5e1] hover:text-white bg-[#070a14] border border-[#1e293b] hover:border-[#d4af37]/40 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[#d4af37]" : ""} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Tickets"}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8] flex items-center gap-1.5">
            <MessageSquare size={13} className="text-[#38bdf8]" />
            <span>Total Tickets</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
            {totalCount}
          </div>
        </div>

        <div className="bg-white dark:bg-[#070a14] border border-amber-500/30 rounded-xl p-4 shadow-sm bg-amber-500/5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Open (Action Needed)</span>
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1.5 font-mono">
            {openCount}
          </div>
        </div>

        <div className="bg-white dark:bg-[#070a14] border border-emerald-500/30 rounded-xl p-4 shadow-sm bg-emerald-500/5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Resolved</span>
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-1.5 font-mono">
            {resolvedCount}
          </div>
        </div>

        <div className="bg-white dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8] flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span>Closed</span>
          </div>
          <div className="text-2xl font-black text-slate-400 mt-1.5 font-mono">
            {closedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'OPEN', 'RESOLVED', 'CLOSED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === tab
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#0d1424]"
              }`}
            >
              {tab === "ALL" ? "All Tickets" : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member ID, name, or subject..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-[#1e293b] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Tickets List / Table */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] rounded-2xl shadow-sm space-y-2">
          <LifeBuoy size={28} className="mx-auto text-slate-400 dark:text-[#64748b]" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Tickets Found</h3>
          <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
            {searchQuery
              ? `No tickets matched "${searchQuery}".`
              : "No support tickets currently match the selected filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => {
            const isOpen = t.status === "OPEN";
            const isResolved = t.status === "RESOLVED";

            return (
              <div
                key={t.id}
                className={`bg-white dark:bg-[#070a14] border rounded-xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-md ${
                  isOpen
                    ? "border-amber-500/50 bg-amber-500/[0.02]"
                    : isResolved
                    ? "border-emerald-500/40"
                    : "border-slate-200 dark:border-[#1e293b]"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Member & Ticket Summary */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* User Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black font-mono bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                        {t.user.customId}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.user.fullName}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-[#94a3b8] font-mono">
                        ({t.user.email})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#131d33] text-slate-600 dark:text-[#94a3b8]">
                        {TIER_NAMES[t.user.currentTier] || "Junior"}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#38bdf8]/10 text-[#0284c7] dark:text-[#38bdf8] border border-[#38bdf8]/30">
                          {t.category}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {t.subject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-[#cbd5e1] line-clamp-2 leading-relaxed bg-slate-50 dark:bg-[#0d1424] p-2.5 rounded-lg border border-slate-100 dark:border-[#1e293b]">
                        {t.message}
                      </p>
                    </div>

                    {t.adminReply && (
                      <div className="text-[11px] text-[#d4af37] bg-[#0d1424] border border-[#d4af37]/25 p-2 rounded-lg flex items-center gap-1.5">
                        <ShieldCheck size={12} className="shrink-0 text-[#d4af37]" />
                        <span className="font-bold">Replied:</span>
                        <span className="truncate text-slate-300">{t.adminReply}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Status & Action */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-[#1e293b]">
                    <div className="flex items-center gap-2">
                      {isOpen && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Needs Reply
                        </span>
                      )}
                      {isResolved && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Resolved
                        </span>
                      )}
                      {t.status === "CLOSED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/30">
                          Closed
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-[#64748b]">
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReplyModal(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isOpen
                          ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                          : "bg-[#0d1424] hover:bg-[#1a2333] text-white border border-[#1e293b]"
                      }`}
                    >
                      <MessageSquare size={13} />
                      <span>{t.adminReply ? "Update Reply" : "Reply Ticket"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Reply & Status Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-red-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e293b] flex items-center justify-between bg-slate-50 dark:bg-[#0d1424] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
                  <LifeBuoy size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Ticket Resolution #{selectedTicket.id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                    Member: {selectedTicket.user.fullName} ({selectedTicket.user.customId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-200 dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSendReply} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
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

              {/* Member Inquiry Context */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-[#1e293b] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#38bdf8]/10 text-[#0284c7] dark:text-[#38bdf8] border border-[#38bdf8]/30">
                    {selectedTicket.category}
                  </span>
                  <span className="text-slate-500 dark:text-[#64748b] text-[11px]">
                    Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedTicket.subject}
                </h4>
                <p className="text-xs text-slate-700 dark:text-[#cbd5e1] whitespace-pre-wrap leading-relaxed bg-white dark:bg-[#0d1424] p-3 rounded-lg border border-slate-200 dark:border-[#1a2333]">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] mb-1.5">
                  Update Ticket Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "RESOLVED", label: "Resolved", color: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10" },
                    { val: "OPEN", label: "Keep Open", color: "text-amber-500 border-amber-500/40 bg-amber-500/10" },
                    { val: "CLOSED", label: "Close", color: "text-slate-400 border-slate-500/40 bg-slate-500/10" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setReplyStatus(s.val)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        replyStatus === s.val
                          ? `${s.color} ring-2 ring-white/20`
                          : "border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#0d1424]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Reply Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94a3b8] mb-1.5">
                  Administrator Response (Visible to Member)
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official response to the member (e.g. Deposit verified and approved, or instructions on how to proceed)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070a14] border border-slate-300 dark:border-[#1e293b] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] resize-none leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Reply & Save</span>
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
