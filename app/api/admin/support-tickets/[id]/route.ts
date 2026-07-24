import { NextResponse } from "next/server";

import { logSuperUserAction, requirePlatformAdmin } from "@/lib/admin/platform";
import db from "@/packages/db/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePlatformAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body?.status === "FIXED" ? "FIXED" : body?.status === "PENDING" ? "PENDING" : null;

    if (!status) {
      return NextResponse.json({ message: "Invalid ticket status." }, { status: 400 });
    }

    const existingRows = await db.$queryRaw<Array<{ id: string; driverId: string | null; parentId: string | null }>>`
      SELECT "id", "driver_id" AS "driverId", "parent_id" AS "parentId"
      FROM "support_tickets"
      WHERE "id" = ${id}
      LIMIT 1
    `;
    const ticket = existingRows[0];

    if (!ticket) {
      return NextResponse.json({ message: "Support ticket not found." }, { status: 404 });
    }

    if (status === "FIXED") {
      await db.$executeRaw`
        UPDATE "support_tickets"
        SET "status" = 'FIXED'::"SupportTicketStatus",
            "fixed_at" = NOW(),
            "first_responded_at" = COALESCE("first_responded_at", NOW()),
            "deleted_at" = NOW(),
            "updated_at" = NOW()
        WHERE "id" = ${id}
      `;

      await logSuperUserAction({
        superUserId: admin.id,
        action: "SUPPORT_TICKET_FIXED_ARCHIVED",
        targetId: `support:${ticket.id}`,
        metadata: { status, driverId: ticket.driverId, parentId: ticket.parentId },
      });

      return NextResponse.json({ message: "Ticket fixed and moved to 21-day history.", deleted: true });
    }

    await db.$executeRaw`
      UPDATE "support_tickets"
      SET "status" = ${status}::"SupportTicketStatus",
          "fixed_at" = NULL,
          "deleted_at" = NULL,
          "first_responded_at" = COALESCE("first_responded_at", NOW()),
          "updated_at" = NOW()
      WHERE "id" = ${id}
    `;

    await logSuperUserAction({
      superUserId: admin.id,
      action: "SUPPORT_TICKET_UPDATED",
      targetId: `support:${ticket.id}`,
      metadata: { status, driverId: ticket.driverId, parentId: ticket.parentId },
    });

    return NextResponse.json({ message: "Support ticket updated.", ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { message: message === "UNAUTHORIZED" ? "Unauthorized" : "Unable to update support ticket." },
      { status: message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
