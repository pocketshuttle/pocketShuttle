"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, ChevronRight, Clock3, Copy, LifeBuoy, Loader2, PlusCircle, Send, Settings, Ticket, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

import { StatusBadge } from "./status-badge";
import type { Connection, Invite } from "./types";
import { formatDate, jsonFetch } from "./utils";

type BillingSummary = {
  freeTrial: number;
  active: number;
  pastDue: number;
  nextTrialEnd?: Date | null;
};

type SubscriptionUsage = {
  planCode: string;
  planName: string;
  childCount: number;
  maxChildren: number | null;
  driverCount: number;
  maxConnectedDrivers: number | null;
  enforcementEnabled: boolean;
};

type ParentSideMenuProps = {
  open: boolean;
  parentId: string;
  parentName?: string | null;
  billingSummary: BillingSummary;
  subscription: SubscriptionUsage;
  pendingConnections: Connection[];
  approvedConnections: Connection[];
  invites: Invite[];
  isPending: boolean;
  onClose: () => void;
  onApproveConnection: (connectionId: string) => void;
  onRevokeConnection: (connection: Connection) => void;
};

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

export function ParentSideMenu({
  open,
  parentId,
  parentName,
  billingSummary,
  subscription,
  pendingConnections,
  approvedConnections,
  invites,
  isPending,
  onClose,
  onApproveConnection,
  onRevokeConnection,
}: ParentSideMenuProps) {
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportMode, setSupportMode] = useState<"track" | "new" | "history">("new");
  const [supportLoaded, setSupportLoaded] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const copyParentId = async () => {
    await navigator.clipboard.writeText(parentId);
    toast({ description: "Parent ID copied." });
  };

  const loadSupportTickets = async (mode: "track" | "history" = "track") => {
    setSupportLoading(true);
    try {
      const data = await jsonFetch(mode === "history" ? "/api/support-tickets?view=history" : "/api/support-tickets");
      const tickets = Array.isArray(data.tickets) ? data.tickets : [];
      setSupportTickets(tickets);
      setSupportMode(mode === "history" ? "history" : tickets.length ? "track" : "new");
      setSupportLoaded(true);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to load support tickets.",
        variant: "destructive",
      });
    } finally {
      setSupportLoading(false);
    }
  };

  const submitSupportTicket = async () => {
    const message = supportMessage.trim();
    if (message.length < 5) {
      toast({ description: "Please describe the issue before sending.", variant: "destructive" });
      return;
    }

    setSupportSubmitting(true);
    try {
      const data = await jsonFetch("/api/support-tickets", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setSupportMessage("");
      setSupportTickets((current) => [data.ticket, ...current].filter(Boolean));
      setSupportMode("track");
      setSupportLoaded(true);
      toast({ description: data.message || "Support request sent." });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to send support request.",
        variant: "destructive",
      });
    } finally {
      setSupportSubmitting(false);
    }
  };

  useEffect(() => {
    if (open && !supportLoaded && !supportLoading) {
      loadSupportTickets();
    }
  }, [open, supportLoaded, supportLoading]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(92vw,420px)] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/parent.jpg" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase text-slate-500">Parent dashboard</p>
            <p className="truncate text-base font-semibold">{parentName || "Parent"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-5 p-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Payment plan</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {subscription.planName}
            </span>
          </div>
          <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Children</span>
              <span className="font-semibold text-slate-950">
                {subscription.childCount}/{subscription.maxChildren ?? "Unlimited"}
              </span>
            </div>
            {subscription.enforcementEnabled &&
            subscription.maxChildren !== null &&
            subscription.childCount >= subscription.maxChildren ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Your current children remain available. Upgrade before adding another child.
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-sm">
              <span className="text-slate-600">Connected drivers</span>
              <span className="font-semibold text-slate-950">
                {subscription.driverCount}/{subscription.maxConnectedDrivers ?? "Unlimited"}
              </span>
            </div>
            {subscription.enforcementEnabled &&
            subscription.maxConnectedDrivers !== null &&
            subscription.driverCount >= subscription.maxConnectedDrivers ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Your current drivers remain available. Upgrade before adding another driver.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-lg font-semibold">{billingSummary.freeTrial}</p>
              <p className="text-xs text-slate-500">Trials</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-lg font-semibold">{billingSummary.active}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-lg font-semibold">{billingSummary.pastDue}</p>
              <p className="text-xs text-slate-500">Past due</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Next trial ending: {billingSummary.nextTrialEnd ? formatDate(billingSummary.nextTrialEnd) : "N/A"}
          </p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href="/billing">Manage PocketShuttle plan</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/parent/pro">Open Family Pro tools</Link>
          </Button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Pending drivers</h2>
          <div className="grid gap-3">
            {pendingConnections.map((connection) => (
              <div key={connection.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{connection.driver.full_name}</p>
                    <p className="text-xs text-slate-500">{connection.driver.shareProfile?.shareId || connection.driver.shareId || "No share ID"}</p>
                    {connection.status === "INVITED" && connection.requestedBy === "parent" && (
                      <p className="mt-1 text-xs font-medium text-amber-700">Waiting for driver to accept</p>
                    )}
                  </div>
                  <StatusBadge status={connection.status} />
                </div>
                <div className="mt-3 flex gap-2">
                  {connection.status === "DRIVER_REQUESTED" && (
                    <Button size="sm" disabled={isPending} onClick={() => onApproveConnection(connection.id)} className="gap-2">
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => onRevokeConnection(connection)}>
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
            {!pendingConnections.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No pending drivers.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Invites</h2>
          <div className="grid gap-2">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{invite.email || invite.phoneNumber || "Driver invite"}</p>
                  <p className="text-xs text-slate-500">Expires {formatDate(invite.expiresAt)}</p>
                </div>
                <StatusBadge status={invite.status} />
              </div>
            ))}
            {!invites.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No registration invites yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Approved drivers</h2>
          <div className="grid gap-2">
            {approvedConnections.map((connection) => (
              <div key={connection.id} className="rounded-md border border-slate-200 p-3">
                <p className="truncate text-sm font-semibold">{connection.driver.full_name}</p>
                <p className="text-xs text-slate-500">{connection.assignments.length} assigned kid{connection.assignments.length === 1 ? "" : "s"}</p>
              </div>
            ))}
            {!approvedConnections.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No approved drivers yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold">Contact support</h2>
          </div>
          <div className="grid gap-3">
            {supportLoaded && (
              <div className="grid grid-cols-3 gap-2">
                <Button type="button" variant={supportMode === "track" ? "default" : "outline"} onClick={() => loadSupportTickets("track")} className="gap-2">
                  <Ticket className="h-4 w-4" aria-hidden="true" />
                  Track ticket
                </Button>
                <Button type="button" variant={supportMode === "history" ? "default" : "outline"} onClick={() => loadSupportTickets("history")} className="gap-2">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  History
                </Button>
                <Button type="button" variant={supportMode === "new" ? "default" : "outline"} onClick={() => setSupportMode("new")} className="gap-2">
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  New ticket
                </Button>
              </div>
            )}

            {supportLoading && (
              <div className="flex items-center justify-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading tickets...
              </div>
            )}

            {(supportMode === "track" || supportMode === "history") && supportTickets.length > 0 ? (
              <div className="grid gap-2">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ticket.status === "FIXED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {ticket.status === "FIXED" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
                        {ticket.status}
                      </span>
                      {ticket.priority === "HIGH" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          Urgent
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{formatDate(ticket.createdAt)}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{ticket.message}</p>
                    {supportMode === "history" && ticket.deletedAt && (
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        History until {formatDate(new Date(new Date(ticket.deletedAt).getTime() + 21 * 24 * 60 * 60 * 1000))}
                      </p>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setSupportMode("new")} className="gap-2">
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Open new ticket
                </Button>
              </div>
            ) : supportMode === "history" ? (
              <div className="grid gap-3">
                <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No deleted ticket history from the last 21 days.</p>
                <Button type="button" variant="outline" onClick={() => setSupportMode("new")} className="gap-2">
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Open new ticket
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">From</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">{parentName || "Parent"}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2">
                    <span className="min-w-0 truncate text-xs font-medium text-slate-600">{parentId}</span>
                    <button
                      type="button"
                      onClick={copyParentId}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                      aria-label="Copy parent ID"
                      title="Copy parent ID"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <Textarea
                  value={supportMessage}
                  onChange={(event) => setSupportMessage(event.target.value)}
                  placeholder="Tell support what happened"
                  maxLength={2000}
                  className="min-h-28 resize-none border-slate-200 bg-white text-slate-900 shadow-none"
                />
                <Button type="button" disabled={supportSubmitting || supportMessage.trim().length < 5} onClick={submitSupportTicket} className="gap-2">
                  {supportSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {supportSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
          <Link href="/parent/settings" className="flex items-center gap-3 rounded-md p-3 hover:bg-slate-50">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
              <Settings className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold text-slate-950">Settings</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </aside>
  );
}
