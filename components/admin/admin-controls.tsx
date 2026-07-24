"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, Eye, PauseCircle, PlayCircle, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

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

function StatusBadge({ value }: { value?: string | null }) {
  const status = value || "UNKNOWN";
  const tone =
    status === "ACTIVE" || status === "VERIFIED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "SUSPENDED" || status === "REJECTED"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

function adminFileHref(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith("cloudinary:authenticated:")
    ? `/api/admin/files?ref=${encodeURIComponent(url)}`
    : url;
}

export function AdminUsersTable({ users }: { users: any[] }) {
  const [rows, setRows] = useState(users);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((user) =>
      [user.name, user.email, user.type, user.accountType, user.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [rows, query]);

  const refreshUser = async (key: string) => {
    const data = await jsonFetch(`/api/admin/users/${encodeURIComponent(key)}`);
    setSelected(data);
  };

  const openWorkspace = (user: any) => {
    const reason =
      window.prompt(
        "Access reason: SUPPORT, ONBOARDING, BILLING_INVESTIGATION, or DATA_CORRECTION",
        "SUPPORT"
      ) || "";
    if (!reason) return;
    const note = window.prompt("Optional access note", "") || "";
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/admin/workspaces", {
          method: "POST",
          body: JSON.stringify({
            subjectType: String(user.type).toUpperCase(),
            subjectId: user.id,
            reason: reason.toUpperCase(),
            note,
          }),
        });
        window.location.assign(data.redirectUrl);
      } catch (error) {
        toast({
          description:
            error instanceof Error ? error.message : "Unable to open workspace",
          variant: "destructive",
        });
      }
    });
  };

  const toggleSuspension = (user: any) => {
    const suspend = user.status !== "SUSPENDED";
    const reason = suspend ? window.prompt("Suspension reason", "Suspended by super admin") : null;
    if (suspend && reason === null) return;

    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/admin/users/${encodeURIComponent(user.key)}/suspension`, {
          method: "PATCH",
          body: JSON.stringify({ action: suspend ? "suspend" : "unsuspend", reason }),
        });
        setRows((current) =>
          current.map((row) =>
            row.key === user.key
              ? { ...row, status: suspend ? "SUSPENDED" : "ACTIVE", suspendedAt: suspend ? new Date().toISOString() : null, suspendedReason: reason }
              : row
          )
        );
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to update account", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="max-w-md bg-white" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.key}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email || "No email"}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{user.type}</td>
                  <td className="px-4 py-3">{user.accountType}</td>
                  <td className="px-4 py-3"><StatusBadge value={user.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{user.meta}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {user.type !== "superadmin" ? (
                        <Button size="sm" variant="outline" asChild className="gap-2">
                          <Link href={`/admin/accounts/${user.type}/${user.id}`}>
                            <Eye className="h-4 w-4" /> View
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={isPending} onClick={() => refreshUser(user.key)} className="gap-2">
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      )}
                      {user.type !== "superadmin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => openWorkspace(user)}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" /> Open workspace
                        </Button>
                      )}
                      {user.type !== "superadmin" && (
                        <Button size="sm" variant="outline" disabled={isPending} onClick={() => toggleSuspension(user)} className="gap-2">
                          {user.status === "SUSPENDED" ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                          {user.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Registered details</h2>
            <button onClick={() => setSelected(null)} className="rounded-md p-1 hover:bg-slate-100" aria-label="Close details">
              <X className="h-4 w-4" />
            </button>
          </div>
          <pre className="max-h-[520px] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
            {JSON.stringify(selected, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function VerificationQueue({ drivers }: { drivers: any[] }) {
  const [rows, setRows] = useState(drivers);
  const [isPending, startTransition] = useTransition();

  const updateVerification = (driverId: string, action: "approve" | "reject") => {
    const reason = action === "reject" ? window.prompt("Rejection reason", "Verification rejected") : null;
    if (action === "reject" && reason === null) return;

    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/admin/verification", {
          method: "PATCH",
          body: JSON.stringify({ driverId, action, reason }),
        });
        setRows((current) => current.map((driver) => (driver.id === driverId ? data.driver : driver)));
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to update verification", variant: "destructive" });
      }
    });
  };

  return (
    <div className="grid gap-3">
      {rows.map((driver) => (
        <div key={driver.id} className="rounded-lg border border-slate-200 bg-white p-4">
          {(() => {
            const driverImageHref = adminFileHref(driver.image);
            const utilityBillHref = adminFileHref(driver.utilityBillUrl);
            const identityDocumentHref = adminFileHref(driver.identityDocumentUrl);

            return (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-semibold">{driver.full_name}</h2>
                <StatusBadge value={driver.verificationStatus} />
              </div>
              <p className="text-sm text-slate-500">{driver.email || "No email"} · {driver.phoneNumber || "No phone"}</p>
              <div className="mt-3 grid gap-1 text-sm text-slate-700 md:grid-cols-2">
                <p>Address: {driver.address || "N/A"}</p>
                <p>Landmark: {driver.landmark || "N/A"}</p>
                <p>GPS: {driver.liveAddress ? JSON.stringify(driver.liveAddress) : "N/A"}</p>
                <p>Vehicle: {[driver.carColor, driver.carMake, driver.carModel, driver.plateNumber].filter(Boolean).join(" ") || "N/A"}</p>
                <p>Areas: {driver.serviceAreas?.length ? driver.serviceAreas.join(", ") : "N/A"}</p>
                <p>Share ID: {driver.shareProfile?.shareId || "N/A"}</p>
                <p>Known network: {driver.parentConnections?.length || 0} families · {driver.childAssignments?.length || 0} kids</p>
                <p>Driver image: {driverImageHref ? <a href={driverImageHref} target="_blank" className="text-blue-600 underline">Open image</a> : "N/A"}</p>
                <p>Utility bill: {utilityBillHref ? <a href={utilityBillHref} target="_blank" className="text-blue-600 underline">Open document</a> : "N/A"}</p>
                <p>ID document: {identityDocumentHref ? <a href={identityDocumentHref} target="_blank" className="text-blue-600 underline">Open passport/NIN</a> : "N/A"}</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["Driver image", driverImageHref],
                  ["Utility bill", utilityBillHref],
                  ["Passport/NIN", identityDocumentHref],
                ].map(([label, url]) => (
                  <a
                    key={label}
                    href={url || undefined}
                    target="_blank"
                    className={`overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${url ? "hover:border-slate-400" : "pointer-events-none opacity-60"}`}
                  >
                    <div className="grid h-32 place-items-center bg-slate-100">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-500">No file</span>
                      )}
                    </div>
                    <p className="p-2 text-xs font-medium text-slate-700">{label}</p>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={isPending || driver.verificationStatus === "VERIFIED"} onClick={() => updateVerification(driver.id, "approve")} className="gap-2">
                <Check className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" disabled={isPending || driver.verificationStatus === "REJECTED"} onClick={() => updateVerification(driver.id, "reject")} className="gap-2">
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
            );
          })()}
        </div>
      ))}
      {!rows.length && <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">No drivers found.</p>}
    </div>
  );
}

export function PaymentPlansManager({ plans }: { plans: any[] }) {
  const [rows, setRows] = useState(plans);
  const [form, setForm] = useState({
    code: "",
    name: "",
    audience: "SCHOOL",
    tier: "PRO",
    amountMinor: "",
    description: "",
    features: "",
    entitlements: "{}",
  });
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      plans.map((plan) => [
        plan.id,
        String(plan.prices?.find((price: any) => price.isActive)?.amountMinor ?? 0),
      ])
    )
  );
  const [entitlementDrafts, setEntitlementDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      plans.map((plan) => [plan.id, JSON.stringify(plan.entitlements || {}, null, 2)])
    )
  );
  const [isPending, startTransition] = useTransition();

  const createPlan = () => {
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/admin/payment-plans", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setRows((current) => [...current, data.plan]);
        setForm({
          code: "",
          name: "",
          audience: "SCHOOL",
          tier: "PRO",
          amountMinor: "",
          description: "",
          features: "",
          entitlements: "{}",
        });
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to create plan", variant: "destructive" });
      }
    });
  };

  const updatePlan = (plan: any, patch: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/admin/payment-plans/${plan.id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        setRows((current) => current.map((row) => (row.id === plan.id ? data.plan : row)));
        setEntitlementDrafts((current) => ({
          ...current,
          [plan.id]: JSON.stringify(data.plan.entitlements || {}, null, 2),
        }));
        toast({ description: data.message });
      } catch (error) {
        toast({ description: error instanceof Error ? error.message : "Unable to update plan", variant: "destructive" });
      }
    });
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold">Create plan</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Stable code (FAMILY_PLUS)" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
          <Input placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <select className="rounded-md border border-slate-200 px-3 text-sm" value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}>
            <option value="FAMILY">Family</option>
            <option value="SCHOOL">School</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select className="rounded-md border border-slate-200 px-3 text-sm" value={form.tier} onChange={(event) => setForm((current) => ({ ...current, tier: event.target.value }))}>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <Input placeholder="Monthly price in kobo" type="number" value={form.amountMinor} onChange={(event) => setForm((current) => ({ ...current, amountMinor: event.target.value }))} />
          <Input placeholder="Features, comma separated" value={form.features} onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))} />
          <textarea className="min-h-24 rounded-md border border-slate-200 p-3 font-mono text-xs md:col-span-2" aria-label="Entitlements JSON" value={form.entitlements} onChange={(event) => setForm((current) => ({ ...current, entitlements: event.target.value }))} />
          <Button disabled={isPending || !form.name.trim() || !form.code.trim()} onClick={createPlan} className="gap-2">
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Monthly price</th>
              <th className="px-4 py-3">Entitlements</th>
              <th className="px-4 py-3">Subscriptions</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((plan) => (
              <tr key={plan.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="font-mono text-xs text-slate-500">{plan.code}</p>
                  <p className="text-xs text-slate-500">{plan.audience} · {plan.tier}</p>
                  <p className="text-xs text-slate-500">{plan.description || "No description"}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-52 gap-2">
                    <Input
                      aria-label={`${plan.name} monthly price in kobo`}
                      type="number"
                      value={priceDrafts[plan.id] ?? "0"}
                      onChange={(event) => setPriceDrafts((current) => ({ ...current, [plan.id]: event.target.value }))}
                    />
                    <Button size="sm" variant="outline" disabled={isPending || plan.tier === "FREE"} onClick={() => updatePlan(plan, { amountMinor: Number(priceDrafts[plan.id] || 0) })}>
                      Save
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">NGN {(Number(priceDrafts[plan.id] || 0) / 100).toLocaleString()}</p>
                </td>
                <td className="px-4 py-3">
                  <textarea
                    className="min-h-28 w-80 rounded-md border border-slate-200 p-2 font-mono text-[11px]"
                    aria-label={`${plan.name} entitlements JSON`}
                    value={entitlementDrafts[plan.id] ?? "{}"}
                    onChange={(event) => setEntitlementDrafts((current) => ({ ...current, [plan.id]: event.target.value }))}
                  />
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => updatePlan(plan, { entitlements: entitlementDrafts[plan.id] })}>
                    Save limits
                  </Button>
                </td>
                <td className="px-4 py-3">{plan._count?.subscriptions || 0}</td>
                <td className="space-y-1 px-4 py-3">
                  <StatusBadge value={plan.isActive ? "ACTIVE" : "DISABLED"} />
                  <StatusBadge value={plan.isPublic ? "PUBLIC" : "HIDDEN"} />
                  <StatusBadge value={plan.isPurchasable ? "CHECKOUT ON" : "CHECKOUT OFF"} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="grid gap-2">
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => updatePlan(plan, { isActive: !plan.isActive })} className="gap-2">
                    <Save className="h-4 w-4" /> {plan.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => updatePlan(plan, { isPublic: !plan.isPublic })}>
                      {plan.isPublic ? "Hide" : "Show"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={isPending || plan.tier === "FREE"} onClick={() => updatePlan(plan, { isPurchasable: !plan.isPurchasable })}>
                      {plan.isPurchasable ? "Close checkout" : "Open checkout"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
