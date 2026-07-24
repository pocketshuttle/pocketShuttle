export const dynamic = "force-dynamic";

import { BillingAccountManager } from "@/components/admin/billing-account-manager";
import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

const AdminBillingPage = async () => {
  await requirePlatformPermission("billing.read");
  const [accounts, plans] = await Promise.all([
    db.billingAccount.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        parent: { select: { id: true, full_name: true, email: true } },
        organization: { select: { id: true, name: true, slug: true } },
        subscriptions: {
          include: { plan: true, planPrice: true },
          orderBy: { startDate: "desc" },
        },
        paymentAttempts: { orderBy: { createdAt: "desc" }, take: 10 },
        premiumMessageUsage: { orderBy: { periodKey: "desc" }, take: 10 },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.plan.findMany({ where: { isActive: true }, select: { code: true } }),
  ]);
  const rows = await Promise.all(
    accounts.map(async (account) => {
      let usage: Record<string, number> = {};
      if (account.type === "FAMILY" && account.parentId) {
        const [children, drivers, viewers] = await Promise.all([
          db.parentChild.count({ where: { parentId: account.parentId } }),
          db.parentDriverConnection.count({
            where: { parentId: account.parentId, status: { not: "REVOKED" } },
          }),
          db.tripViewer.count({
            where: { viewerType: "parent", viewerId: account.parentId },
          }),
        ]);
        usage = { children, drivers, viewers };
      } else if (account.type === "SCHOOL" && account.userId) {
        const [buses, students, teachers, drivers] = await Promise.all([
          db.buses.count({ where: { schoolId: account.userId } }),
          db.student.count({ where: { schoolId: account.userId } }),
          db.teacher.count({ where: { schoolId: account.userId } }),
          db.driver.count({ where: { schoolId: account.userId } }),
        ]);
        usage = { buses, students, staff: teachers + drivers };
      } else if (account.type === "ORGANIZATION" && account.organizationId) {
        usage = {
          branches: await db.organizationBranch.count({
            where: { organizationId: account.organizationId },
          }),
        };
      }
      return { ...account, usage };
    })
  );
  return (
    <BillingAccountManager
      initialAccounts={JSON.parse(JSON.stringify(rows))}
      planCodes={plans.map((plan) => plan.code)}
    />
  );
};

export default AdminBillingPage;
