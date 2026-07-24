import { NextResponse } from "next/server";

import {
  EntitlementError,
  entitlementErrorBody,
} from "@/lib/billing/entitlements";

export function upgradeRequiredResponse(error: unknown) {
  if (!(error instanceof EntitlementError)) return null;
  return NextResponse.json(entitlementErrorBody(error), { status: 403 });
}
