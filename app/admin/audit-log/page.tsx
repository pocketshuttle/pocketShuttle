import db from "@/packages/db/client";

const AdminAuditLogPage = async () => {
  const actions = await db.superUserAction.findMany({
    include: { superUser: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-slate-500">Recent super-admin approvals, rejections, suspensions, and plan changes.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actions.map((action) => (
                <tr key={action.id}>
                  <td className="px-4 py-3 font-semibold">{action.action.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{action.targetId || "platform"}</td>
                  <td className="px-4 py-3">{action.superUser.name || action.superUser.email}</td>
                  <td className="px-4 py-3">{action.createdAt.toLocaleString()}</td>
                </tr>
              ))}
              {!actions.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No audit actions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogPage;
