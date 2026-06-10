export const dynamic = "force-dynamic";

import db from "@/packages/db/client";

const AdminParentsPage = async () => {
  const parents = await db.parent.findMany({
    include: {
      school: { select: { name: true, email: true } },
      _count: { select: { Student: true, ParentChild: true, DriverRequest: true } },
    },
    orderBy: [{ accountType: "asc" }, { full_name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Parents</h1>
        <p className="text-sm text-slate-500">Standalone and school-managed parent accounts.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Kids</th>
                <th className="px-4 py-3">Requests</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parents.map((parent) => (
                <tr key={parent.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{parent.full_name || "Unnamed parent"}</p>
                    <p className="text-xs text-slate-500">{parent.email || "No email"} · {parent.phoneNumber || "No phone"}</p>
                  </td>
                  <td className="px-4 py-3">{parent.accountType}</td>
                  <td className="px-4 py-3">{parent.school?.name || "Standalone"}</td>
                  <td className="px-4 py-3">{parent._count.Student + parent._count.ParentChild}</td>
                  <td className="px-4 py-3">{parent._count.DriverRequest}</td>
                  <td className="px-4 py-3">{parent.suspendedAt ? "SUSPENDED" : "ACTIVE"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminParentsPage;
