"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Copy, LifeBuoy, PlusCircle, Send, Ticket, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

type SupportTicket = {
  id: string;
  message: string;
  status: "PENDING" | "FIXED";
  priority?: "HIGH" | "NORMAL";
  createdAt: string | Date;
  updatedAt: string | Date;
  fixedAt?: string | Date | null;
  deletedAt?: string | Date | null;
};

type SupportTicketDialogProps = {
  open: boolean;
  onClose: () => void;
  requesterName?: string | null;
  requesterId?: string | null;
  requesterLabel?: string;
};

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function SupportTicketDialog({
  open,
  onClose,
  requesterName,
  requesterId,
  requesterLabel = "Account",
}: SupportTicketDialogProps) {
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [mode, setMode] = useState<"track" | "new" | "history">("new");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async (nextMode: "track" | "history" = "track") => {
    setLoading(true);
    try {
      const data = await jsonFetch(nextMode === "history" ? "/api/support-tickets?view=history" : "/api/support-tickets");
      const nextTickets = Array.isArray(data.tickets) ? data.tickets : [];
      setTickets(nextTickets);
      setMode(nextMode === "history" ? "history" : nextTickets.length ? "track" : "new");
      setLoaded(true);
    } catch (error) {
      toast({ description: error instanceof Error ? error.message : "Unable to load support tickets.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyRequesterId = async () => {
    if (!requesterId) return;
    await navigator.clipboard.writeText(requesterId);
    toast({ description: `${requesterLabel} ID copied.` });
  };

  const submitTicket = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      toast({ description: "Please describe the issue before sending.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const data = await jsonFetch("/api/support-tickets", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      setMessage("");
      setTickets((current) => [data.ticket, ...current].filter(Boolean));
      setMode("track");
      setLoaded(true);
      toast({ description: data.message || "Support request sent." });
    } catch (error) {
      toast({ description: error instanceof Error ? error.message : "Unable to send support request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (open && !loaded && !loading) {
      loadTickets();
    }
  }, [open, loaded, loading]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 text-slate-950 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold">Contact support</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close support">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3">
          {loaded && (
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant={mode === "track" ? "default" : "outline"} onClick={() => loadTickets("track")} className="gap-2">
                <Ticket className="h-4 w-4" aria-hidden="true" />
                Track
              </Button>
              <Button type="button" variant={mode === "history" ? "default" : "outline"} onClick={() => loadTickets("history")} className="gap-2">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                History
              </Button>
              <Button type="button" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")} className="gap-2">
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                New
              </Button>
            </div>
          )}

          {loading && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Loading tickets...</p>}

          {(mode === "track" || mode === "history") && tickets.length > 0 ? (
            <div className="grid gap-2">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ticket.status === "FIXED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {ticket.status === "FIXED" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
                      {ticket.status}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(ticket.createdAt)}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{ticket.message}</p>
                  {mode === "history" && ticket.deletedAt && (
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      History until {formatDate(new Date(new Date(ticket.deletedAt).getTime() + 21 * 24 * 60 * 60 * 1000))}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : mode === "history" ? (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No deleted ticket history from the last 21 days.</p>
          ) : (
            <div className="grid gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">From</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-950">{requesterName || requesterLabel}</p>
                {requesterId && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2">
                    <span className="min-w-0 truncate text-xs font-medium text-slate-600">{requesterId}</span>
                    <button type="button" onClick={copyRequesterId} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label={`Copy ${requesterLabel} ID`}>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell support what happened"
                maxLength={2000}
                className="min-h-28 resize-none border-slate-200 bg-white text-slate-900 shadow-none"
              />
              <Button type="button" disabled={submitting || message.trim().length < 5} onClick={submitTicket} className="gap-2">
                <Send className="h-4 w-4" aria-hidden="true" />
                {submitting ? "Sending..." : "Send"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
