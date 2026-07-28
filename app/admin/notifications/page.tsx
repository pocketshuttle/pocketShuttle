export const dynamic = "force-dynamic";

import { NotificationMonitor } from "@/components/admin/notification-monitor";
import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

const AdminNotificationsPage = async () => {
  await requirePlatformPermission("operations.read");
  const [events, dispatches] = await Promise.all([
    db.tripEvent.findMany({
      where: {
        eventType: {
          in: [
            "trip_started",
            "participant_boarded",
            "participant_dropped",
            "stop_reached",
            "route_deviation",
            "unusual_stop",
            "emergency_triggered",
            "emergency_resolved",
            "trip_ended",
          ],
        },
      },
      include: { trip: { select: { id: true, title: true } } },
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
    db.tripEvent.findMany({
      where: {
        eventType: "eta_updated",
        actorType: "system",
      },
      select: { id: true, tripId: true, timestamp: true, payload: true },
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
  ]);
  const failedAttempts = dispatches.reduce((count, row) => {
    const payload = row.payload as { attempts?: Array<{ status?: string }> } | null;
    return count + (payload?.attempts || []).filter((attempt) => attempt.status === "failed").length;
  }, 0);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Notification monitoring</h1>
        <p className="text-sm text-slate-500">
          Delivery attempts are metered through the same customer entitlement path.
        </p>
      </div>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Recent source events</p>
          <p className="mt-2 text-3xl font-semibold">{events.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Delivery logs</p>
          <p className="mt-2 text-3xl font-semibold">{dispatches.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Failed attempts</p>
          <p className="mt-2 text-3xl font-semibold">{failedAttempts}</p>
        </div>
      </section>
      <NotificationMonitor events={JSON.parse(JSON.stringify(events))} />
    </div>
  );
};

export default AdminNotificationsPage;
