import { notFound } from "next/navigation";

import { AccountControlPanel } from "@/components/admin/account-control-panel";
import { requirePlatformPermission } from "@/lib/admin/platform";

const types = new Set(["school", "parent", "driver", "teacher"]);

const AdminAccountDetailPage = async ({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) => {
  await requirePlatformPermission("accounts.read");
  const { type, id } = await params;
  if (!types.has(type)) notFound();
  return (
    <AccountControlPanel
      type={type as "school" | "parent" | "driver" | "teacher"}
      id={id}
    />
  );
};

export default AdminAccountDetailPage;
