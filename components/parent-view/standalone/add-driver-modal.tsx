"use client";

import { ChangeEvent } from "react";
import { Car, MailPlus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { StatusBadge } from "./status-badge";
import type { DriverSummary } from "./types";
import { inputClass } from "./utils";

type InviteForm = {
  email: string;
  phoneNumber: string;
};

type AddDriverModalProps = {
  query: string;
  searchResults: DriverSummary[];
  inviteForm: InviteForm;
  isPending: boolean;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onInviteFormChange: (inviteForm: InviteForm) => void;
  onSearchDrivers: () => void;
  onRequestDriver: (driverId: string) => void;
  onRequestAgain: (driver: DriverSummary) => void;
  onInviteDriver: () => void;
};

export function AddDriverModal({
  query,
  searchResults,
  inviteForm,
  isPending,
  onClose,
  onQueryChange,
  onInviteFormChange,
  onSearchDrivers,
  onRequestDriver,
  onRequestAgain,
  onInviteDriver,
}: AddDriverModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-xl bg-white p-4 shadow-2xl sm:rounded-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Add driver</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close add driver">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-base font-semibold">Find known driver</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input className={inputClass} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Driver share ID, email, or phone" />
              <Button disabled={isPending || !query.trim()} onClick={onSearchDrivers} className="gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {searchResults.map((driver) => (
                <div key={driver.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                      {driver.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={driver.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Car className="h-6 w-6 text-slate-500" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{driver.full_name}</p>
                      <p className="text-xs text-slate-500">{driver.shareId || "No share ID"} · {driver.vehicle || "Vehicle pending"}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {driver.existingConnection && <StatusBadge status={driver.existingConnection.status} />}
                    {driver.existingConnection?.status === "REVOKED" ? (
                      <Button size="sm" disabled={isPending} onClick={() => onRequestAgain(driver)}>
                        Request again
                      </Button>
                    ) : (
                      <Button size="sm" disabled={isPending || !!driver.existingConnection} onClick={() => onRequestDriver(driver.id)}>
                        {driver.existingConnection ? driver.existingConnection.status.replaceAll("_", " ") : "Request"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!searchResults.length && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Search for a driver you already know.</p>}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-base font-semibold">Invite unregistered driver</h3>
            <div className="grid gap-2">
              <Input
                className={inputClass}
                value={inviteForm.email}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onInviteFormChange({ ...inviteForm, email: event.target.value })}
                placeholder="Driver email"
              />
              <Input
                className={inputClass}
                value={inviteForm.phoneNumber}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onInviteFormChange({ ...inviteForm, phoneNumber: event.target.value })}
                placeholder="Driver phone"
              />
              <Button disabled={isPending || (!inviteForm.email.trim() && !inviteForm.phoneNumber.trim())} onClick={onInviteDriver} className="gap-2">
                <MailPlus className="h-4 w-4" /> Send invite
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
