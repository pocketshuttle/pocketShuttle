"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CreditCard, ExternalLink, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type Plan = {
  code: string;
  name: string;
  tier: string;
  description?: string | null;
  features?: unknown;
  isPurchasable: boolean;
  price: {
    amountMinor: number;
    currency: string;
    interval: string;
  } | null;
};

type SubscriptionSnapshot = {
  current: {
    planCode: string;
    planName: string;
    status: string;
    currentPeriodEnd?: string | null;
    entitlements: Record<string, boolean | number | null>;
  };
  payments: Array<{
    id: string;
    amountMinor: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
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
  if (!response.ok) throw new Error(data?.message || "Billing request failed");
  return data;
}

function featureLabels(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export function SubscriptionPanel({ audience }: { audience: "family" | "school" }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planData, subscriptionData] = await Promise.all([
        jsonFetch(`/api/billing/plans?audience=${audience}`),
        jsonFetch("/api/billing/subscription"),
      ]);
      setPlans(planData.plans || []);
      setSnapshot(subscriptionData);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to load billing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    void load();
  }, [load]);

  const checkout = async (planCode: string) => {
    setPendingCode(planCode);
    try {
      const data = await jsonFetch("/api/billing/subscription/checkout", {
        method: "POST",
        body: JSON.stringify({ planCode }),
      });
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to start checkout",
        variant: "destructive",
      });
      setPendingCode(null);
    }
  };

  const manage = async () => {
    setPendingCode("manage");
    try {
      const data = await jsonFetch("/api/billing/subscription/manage", {
        method: "POST",
      });
      window.location.assign(data.url);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to manage subscription",
        variant: "destructive",
      });
      setPendingCode(null);
    }
  };

  const cancel = async () => {
    setPendingCode("cancel");
    try {
      const data = await jsonFetch("/api/billing/subscription/cancel", {
        method: "POST",
      });
      toast({ description: data.message });
      await load();
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setPendingCode(null);
    }
  };

  if (loading) {
    return <div className="rounded-lg border bg-white p-6">Loading subscription…</div>;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Current subscription</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{snapshot?.current.planName || "Free"}</h1>
            <Badge variant="outline">{snapshot?.current.status || "ACTIVE"}</Badge>
          </div>
          {snapshot?.current.currentPeriodEnd ? (
            <p className="mt-1 text-sm text-slate-500">
              Current period ends {new Date(snapshot.current.currentPeriodEnd).toLocaleDateString()}
            </p>
          ) : null}
        </div>
        {snapshot?.current.planCode.includes("PRO") ? (
          <div className="flex gap-2">
            <Button variant="outline" disabled={pendingCode !== null} onClick={manage}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage payment method
            </Button>
            <Button variant="outline" disabled={pendingCode !== null} onClick={cancel}>
              Cancel renewal
            </Button>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const current = plan.code === snapshot?.current.planCode;
          const paid = plan.tier !== "FREE";
          return (
            <article key={plan.code} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                </div>
                {current ? <Badge>Current</Badge> : paid ? <LockKeyhole className="h-5 w-5 text-slate-400" /> : null}
              </div>
              <p className="mt-5 text-2xl font-semibold">
                {plan.price
                  ? `${plan.price.currency} ${(plan.price.amountMinor / 100).toLocaleString()}`
                  : "Free"}
                {plan.price ? <span className="text-sm font-normal text-slate-500"> / month</span> : null}
              </p>
              <ul className="my-5 grid gap-2 text-sm">
                {featureLabels(plan.features).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto"
                variant={current ? "outline" : "default"}
                disabled={current || !plan.isPurchasable || pendingCode !== null}
                onClick={() => checkout(plan.code)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {current
                  ? "Current plan"
                  : plan.isPurchasable
                    ? pendingCode === plan.code
                      ? "Opening checkout…"
                      : "Upgrade"
                    : paid
                      ? "Coming soon"
                      : "Included"}
              </Button>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        Emergency controls, active-trip basic location, pickup/drop-off confirmation,
        account security, privacy controls, revocation, and critical push alerts remain
        available on every plan.
      </section>
    </div>
  );
}
