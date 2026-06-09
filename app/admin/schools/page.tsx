import db from "@/packages/db/client";

const AdminSchoolsPage = async () => {
  const schools = await db.user.findMany({
    include: {
      Subscription: { include: { plan: true }, orderBy: { startDate: "desc" }, take: 1 },
      _count: { select: { Teacher: true, Driver: true, Parent: true, Student: true, Buses: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Schools</h1>
        <p className="text-sm text-slate-500">Registered schools, subscriptions, and linked school-managed records.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Teachers</th>
                <th className="px-4 py-3">Drivers</th>
                <th className="px-4 py-3">Parents</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((school) => (
                <tr key={school.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{school.name || "Unnamed school"}</p>
                    <p className="text-xs text-slate-500">{school.email || "No email"}</p>
                  </td>
                  <td className="px-4 py-3">{school.Subscription[0]?.plan?.name || school.Subscription[0]?.subscriptionPlan || "FREE"}</td>
                  <td className="px-4 py-3">{school._count.Teacher}</td>
                  <td className="px-4 py-3">{school._count.Driver}</td>
                  <td className="px-4 py-3">{school._count.Parent}</td>
                  <td className="px-4 py-3">{school._count.Student}</td>
                  <td className="px-4 py-3">{school.suspendedAt ? "SUSPENDED" : "ACTIVE"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSchoolsPage;
