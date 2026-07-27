export const dynamic = "force-dynamic";

import { PaymentPlansManager } from "@/components/admin/admin-controls";
import { ensurePlanCatalog } from "@/lib/billing/accounts";
import db from "@/packages/db/client";
import { requirePlatformPermission } from "@/lib/admin/platform";

const AdminPaymentPlansPage = async () => {
  await requirePlatformPermission("billing.read");
  await ensurePlanCatalog();
  const plans = await db.plan.findMany({
    include: {
      _count: { select: { subscriptions: true } },
      prices: {
        orderBy: { createdAt: "desc" },
        include: { providerPlans: { orderBy: { environment: "asc" } } },
      },
    },
    orderBy: [{ audience: "asc" }, { tier: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Payment plans</h1>
        <p className="text-sm text-slate-500">Create, view, and disable platform subscription plans.</p>
      </div>
      <PaymentPlansManager plans={JSON.parse(JSON.stringify(plans))} />
    </div>
  );
};

export default AdminPaymentPlansPage;
