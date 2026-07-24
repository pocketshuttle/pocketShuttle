"use client";

import { useState, useTransition } from "react";
import { Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export function OrganizationManager({ organizations }: { organizations: any[] }) {
  const [rows, setRows] = useState(organizations);
  const [form, setForm] = useState({ name: "", slug: "", billingEmail: "" });
  const [isPending, startTransition] = useTransition();

  const createOrganization = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to create organization");
        setRows((current) => [
          ...current,
          {
            ...data.organization,
            branches: [],
            billingAccount: null,
            _count: { members: 0, apiKeys: 0, webhooks: 0 },
          },
        ]);
        setForm({ name: "", slug: "", billingEmail: "" });
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to create organization",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Create enterprise organization</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Organization name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Input placeholder="organization-slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
          <Input type="email" placeholder="Billing email" value={form.billingEmail} onChange={(event) => setForm((current) => ({ ...current, billingEmail: event.target.value }))} />
          <Button disabled={isPending || !form.name || !form.slug} onClick={createOrganization}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </section>

      <section className="grid gap-3">
        {rows.map((organization) => (
          <article key={organization.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{organization.name}</p>
                <p className="text-sm text-slate-500">{organization.slug}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">{organization.branches?.length || 0} branches</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{organization._count?.members || 0} members</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{organization._count?.apiKeys || 0} API keys</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{organization._count?.webhooks || 0} webhooks</span>
            </div>
          </article>
        ))}
        {!rows.length ? <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">No enterprise organizations yet.</p> : null}
      </section>
    </div>
  );
}
