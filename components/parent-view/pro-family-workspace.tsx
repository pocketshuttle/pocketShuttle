"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell, CalendarClock, Download, MapPinned, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type Workspace = {
  plan: {
    code: string;
    name: string;
    status: string;
    entitlements: Record<string, boolean | number | null>;
  };
  usage: Record<string, { current: number; limit: number | null }>;
  places: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    isActive: boolean;
  }>;
  templates: Array<{
    id: string;
    title: string;
    schedule: { frequency?: string };
    nextRunAt?: string | null;
    isActive: boolean;
  }>;
  trips: Array<{
    id: string;
    title: string;
    status: string;
    safetyState: string;
    createdAt: string;
    viewers: Array<{ id: string; viewerId: string; viewerType: string; expiresAt?: string | null }>;
    viewerInvites: Array<{
      id: string;
      name: string;
      email?: string | null;
      phoneNumber?: string | null;
      status: string;
      emergencyContact: boolean;
      deliveryStatus: string;
      expiresAt: string;
    }>;
    events: Array<{ id: string; eventType: string; timestamp: string; payload?: Record<string, unknown> | null }>;
  }>;
  preferences: Array<{ channel: string; enabled: boolean; destination?: string | null }>;
  deliveries: Array<{
    id: string;
    channel: string;
    status: string;
    eventType?: string | null;
    createdAt: string;
  }>;
};

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function Locked({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      {children} <Link href="/billing" className="font-semibold underline">View Pro Family</Link>
    </div>
  );
}

export function ProFamilyWorkspace() {
  const [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState({ name: "", latitude: "", longitude: "", radiusMeters: "250" });
  const [template, setTemplate] = useState({ title: "", frequency: "WEEKLY", nextRunAt: "" });
  const [inviteTripId, setInviteTripId] = useState("");
  const [invite, setInvite] = useState({ name: "", email: "", phoneNumber: "", emergencyContact: false });
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await request("/api/parent/pro"));
    } catch (error) {
      toast({ description: error instanceof Error ? error.message : "Unable to load Pro Family", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const createPlace = async () => {
    try {
      await request("/api/custom-places", {
        method: "POST",
        body: JSON.stringify({ ...place, latitude: Number(place.latitude), longitude: Number(place.longitude), radiusMeters: Number(place.radiusMeters) }),
      });
      setPlace({ name: "", latitude: "", longitude: "", radiusMeters: "250" });
      await load();
      toast({ description: "Custom place created." });
    } catch (error) {
      toast({ description: error instanceof Error ? error.message : "Unable to create place", variant: "destructive" });
    }
  };

  const createTemplate = async () => {
    try {
      await request("/api/trip-templates", {
        method: "POST",
        body: JSON.stringify({
          title: template.title,
          tripType: "family_trip",
          schedule: { frequency: template.frequency },
          nextRunAt: new Date(template.nextRunAt).toISOString(),
        }),
      });
      setTemplate({ title: "", frequency: "WEEKLY", nextRunAt: "" });
      await load();
      toast({ description: "Recurring trip created." });
    } catch (error) {
      toast({ description: error instanceof Error ? error.message : "Unable to create recurring trip", variant: "destructive" });
    }
  };

  const createInvite = async () => {
    try {
      const result = await request(`/api/trips/${inviteTripId}/viewer-invites`, {
        method: "POST",
        body: JSON.stringify({ ...invite, expiresInDays: 7 }),
      });
      setInvite({ name: "", email: "", phoneNumber: "", emergencyContact: false });
      await load();
      toast({ description: result.inviteUrl ? `Invite created: ${result.inviteUrl}` : "Viewer invitation created." });
    } catch (error) {
      toast({ description: error instanceof Error ? error.message : "Unable to invite viewer", variant: "destructive" });
    }
  };

  const savePreference = async (channel: "SMS" | "WHATSAPP", enabled: boolean) => {
    try {
      await request("/api/billing/notification-preferences", {
        method: "PATCH",
        body: JSON.stringify({ channel, enabled, destination: phone }),
      });
      await load();
      toast({ description: `${channel} preference updated.` });
    } catch (error) {
      toast({ description: error instanceof Error ? error.message : "Unable to update notifications", variant: "destructive" });
    }
  };

  if (loading || !data) return <main className="min-h-screen bg-slate-50 p-6">Loading Pro Family…</main>;
  const entitled = (key: string) => data.plan.entitlements[key] === true;

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <Button asChild variant="ghost" className="w-fit gap-2"><Link href="/parent"><ArrowLeft className="h-4 w-4" />Back to parent dashboard</Link></Button>
        <header className="rounded-2xl bg-slate-950 p-6 text-white">
          <p className="text-sm text-slate-300">{data.plan.name} · {data.plan.status}</p>
          <h1 className="mt-1 text-3xl font-semibold">Family safety automation</h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(data.usage).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white/10 p-3"><p className="text-xs capitalize text-slate-300">{key.replace(/([A-Z])/g, " $1")}</p><p className="mt-1 text-lg font-semibold">{value.current}/{value.limit ?? "∞"}</p></div>
            ))}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPinned className="h-5 w-5" />Custom places and geofences</h2>
            {!entitled("geofences") ? <Locked>Creating geofences requires Pro Family.</Locked> : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Input placeholder="Place name" value={place.name} onChange={(event) => setPlace((current) => ({ ...current, name: event.target.value }))} />
                <Input placeholder="Radius in metres" type="number" value={place.radiusMeters} onChange={(event) => setPlace((current) => ({ ...current, radiusMeters: event.target.value }))} />
                <Input placeholder="Latitude" value={place.latitude} onChange={(event) => setPlace((current) => ({ ...current, latitude: event.target.value }))} />
                <Input placeholder="Longitude" value={place.longitude} onChange={(event) => setPlace((current) => ({ ...current, longitude: event.target.value }))} />
                <Button className="sm:col-span-2" onClick={createPlace}>Add place</Button>
              </div>
            )}
            <div className="mt-4 grid gap-2">{data.places.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span><strong>{item.name}</strong><span className="ml-2 text-xs text-slate-500">{item.radiusMeters}m</span></span>{item.isActive && <Button size="sm" variant="outline" onClick={async () => { await request(`/api/custom-places/${item.id}`, { method: "DELETE" }); await load(); }}>Disable</Button>}</div>)}</div>
          </article>

          <article className="rounded-2xl border bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarClock className="h-5 w-5" />Recurring trips</h2>
            {!entitled("recurring_trips") ? <Locked>Recurring trip automation requires Pro Family.</Locked> : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Input className="sm:col-span-2" placeholder="Template title" value={template.title} onChange={(event) => setTemplate((current) => ({ ...current, title: event.target.value }))} />
                <select className="h-9 rounded-md border bg-white px-3 text-sm" value={template.frequency} onChange={(event) => setTemplate((current) => ({ ...current, frequency: event.target.value }))}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option></select>
                <Input type="datetime-local" value={template.nextRunAt} onChange={(event) => setTemplate((current) => ({ ...current, nextRunAt: event.target.value }))} />
                <Button className="sm:col-span-2" disabled={!template.title || !template.nextRunAt} onClick={createTemplate}>Create recurring trip</Button>
              </div>
            )}
            <div className="mt-4 grid gap-2">{data.templates.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span><strong>{item.title}</strong><span className="ml-2 text-xs text-slate-500">{item.schedule?.frequency || "Scheduled"}</span></span>{item.isActive && <Button size="sm" variant="outline" onClick={async () => { await request(`/api/trip-templates/${item.id}`, { method: "DELETE" }); await load(); }}>Disable</Button>}</div>)}</div>
          </article>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5" />Viewers, safety events, and reports</h2>
          {!entitled("multiple_viewers") ? <div className="mt-3"><Locked>Additional viewers and emergency contacts require Pro Family.</Locked></div> : (
            <div className="mt-4 grid gap-2 md:grid-cols-5">
              <select className="h-9 rounded-md border bg-white px-3 text-sm" value={inviteTripId} onChange={(event) => setInviteTripId(event.target.value)}><option value="">Select trip</option>{data.trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}</select>
              <Input placeholder="Viewer name" value={invite.name} onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="Email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} />
              <Input placeholder="Phone (optional)" value={invite.phoneNumber} onChange={(event) => setInvite((current) => ({ ...current, phoneNumber: event.target.value }))} />
              <Button disabled={!inviteTripId || !invite.name || (!invite.email && !invite.phoneNumber)} onClick={createInvite}>Send invitation</Button>
              <label className="flex items-center gap-2 text-sm md:col-span-5"><input type="checkbox" checked={invite.emergencyContact} onChange={(event) => setInvite((current) => ({ ...current, emergencyContact: event.target.checked }))} />Emergency contact</label>
            </div>
          )}
          <div className="mt-5 grid gap-3">{data.trips.map((trip) => <article key={trip.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{trip.title}</h3><p className="text-xs text-slate-500">{trip.status} · {trip.safetyState} · {new Date(trip.createdAt).toLocaleDateString()}</p></div>{entitled("downloadable_reports") && <Button asChild size="sm" variant="outline"><a href={`/api/trips/${trip.id}/report`}><Download className="mr-2 h-4 w-4" />Download report</a></Button>}</div><p className="mt-3 text-xs font-medium text-slate-500">{trip.viewers.length} active viewers · {trip.viewerInvites.length} invitations</p><div className="mt-2 flex flex-wrap gap-2">{trip.events.map((event) => <span key={event.id} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">{event.eventType.replaceAll("_", " ")} · {new Date(event.timestamp).toLocaleString()}</span>)}</div></article>)}</div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell className="h-5 w-5" />Premium notifications</h2>
            {!entitled("premium_notifications") ? <Locked>SMS and WhatsApp notifications require Pro Family.</Locked> : <div className="mt-4 grid gap-3"><Input placeholder="International phone number, e.g. +2348012345678" value={phone} onChange={(event) => setPhone(event.target.value)} /><div className="flex flex-wrap gap-2"><Button onClick={() => savePreference("WHATSAPP", true)}>Enable WhatsApp</Button><Button variant="outline" onClick={() => savePreference("WHATSAPP", false)}>Disable WhatsApp</Button><Button onClick={() => savePreference("SMS", true)}>Enable SMS</Button><Button variant="outline" onClick={() => savePreference("SMS", false)}>Disable SMS</Button></div></div>}
          </article>
          <article className="rounded-2xl border bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5" />Delivery activity</h2>
            <div className="mt-3 grid gap-2">{data.deliveries.map((delivery) => <div key={delivery.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"><span>{delivery.eventType || "Notification"} · {delivery.channel}</span><span className="font-medium">{delivery.status}</span></div>)}{!data.deliveries.length && <p className="text-sm text-slate-500">No premium deliveries yet.</p>}</div>
          </article>
        </section>
      </div>
    </main>
  );
}
