import "server-only";

import db from "@/packages/db/client";

export async function markDriverActive(driverId: string, at = new Date()) {
  await db.$executeRaw`
    UPDATE "Driver"
    SET "last_active_at" = ${at}
    WHERE "id" = ${driverId}
  `;
}
