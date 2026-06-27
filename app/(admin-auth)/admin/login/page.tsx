import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getOptionalSession } from "@/lib/optional-session";

const AdminLoginPage = async () => {
  const user = await getOptionalSession();
  if (user?.role === "superadmin") {
    redirect("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1020] px-4">
      <AdminLoginForm />
    </main>
  );
};

export default AdminLoginPage;
