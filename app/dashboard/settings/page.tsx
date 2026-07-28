
import { SettingsPage } from "@/components/dashboard/settings/settings-page";
import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";
import { getEntitlements, historyCutoff } from "@/lib/billing/entitlements";

export const dynamic = "force-dynamic";

const page = async () => {
  const session = await getUserSession();
  const schoolId = String(session?.schoolId ?? session?.id ?? "");
  const resolved = await getEntitlements({
    id: String(session.id),
    role: String(session.role),
    schoolId,
  });
  const auditCutoff = historyCutoff(resolved);

  const [school, settings, subscription, auditLogs] = await Promise.all([
    db.user.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    }),
    db.schoolSettings.findUnique({
      where: { schoolId },
      select: {
        pickupWindow: true,
        notifyDistance: true,
      },
    }),
    db.subscription.findFirst({
      where: { userId: schoolId },
      orderBy: { startDate: "desc" },
      select: {
        status: true,
        subscriptionPlan: true,
        endDate: true,
        plan: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.auditLog.findMany({
      where: {
        userId: schoolId,
        action: "MODIFY_SETTINGS",
        ...(auditCutoff ? { timestamp: { gte: auditCutoff } } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: 5,
      select: {
        id: true,
        action: true,
        details: true,
        timestamp: true,
      },
    }),
  ]);

  return (
    <SettingsPage
      school={{
        id: school?.id ?? schoolId,
        name: school?.name ?? null,
        email: school?.email ?? null,
        image: school?.image ?? null,
      }}
      settings={{
        pickupWindow: settings?.pickupWindow ?? 15,
        notifyDistance: settings?.notifyDistance ?? 500,
      }}
      subscription={{
        plan: resolved.planName,
        status: resolved.status,
        endDate: resolved.currentPeriodEnd
          ? resolved.currentPeriodEnd.toLocaleDateString()
          : null,
      }}
      auditLogs={auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp.toLocaleString(),
        details:
          log.details && typeof log.details === "object" && !Array.isArray(log.details)
            ? {
                pickupWindow:
                  typeof log.details.pickupWindow === "number"
                    ? log.details.pickupWindow
                    : undefined,
                notifyDistance:
                  typeof log.details.notifyDistance === "number"
                    ? log.details.notifyDistance
                    : undefined,
              }
            : null,
      }))}
    />
  );
};

export default page;
