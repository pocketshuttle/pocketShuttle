import { redirect } from "next/navigation";

import { ParentSettingsView } from "@/components/parent-view/standalone/parent-settings-view";
import { getFamilyEntitlements } from "@/lib/billing/entitlements";
import { connectionConsumesDriverSlot } from "@/lib/billing/policy";
import { getUserSession } from "@/lib/session";
import db from "@/packages/db/client";

const ParentSettingsPage = async () => {
  const user = await getUserSession();

  if (user?.role !== "parent" || typeof user.id !== "string") {
    redirect("/login");
  }

  const parent = await db.parent.findFirst({
    where: { id: user.id, accountType: "STANDALONE", schoolId: null },
    select: { id: true },
  });

  if (!parent) {
    redirect("/parent");
  }

  const [childCount, connections, entitlements] = await Promise.all([
    db.parentChild.count({ where: { parentId: parent.id } }),
    db.parentDriverConnection.findMany({
      where: { parentId: parent.id },
      select: {
        status: true,
        assignments: {
          where: { status: "ACTIVE" },
          select: { billingStatus: true, trialEndsAt: true },
        },
      },
    }),
    getFamilyEntitlements(parent.id),
  ]);

  const driverCount = connections.filter((connection) => connectionConsumesDriverSlot(connection.status)).length;
  const activeAssignments = connections.flatMap((connection) => connection.assignments);
  const nextTrialEnd = activeAssignments
    .map((assignment) => assignment.trialEndsAt)
    .filter(Boolean)
    .map((value) => new Date(value as Date))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <ParentSettingsView
      subscription={{
        planCode: entitlements.planCode,
        planName: entitlements.planName,
        enforcementEnabled: entitlements.enforcementEnabled,
        maxChildren:
          typeof entitlements.entitlements.max_children === "number" ? entitlements.entitlements.max_children : null,
        maxConnectedDrivers:
          typeof entitlements.entitlements.max_connected_drivers === "number"
            ? entitlements.entitlements.max_connected_drivers
            : null,
      }}
      childCount={childCount}
      driverCount={driverCount}
      billingSummary={{
        freeTrial: activeAssignments.filter((assignment) => assignment.billingStatus === "FREE_TRIAL").length,
        active: activeAssignments.filter((assignment) => assignment.billingStatus === "ACTIVE").length,
        pastDue: activeAssignments.filter((assignment) => assignment.billingStatus === "PAST_DUE").length,
        nextTrialEnd: nextTrialEnd ?? null,
      }}
    />
  );
};

export default ParentSettingsPage;
