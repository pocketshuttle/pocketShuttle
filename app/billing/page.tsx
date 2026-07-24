import { redirect } from "next/navigation";

import { SubscriptionPanel } from "@/components/billing/subscription-panel";
import { getUserSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getUserSession();
  if (session?.role !== "parent") {
    redirect("/dashboard/billing");
  }
  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 md:p-8">
      <SubscriptionPanel audience="family" />
    </main>
  );
}
