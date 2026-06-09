import { AdminUsersTable } from "@/components/admin/admin-controls";
import { getUnifiedUsers } from "@/lib/admin/platform";

const AdminUsersPage = async () => {
  const users = await getUnifiedUsers();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">All users</h1>
        <p className="text-sm text-slate-500">Unified registered details for schools, parents, drivers, teachers, and super admins.</p>
      </div>
      <AdminUsersTable users={JSON.parse(JSON.stringify(users))} />
    </div>
  );
};

export default AdminUsersPage;
