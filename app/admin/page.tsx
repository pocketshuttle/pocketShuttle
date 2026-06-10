export const dynamic = "force-dynamic";

import Link from "next/link";

import { getPlatformOverview } from "@/lib/admin/platform";
import db from "@/packages/db/client";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value.toLocaleString()}</p>
    </div>
  );
}

const AdminOverviewPage = async () => {
  const [overview, recentActions, pendingDrivers] = await Promise.all([
    getPlatformOverview(),
    db.superUserAction.findMany({
      include: { superUser: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.driver.findMany({
      where: { accountType: "STANDALONE", schoolId: null, verificationStatus: "PENDING_REVIEW" },
      select: { id: true, full_name: true, email: true, phoneNumber: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-slate-500">Platform-wide schools, users, marketplace, subscriptions, and moderation.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools" value={overview.schools} />
        <StatCard label="Parents" value={overview.parents} />
        <StatCard label="Drivers" value={overview.drivers} />
        <StatCard label="Teachers" value={overview.teachers} />
        <StatCard label="Students" value={overview.students} />
        <StatCard label="Pending verifications" value={overview.pendingVerifications} />
        <StatCard label="Active driver requests" value={overview.activeRequests} />
        <StatCard label="Suspended accounts" value={overview.suspendedAccounts} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Verification queue</h2>
            <Link href="/admin/verification" className="text-sm font-medium text-blue-600">Open</Link>
          </div>
          <div className="grid gap-2">
            {pendingDrivers.map((driver) => (
              <div key={driver.id} className="rounded-md bg-slate-50 p-3">
                <p className="font-medium">{driver.full_name}</p>
                <p className="text-xs text-slate-500">{driver.email || "No email"} · {driver.phoneNumber || "No phone"}</p>
              </div>
            ))}
            {!pendingDrivers.length && <p className="text-sm text-slate-500">No pending driver verifications.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent audit actions</h2>
            <Link href="/admin/audit-log" className="text-sm font-medium text-blue-600">Open</Link>
          </div>
          <div className="grid gap-2">
            {recentActions.map((action) => (
              <div key={action.id} className="rounded-md bg-slate-50 p-3">
                <p className="font-medium">{action.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{action.superUser.name || action.superUser.email} · {action.targetId || "platform"}</p>
              </div>
            ))}
            {!recentActions.length && <p className="text-sm text-slate-500">No audit actions yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminOverviewPage;
