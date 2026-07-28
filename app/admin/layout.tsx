import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  isPlatformAdminRole,
  isPlatformAdminV2Enabled,
} from "@/lib/admin/permissions";
import { getUserSession } from "@/lib/session";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserSession();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "superadmin") {
    redirect("/");
  }
  const accessRole = user.platformAccessRole;
  if (!isPlatformAdminRole(accessRole)) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      name={typeof user.name === "string" ? user.name : null}
      accessRole={isPlatformAdminV2Enabled() ? accessRole : "OWNER"}
    >
      {children}
    </AdminShell>
  );
};

export default AdminLayout;
