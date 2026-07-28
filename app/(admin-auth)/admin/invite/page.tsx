import { Suspense } from "react";

import { AdminInviteAcceptForm } from "@/components/admin/admin-invite-accept-form";

const AdminInvitePage = () => (
  <main className="grid min-h-screen place-items-center bg-[#0b1020] px-4">
    <Suspense fallback={<div className="text-white">Loading invitation…</div>}>
      <AdminInviteAcceptForm />
    </Suspense>
  </main>
);

export default AdminInvitePage;
