import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getUserSession } from "@/lib/session";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserSession();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "superadmin") {
    redirect("/");
  }

  return <AdminShell name={typeof user.name === "string" ? user.name : null}>{children}</AdminShell>;
};

export default AdminLayout;
