export const dynamic = "force-dynamic";

import Link from "next/link";

import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

const AdminSafetyPage = async () => {
  await requirePlatformPermission("safety.read");
  const [trips, events] = await Promise.all([
    db.trip.findMany({
      where: { OR: [{ safetyState: { not: "normal" } }, { status: "emergency" }] },
      include: { locations: { orderBy: { timestamp: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    }),
    db.tripEvent.findMany({
      where: {
        eventType: {
          in: ["emergency_triggered", "emergency_resolved", "route_deviation", "unusual_stop"],
        },
      },
      include: { trip: { select: { id: true, title: true, status: true, safetyState: true } } },
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
  ]);
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Safety control</h1>
          <p className="text-sm text-slate-500">
            Review emergencies, route deviations, unusual stops, and resolutions.
          </p>
        </div>
        <Link href="/admin/operations" className="rounded-md border bg-white px-3 py-2 text-sm">
          Open trip controls
        </Link>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Trips needing attention</p>
          <p className="mt-2 text-3xl font-semibold">{trips.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Recent safety events</p>
          <p className="mt-2 text-3xl font-semibold">{events.length}</p>
        </div>
      </section>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Safety timeline</h2>
        <div className="grid gap-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium">
                {event.eventType.replaceAll("_", " ")} · {event.trip.title}
              </p>
              <p className="text-xs text-slate-500">
                {event.timestamp.toLocaleString()} · {event.trip.status} · {event.trip.safetyState}
              </p>
            </div>
          ))}
          {!events.length ? <p className="text-sm text-slate-500">No safety events.</p> : null}
        </div>
      </section>
    </div>
  );
};

export default AdminSafetyPage;
