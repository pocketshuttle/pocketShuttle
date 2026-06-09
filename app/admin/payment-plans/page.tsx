import { PaymentPlansManager } from "@/components/admin/admin-controls";
import db from "@/packages/db/client";

const AdminPaymentPlansPage = async () => {
  const plans = await db.plan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { price: "asc" },
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
