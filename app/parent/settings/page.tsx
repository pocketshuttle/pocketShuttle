import { redirect } from "next/navigation";

import { ParentSettingsView } from "@/components/parent-view/standalone/parent-settings-view";
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

  return <ParentSettingsView />;
};

export default ParentSettingsPage;
