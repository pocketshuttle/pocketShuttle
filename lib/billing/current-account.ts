import "server-only";

import { getApiSession } from "@/lib/api-auth";
import { ensureBillingAccountForIdentity } from "@/lib/billing/accounts";

export async function requireBillingIdentity() {
  const session = await getApiSession();
  if (!session || !["parent", "admin", "school"].includes(session.role)) {
    throw new Error("UNAUTHORIZED");
  }

  const account = await ensureBillingAccountForIdentity(session);
  return { session, account };
}

export function billingErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Billing request failed";
  if (message === "UNAUTHORIZED") {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ message }, { status: 400 });
}
