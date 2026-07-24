import { OrganizationManager } from "@/components/admin/organization-manager";
import db from "@/packages/db/client";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const organizations = await db.organization.findMany({
    include: {
      branches: true,
      billingAccount: {
        include: {
          subscriptions: {
            include: { plan: true },
            orderBy: { startDate: "desc" },
            take: 1,
          },
        },
      },
      _count: { select: { members: true, apiKeys: true, webhooks: true } },
    },
    orderBy: { name: "asc" },
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Enterprise organizations</h1>
        <p className="text-sm text-slate-500">
          Sales-assisted organizations, branches, API access, webhooks, and branding.
        </p>
      </div>
      <OrganizationManager organizations={JSON.parse(JSON.stringify(organizations))} />
    </div>
  );
}
