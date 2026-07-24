"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Save, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function AccountControlPanel({
  type,
  id,
}: {
  type: "school" | "parent" | "driver" | "teacher";
  id: string;
}) {
  const [account, setAccount] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    full_name: "",
    phoneNumber: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    jsonFetch(`/api/admin/accounts/${type}/${id}`)
      .then((data) => {
        setAccount(data.account);
        setForm({
          name: data.account?.name || "",
          full_name: data.account?.full_name || "",
          phoneNumber: data.account?.phoneNumber || "",
          address: data.account?.address || "",
        });
      })
      .catch((error) =>
        toast({
          description: error instanceof Error ? error.message : "Unable to load account",
          variant: "destructive",
        })
      )
      .finally(() => setLoading(false));
  }, [id, type]);

  const save = () => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/admin/accounts/${type}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(type === "school" ? { name: form.name } : form),
        });
        setAccount((current: any) => ({ ...current, ...data.account }));
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update account",
          variant: "destructive",
        });
      }
    });
  };

  const openWorkspace = () => {
    const reason =
      window.prompt(
        "Access reason: SUPPORT, ONBOARDING, BILLING_INVESTIGATION, or DATA_CORRECTION",
        "SUPPORT"
      ) || "";
    if (!reason) return;
    const note = window.prompt("Optional note", "") || "";
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/admin/workspaces", {
          method: "POST",
          body: JSON.stringify({
            subjectType: type.toUpperCase(),
            subjectId: id,
            reason: reason.toUpperCase(),
            note,
          }),
        });
        window.location.assign(data.redirectUrl);
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to open workspace",
          variant: "destructive",
        });
      }
    });
  };

  const toggleSuspension = () => {
    const suspended = Boolean(account?.suspendedAt);
    const reason = suspended
      ? null
      : window.prompt("Suspension reason", "Platform safety review");
    if (!suspended && !reason) return;
    startTransition(async () => {
      try {
        const data = await jsonFetch(
          `/api/admin/users/${encodeURIComponent(`${type}:${id}`)}/suspension`,
          {
            method: "PATCH",
            body: JSON.stringify({
              action: suspended ? "unsuspend" : "suspend",
              reason,
            }),
          }
        );
        setAccount((current: any) => ({
          ...current,
          suspendedAt: suspended ? null : new Date().toISOString(),
          suspendedReason: suspended ? null : reason,
        }));
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update status",
          variant: "destructive",
        });
      }
    });
  };

  if (loading) return <div className="rounded-lg border bg-white p-5">Loading account…</div>;
  if (!account) return <div className="rounded-lg border bg-white p-5">Account not found.</div>;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500">{type} account</p>
          <h1 className="text-2xl font-semibold">
            {account.name || account.full_name || account.email || id}
          </h1>
          <p className="text-sm text-slate-500">{account.email || "No email"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={isPending} onClick={openWorkspace} className="gap-2">
            <ExternalLink className="h-4 w-4" /> Open workspace
          </Button>
          <Button variant="outline" disabled={isPending} onClick={toggleSuspension} className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            {account.suspendedAt ? "Unsuspend" : "Suspend"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/billing">Billing control</Link>
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Editable profile</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {type === "school" ? (
            <Input
              aria-label="School name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          ) : (
            <>
              <Input
                aria-label="Full name"
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, full_name: event.target.value }))
                }
              />
              <Input
                aria-label="Phone number"
                value={form.phoneNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phoneNumber: event.target.value }))
                }
              />
              <Input
                aria-label="Address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
                className="md:col-span-2"
              />
            </>
          )}
        </div>
        <Button className="mt-3 gap-2" disabled={isPending} onClick={save}>
          <Save className="h-4 w-4" /> Save profile
        </Button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Linked platform data</h2>
        <pre className="max-h-[560px] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
          {JSON.stringify(account, null, 2)}
        </pre>
      </section>
    </div>
  );
}
