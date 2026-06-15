export const dynamic = "force-dynamic";

import db from "@/packages/db/client";

const AdminDriversPage = async () => {
  const drivers = await db.driver.findMany({
    include: {
      school: { select: { name: true, email: true } },
      shareProfile: { select: { shareId: true } },
      parentConnections: { select: { id: true, status: true, parentId: true } },
      childAssignments: { select: { id: true, status: true, parentId: true, billingStatus: true } },
      _count: { select: { DriverRequest: true, ParentChild: true } },
    },
    orderBy: [{ accountType: "asc" }, { verificationStatus: "asc" }, { full_name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Drivers</h1>
        <p className="text-sm text-slate-500">Standalone and school-managed drivers, verification, vehicle, and marketplace activity.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Service areas</th>
                <th className="px-4 py-3">Share ID</th>
                <th className="px-4 py-3">Known network</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{driver.full_name || "Unnamed driver"}</p>
                    <p className="text-xs text-slate-500">{driver.email || "No email"} · {driver.phoneNumber || "No phone"}</p>
                  </td>
                  <td className="px-4 py-3">{driver.accountType}</td>
                  <td className="px-4 py-3">{driver.verificationStatus}</td>
                  <td className="px-4 py-3">{[driver.carColor, driver.carMake, driver.carModel, driver.plateNumber].filter(Boolean).join(" ") || "N/A"}</td>
                  <td className="px-4 py-3">{driver.serviceAreas.length ? driver.serviceAreas.join(", ") : "N/A"}</td>
                  <td className="px-4 py-3">{driver.shareProfile?.shareId || "N/A"}</td>
                  <td className="px-4 py-3">{driver.parentConnections.length} families · {driver.childAssignments.length} kids</td>
                  <td className="px-4 py-3">{driver.suspendedAt ? "SUSPENDED" : "ACTIVE"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDriversPage;
