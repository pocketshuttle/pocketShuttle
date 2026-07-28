"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseCsv } from "@/lib/csv";

type UsageItem = { current: number; limit: number | null; remaining: number | null };
type Person = { id: string; full_name: string | null; email?: string | null };
type Bus = {
  id: string;
  bus_number: string;
  bus_product_name: string;
  seat_number: number;
  availableSeats: number;
  driver: Person | null;
  teacher: Person | null;
  route: { route_name: string } | null;
  _count: { students: number };
};
type Driver = Person & {
  verificationStatus: string;
  verificationRejectionReason: string | null;
};
type Policy = { id: string; eventType: string; channel: string; enabled: boolean };
type ImportJob = {
  id: string;
  resource: string;
  status: string;
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  errors: unknown;
  createdAt: string;
};
type HubData = {
  plan: { code: string; name: string; status: string; entitlements: Record<string, boolean | number | null> };
  usage: Record<string, UsageItem>;
  analytics: Record<string, number | Record<string, number>> | null;
  buses: Bus[];
  drivers: Driver[];
  teachers: Person[];
  memberships: Array<{ id: string; actorId: string; actorType: string; role: string }>;
  policies: Policy[];
  importJobs: ImportJob[];
};

const policyEvents = [
  "trip_started",
  "participant_boarded",
  "participant_dropped",
  "eta_updated",
  "route_deviation",
  "unusual_stop",
  "emergency_triggered",
];
const exportResources = ["students", "staff", "vehicles", "trips", "attendance", "reports"];

async function jsonRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.code || "Request failed");
  return body;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4 dark:bg-zinc-950">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function SchoolProHub() {
  const [data, setData] = useState<HubData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [importResource, setImportResource] = useState("STUDENTS");
  const [importRows, setImportRows] = useState<Array<Record<string, string>>>([]);
  const [importFileName, setImportFileName] = useState("");
  const [member, setMember] = useState({ actor: "", role: "DISPATCHER" });

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await jsonRequest("/api/school/pro", { cache: "no-store" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load School Pro");
    }
  }, []);

  useEffect(() => void load(), [load]);

  const staff = useMemo(
    () => [
      ...(data?.drivers || []).map((person) => ({ ...person, type: "driver" })),
      ...(data?.teachers || []).map((person) => ({ ...person, type: "teacher" })),
    ],
    [data]
  );
  const isPro = data?.plan.entitlements.analytics === true;
  const analytics = data?.analytics || {};

  async function mutate(key: string, url: string, options: RequestInit) {
    try {
      setBusy(key);
      setError("");
      const result = await jsonRequest(url, options);
      setNotice(result.message || "Saved");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setBusy("");
    }
  }

  async function readCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImportRows(parseCsv(await file.text()));
      setImportFileName(file.name);
      setError("");
    } catch (csvError) {
      setImportRows([]);
      setError(csvError instanceof Error ? csvError.message : "Invalid CSV");
    }
  }

  function downloadErrors(job: ImportJob) {
    const errors = Array.isArray(job.errors) ? job.errors : [];
    const output = ["row,message", ...errors.map((item: any) => `${item.row},"${String(item.message || "").replaceAll('"', '""')}"`)].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([output], { type: "text/csv" }));
    link.download = `${job.resource.toLowerCase()}-import-errors.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (!data) return <div className="rounded-xl border bg-white p-6">{error || "Loading School Pro…"}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="rounded-2xl bg-slate-950 p-6 text-white">
        <p className="text-sm text-slate-300">Operations and rollout readiness</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">School Pro</h1>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{data.plan.name} · {data.plan.status}</span>
        </div>
        {!isPro && <p className="mt-3 text-sm text-amber-200">Pro workflows remain visible for evaluation, but paid automation is locked until this school joins the pilot.</p>}
      </header>

      {(error || notice) && (
        <div className={`rounded-lg border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || notice}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Usage and performance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.usage).map(([key, item]) => (
            <Metric key={key} label={key.replaceAll("_", " ")} value={`${item.current} / ${item.limit ?? "Unlimited"}`} />
          ))}
          {data.analytics ? <>
            <Metric label="Trips" value={Number(analytics.trips || 0)} />
            <Metric label="Completion" value={`${Number(analytics.completionRate || 0)}%`} />
            <Metric label="Capacity" value={`${Number(analytics.capacityUtilization || 0)}%`} />
            <Metric label="Safety events" value={Number(analytics.safetyEvents || 0)} />
            <Metric label="Avg. trip minutes" value={Number(analytics.averageTripMinutes || 0)} />
            <Metric label="Notifications accepted" value={Number(analytics.notificationAccepted || 0)} />
            <Metric label="Notifications failed" value={Number(analytics.notificationFailed || 0)} />
          </> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:col-span-2">School analytics unlock after pilot enrollment.</div>}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Fleet assignments</h2>
        <p className="mt-1 text-sm text-slate-500">Assign the authorized driver and teacher for each bus.</p>
        <div className="mt-4 space-y-3">
          {data.buses.map((bus) => (
            <AssignmentRow key={bus.id} bus={bus} drivers={data.drivers} teachers={data.teachers} busy={busy} onSave={(driverId, teacherId) => mutate(`bus-${bus.id}`, "/api/school/assignments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ busId: bus.id, driverId, teacherId }) })} />
          ))}
          {!data.buses.length && <p className="text-sm text-slate-500">No buses have been created.</p>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Driver verification</h2>
          <div className="mt-4 space-y-3">
            {data.drivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div><p className="font-medium">{driver.full_name}</p><p className="text-xs text-slate-500">{driver.verificationStatus}</p></div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === `driver-${driver.id}`} onClick={() => mutate(`driver-${driver.id}`, `/api/school/drivers/${driver.id}/verification`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) })}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={busy === `driver-${driver.id}`} onClick={() => mutate(`driver-${driver.id}`, `/api/school/drivers/${driver.id}/verification`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject", reason: "School verification declined" }) })}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Fixed staff roles</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={member.actor} onChange={(event) => setMember((current) => ({ ...current, actor: event.target.value }))}>
              <option value="">Select staff member</option>
              {staff.map((person) => <option key={`${person.type}-${person.id}`} value={`${person.type}:${person.id}`}>{person.full_name || person.email} · {person.type}</option>)}
            </select>
            <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={member.role} onChange={(event) => setMember((current) => ({ ...current, role: event.target.value }))}>
              {['ADMINISTRATOR', 'DISPATCHER', 'TEACHER', 'DRIVER'].map((role) => <option key={role}>{role}</option>)}
            </select>
          </div>
          <Button className="mt-3" disabled={!member.actor || busy === "membership"} onClick={() => { const [actorType, actorId] = member.actor.split(":"); void mutate("membership", "/api/school/memberships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actorType, actorId, role: member.role }) }); }}>Save role</Button>
          <div className="mt-4 space-y-2 text-sm">
            {data.memberships.map((membership) => <p key={membership.id} className="rounded-md bg-slate-50 px-3 py-2 dark:bg-zinc-900">{membership.actorType} · {membership.role}</p>)}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Parent notification automation</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {policyEvents.map((eventType) => {
            const current = data.policies.find((policy) => policy.eventType === eventType && policy.channel === "PUSH");
            return <label key={eventType} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{eventType.replaceAll("_", " ")}</span><input type="checkbox" checked={current?.enabled || false} onChange={(event) => void mutate(`policy-${eventType}`, "/api/school/notification-policies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType, channel: "PUSH", enabled: event.target.checked }) })} /></label>;
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Validated CSV import</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={importResource} onChange={(event) => setImportResource(event.target.value)}>{['STUDENTS', 'STAFF', 'VEHICLES', 'ROUTES', 'ASSIGNMENTS'].map((resource) => <option key={resource}>{resource}</option>)}</select>
            <Input type="file" accept=".csv,text/csv" onChange={readCsv} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{importFileName ? `${importFileName}: ${importRows.length} rows ready` : "Choose a CSV with headers matching the selected resource."}</p>
          <Button className="mt-3" disabled={!importRows.length || busy === "import"} onClick={() => void mutate("import", "/api/school/import-jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resource: importResource, clientRequestId: crypto.randomUUID(), rows: importRows }) })}>Import rows</Button>
          <div className="mt-4 space-y-2">
            {data.importJobs.slice(0, 8).map((job) => <div key={job.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm dark:bg-zinc-900"><span>{job.resource} · {job.status} · {job.succeededRows}/{job.totalRows}</span>{job.failedRows > 0 && <Button size="sm" variant="outline" onClick={() => downloadErrors(job)}>Errors</Button>}</div>)}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Entitled exports</h2>
          <p className="mt-1 text-sm text-slate-500">Exports automatically honor the subscription history window.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {exportResources.map((resource) => <Button key={resource} asChild variant="outline"><a href={`/api/school/export?resource=${resource}`}>{resource[0].toUpperCase() + resource.slice(1)} CSV</a></Button>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function AssignmentRow({ bus, drivers, teachers, busy, onSave }: { bus: Bus; drivers: Driver[]; teachers: Person[]; busy: string; onSave: (driverId: string | null, teacherId: string | null) => void }) {
  const [driverId, setDriverId] = useState(bus.driver?.id || "");
  const [teacherId, setTeacherId] = useState(bus.teacher?.id || "");
  return <div className="grid items-center gap-3 rounded-xl border p-3 md:grid-cols-[1fr_1fr_1fr_auto]"><div><p className="font-medium">{bus.bus_number} · {bus.bus_product_name}</p><p className="text-xs text-slate-500">{bus.route?.route_name || "No route"} · {bus._count.students}/{bus.seat_number} students</p></div><select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={driverId} onChange={(event) => setDriverId(event.target.value)}><option value="">No driver</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}</option>)}</select><select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={teacherId} onChange={(event) => setTeacherId(event.target.value)}><option value="">No teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select><Button size="sm" disabled={busy === `bus-${bus.id}`} onClick={() => onSave(driverId || null, teacherId || null)}>Save</Button></div>;
}
