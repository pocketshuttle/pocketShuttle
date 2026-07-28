import { Suspense } from "react";

import { ViewerInviteAccept } from "@/components/parent-view/viewer-invite-accept";

export default function ViewerInvitePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Suspense fallback={<div className="rounded-xl bg-white p-6">Loading invitation…</div>}>
        <ViewerInviteAccept />
      </Suspense>
    </main>
  );
}
