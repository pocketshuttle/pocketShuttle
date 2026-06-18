"use client";

import { Check, X } from "lucide-react";

import Logout from "@/components/dashboard/sidebar/logout";
import { Button } from "@/components/ui/button";

import { StatusBadge } from "./status-badge";
import type { Connection, Invite } from "./types";
import { formatDate } from "./utils";

type BillingSummary = {
  freeTrial: number;
  active: number;
  pastDue: number;
  nextTrialEnd?: Date | null;
};

type ParentSideMenuProps = {
  open: boolean;
  parentName?: string | null;
  billingSummary: BillingSummary;
  pendingConnections: Connection[];
  approvedConnections: Connection[];
  invites: Invite[];
  isPending: boolean;
  onClose: () => void;
  onApproveConnection: (connectionId: string) => void;
  onRevokeConnection: (connection: Connection) => void;
};

export function ParentSideMenu({
  open,
  parentName,
  billingSummary,
  pendingConnections,
  approvedConnections,
  invites,
  isPending,
  onClose,
  onApproveConnection,
  onRevokeConnection,
}: ParentSideMenuProps) {
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
          <h2 className="mb-3 text-base font-semibold">Payment plan</h2>
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
          <Logout />
        </section>
      </div>
    </aside>
  );
}
