export const dynamic = "force-dynamic";

import { VerificationQueue } from "@/components/admin/admin-controls";
import db from "@/packages/db/client";
import { Prisma } from "@prisma/client";
import { requirePlatformPermission } from "@/lib/admin/platform";

const AdminVerificationPage = async () => {
  await requirePlatformPermission("verification.manage");
  const drivers = await db.driver.findMany({
    where: { accountType: "STANDALONE", schoolId: null },
    include: {
      shareProfile: { select: { shareId: true } },
      parentConnections: { select: { id: true, status: true } },
      childAssignments: { select: { id: true, status: true } },
    },
    orderBy: [{ verificationStatus: "asc" }, { updatedAt: "desc" }],
  });
  const identityRows = drivers.length
    ? await db.$queryRaw<{ id: string; identityDocumentUrl: string | null }[]>`
        SELECT "id", "identity_document_url" AS "identityDocumentUrl"
        FROM "Driver"
        WHERE "id" IN (${Prisma.join(drivers.map((driver) => driver.id))})
      `
    : [];
  const identityByDriverId = new Map(
    identityRows.map((row) => [row.id, row.identityDocumentUrl])
  );
  const driversWithIdentityDocuments = drivers.map((driver) => ({
    ...driver,
    identityDocumentUrl: identityByDriverId.get(driver.id) || null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Driver verification</h1>
        <p className="text-sm text-slate-500">Review standalone driver identity, address, GPS, vehicle, and utility bill submissions.</p>
      </div>
      <VerificationQueue drivers={JSON.parse(JSON.stringify(driversWithIdentityDocuments))} />
    </div>
  );
};

export default AdminVerificationPage;
