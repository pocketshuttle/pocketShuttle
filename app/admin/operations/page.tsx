export const dynamic = "force-dynamic";

import { OperationsControl } from "@/components/admin/operations-control";
import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

const AdminOperationsPage = async () => {
  await requirePlatformPermission("operations.read");
  const trips = await db.trip.findMany({
    include: {
      locations: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { participants: true, viewers: true, events: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Platform operations</h1>
        <p className="text-sm text-slate-500">
          Active trips, fleet locations, participants, and audited operational corrections.
        </p>
      </div>
      <OperationsControl initialTrips={JSON.parse(JSON.stringify(trips))} />
    </div>
  );
};

export default AdminOperationsPage;
