export const dynamic = "force-dynamic";

import db from "@/packages/db/client";

function ReportBlock({ title, rows }: { title: string; rows: Array<{ label: string; value: string | number }> }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="grid gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-600">{row.label}</span>
            <span className="font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const AdminReportsPage = async () => {
  const [parentsByAccountType, driversByVerification, requestsByStatus, paymentsByStatus, plans] = await Promise.all([
    db.parent.groupBy({ by: ["accountType"], _count: { _all: true } }),
    db.driver.groupBy({ by: ["verificationStatus"], _count: { _all: true } }),
    db.driverRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    db.payment.groupBy({ by: ["status"], _sum: { amount: true }, _count: { _all: true } }),
    db.plan.findMany({ include: { _count: { select: { subscriptions: true } } }, orderBy: { price: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-500">Summary reports for marketplace activity, verification, requests, and payments.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ReportBlock
          title="Parents by account type"
          rows={parentsByAccountType.map((row) => ({ label: row.accountType, value: row._count._all }))}
        />
        <ReportBlock
          title="Drivers by verification"
          rows={driversByVerification.map((row) => ({ label: row.verificationStatus, value: row._count._all }))}
        />
        <ReportBlock
          title="Driver requests"
          rows={requestsByStatus.map((row) => ({ label: row.status, value: row._count._all }))}
        />
        <ReportBlock
          title="Payments"
          rows={paymentsByStatus.map((row) => ({
            label: row.status,
            value: `${row._count._all} payments · NGN ${Number(row._sum.amount || 0).toLocaleString()}`,
          }))}
        />
        <ReportBlock
          title="Payment plans"
          rows={plans.map((plan) => ({
            label: `${plan.name}${plan.isActive ? "" : " (disabled)"}`,
            value: `${plan._count.subscriptions} subscriptions`,
          }))}
        />
      </div>
    </div>
  );
};

export default AdminReportsPage;
