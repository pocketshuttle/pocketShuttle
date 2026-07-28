export const dynamic = "force-dynamic";

import db from "@/packages/db/client";
import { requirePlatformPermission } from "@/lib/admin/platform";

const AdminKnownDriversPage = async () => {
  await requirePlatformPermission("operations.read");
  const [connections, assignments, invites, payments, events] = await Promise.all([
    db.parentDriverConnection.findMany({
      include: {
        parent: { select: { full_name: true, email: true, phoneNumber: true } },
        driver: { select: { full_name: true, email: true, phoneNumber: true, shareProfile: { select: { shareId: true } } } },
        _count: { select: { assignments: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    db.childDriverAssignment.findMany({
      include: {
        parent: { select: { full_name: true } },
        driver: { select: { full_name: true, shareProfile: { select: { shareId: true } } } },
        child: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    db.driverInvite.findMany({
      include: {
        parent: { select: { full_name: true, email: true } },
        driver: { select: { full_name: true, shareProfile: { select: { shareId: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.knownDriverPayment.findMany({
      include: {
        parent: { select: { full_name: true, email: true } },
        assignment: { include: { child: { select: { fullName: true } }, driver: { select: { full_name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.childDriverEvent.findMany({
      include: {
        parent: { select: { full_name: true } },
        driver: { select: { full_name: true } },
        child: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Known driver network</h1>
        <p className="text-sm text-slate-500">Connections, assignments, invites, payments, and pickup/dropoff events.</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Recent connections</h2>
          <div className="grid gap-2">
            {connections.map((connection) => (
              <div key={connection.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">{connection.parent.full_name || "Parent"} ↔ {connection.driver.full_name}</p>
                <p className="text-xs text-slate-500">{connection.status} · {connection.driver.shareProfile?.shareId || "No share ID"} · {connection._count.assignments} kids</p>
                {connection.status === "REVOKED" && connection.note && (
                  <p className="mt-1 text-xs text-rose-700">Reason: {connection.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Child assignments</h2>
          <div className="grid gap-2">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">{assignment.child.fullName} · {assignment.driver.full_name}</p>
                <p className="text-xs text-slate-500">{assignment.status} · {assignment.billingStatus} · trial ends {assignment.trialEndsAt.toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Invites</h2>
          <div className="grid gap-2">
            {invites.map((invite) => (
              <div key={invite.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">{invite.email || invite.phoneNumber || "Invite"}</p>
                <p className="text-xs text-slate-500">{invite.status} · parent {invite.parent.full_name || invite.parent.email || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Payments</h2>
          <div className="grid gap-2">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">NGN {payment.amount.toLocaleString()} · {payment.status}</p>
                <p className="text-xs text-slate-500">{payment.assignment.child.fullName} · {payment.assignment.driver.full_name} · {payment.providerRef || "No ref"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Recent child events</h2>
        <div className="grid gap-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium">{event.eventType.replaceAll("_", " ")} · {event.child.fullName}</p>
              <p className="text-xs text-slate-500">{event.driver.full_name} · {event.parent.full_name || "Parent"} · {event.createdAt.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminKnownDriversPage;
