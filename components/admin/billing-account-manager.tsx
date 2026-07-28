"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CreditCard, Save, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type BillingAccountRow = {
  id: string;
  type: string;
  billingEmail?: string | null;
  enforcementEnabled: boolean;
  entitlementOverrides: unknown;
  usage: Record<string, number>;
  user?: { name?: string | null; email?: string | null } | null;
  parent?: { full_name?: string | null; email?: string | null } | null;
  organization?: { name: string; slug: string } | null;
  subscriptions: Array<{
    id: string;
    status: string;
    currentPeriodEnd?: string | null;
    graceEndsAt?: string | null;
    provider: string;
    plan: { code: string; name: string; tier: string };
  }>;
  paymentAttempts: Array<{ id: string; status: string; amountMinor: number; currency: string; createdAt: string }>;
  premiumMessageUsage: Array<{ id: string; periodKey: string; channel: string; count: number }>;
};

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function BillingAccountManager({
  initialAccounts,
  planCodes,
}: {
  initialAccounts: BillingAccountRow[];
  planCodes: string[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      initialAccounts.map((account) => [
        account.id,
        JSON.stringify(account.entitlementOverrides || {}, null, 2),
      ])
    )
  );
  const [isPending, startTransition] = useTransition();

  const ownerLabel = (account: BillingAccountRow) =>
    account.user?.name ||
    account.parent?.full_name ||
    account.organization?.name ||
    account.billingEmail ||
    account.id;

  const updateAccount = (account: BillingAccountRow, patch: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/admin/billing-accounts/${account.id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        setAccounts((current) =>
          current.map((row) => (row.id === account.id ? { ...row, ...data.account } : row))
        );
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update billing account",
          variant: "destructive",
        });
      }
    });
  };

  const subscriptionAction = (account: BillingAccountRow, action: string) => {
    const reason = window.prompt("Required reason", "Platform billing correction");
    if (!reason) return;
    const planCode =
      action === "ASSIGN_PLAN"
        ? window.prompt(`Plan code: ${planCodes.join(", ")}`, planCodes[0] || "")
        : null;
    if (action === "ASSIGN_PLAN" && !planCode) return;
    startTransition(async () => {
      try {
        const data = await jsonFetch(
          `/api/admin/billing-accounts/${account.id}/subscription`,
          {
            method: "POST",
            body: JSON.stringify({ action, reason, planCode }),
          }
        );
        setAccounts((current) =>
          current.map((row) =>
            row.id === account.id
              ? {
                  ...row,
                  subscriptions: [
                    data.subscription,
                    ...row.subscriptions.filter(
                      (subscription) => subscription.id !== data.subscription.id
                    ),
                  ],
                }
              : row
          )
        );
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update subscription",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Billing control</h1>
          <p className="text-sm text-slate-500">
            Plans, limits, enforcement, payment attempts, and manual subscription actions.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/admin/payment-plans">
            <CreditCard className="h-4 w-4" /> Manage plan catalog
          </Link>
        </Button>
      </div>

      {accounts.map((account) => {
        const current = account.subscriptions.find((subscription) =>
          ["ACTIVE", "TRIALING", "PAST_DUE", "NON_RENEWING"].includes(subscription.status)
        );
        return (
          <article key={account.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{ownerLabel(account)}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{account.type}</span>
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                    {current?.plan.name || "No active plan"} · {current?.status || "N/A"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {account.billingEmail || "No billing email"} · provider {current?.provider || "N/A"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(account.usage).map(([key, value]) => (
                    <span key={key} className="rounded-md bg-slate-50 px-2 py-1 text-xs">
                      {key}: {value}
                    </span>
                  ))}
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-xs">
                    payments: {account.paymentAttempts.length}
                  </span>
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-xs">
                    premium usage:{" "}
                    {account.premiumMessageUsage.reduce((sum, row) => sum + row.count, 0)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    updateAccount(account, {
                      enforcementEnabled: !account.enforcementEnabled,
                    })
                  }
                >
                  Enforcement {account.enforcementEnabled ? "on" : "shadow"}
                </Button>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => subscriptionAction(account, "ASSIGN_PLAN")}>
                  Assign plan
                </Button>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => subscriptionAction(account, "CANCEL_END_PERIOD")}>
                  End renewal
                </Button>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => subscriptionAction(account, "FALLBACK_FREE")}>
                  Fall back to free
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <label className="text-xs font-medium text-slate-600">
                Entitlement overrides
              </label>
              <textarea
                className="min-h-28 rounded-md border border-slate-200 p-3 font-mono text-xs"
                value={drafts[account.id] || "{}"}
                onChange={(event) =>
                  setDrafts((currentDrafts) => ({
                    ...currentDrafts,
                    [account.id]: event.target.value,
                  }))
                }
              />
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="w-fit gap-2"
                onClick={() => {
                  try {
                    updateAccount(account, {
                      entitlementOverrides: JSON.parse(drafts[account.id] || "{}"),
                    });
                  } catch {
                    toast({ description: "Overrides must be valid JSON", variant: "destructive" });
                  }
                }}
              >
                <Save className="h-4 w-4" /> Save overrides
              </Button>
            </div>
          </article>
        );
      })}
      {!accounts.length ? (
        <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">No billing accounts.</p>
      ) : null}
    </div>
  );
}
