export const dynamic = "force-dynamic";

import { AdminManager } from "@/components/admin/admin-manager";
import {
  isPlatformAdminRole,
} from "@/lib/admin/permissions";
import { requirePlatformPermission } from "@/lib/admin/platform";
import db from "@/packages/db/client";

const PlatformAdminsPage = async () => {
  const session = await requirePlatformPermission("admins.read");
  const [admins, invites] = await Promise.all([
    db.superUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        accessRole: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    db.platformAdminInvite.findMany({
      where: { status: { in: ["PENDING", "EXPIRED"] } },
      select: {
        id: true,
        name: true,
        email: true,
        accessRole: true,
        status: true,
        deliveryStatus: true,
        deliveryError: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const role = session.platformAccessRole;
  if (!role || !isPlatformAdminRole(role)) return null;

  return (
    <AdminManager
      initialAdmins={JSON.parse(JSON.stringify(admins))}
      initialInvites={JSON.parse(JSON.stringify(invites))}
      currentAdminId={session.id}
      currentRole={role}
    />
  );
};

export default PlatformAdminsPage;
