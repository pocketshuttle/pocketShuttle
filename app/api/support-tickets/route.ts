import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getApiSession } from "@/lib/api-auth";
import { getSupportTicketPriority } from "@/lib/support-tickets";
import db from "@/packages/db/client";
import { getEntitlements, hasFeature } from "@/lib/billing/entitlements";

type SupportTicketApiRow = {
  id: string;
  requesterRole: string;
  driverId: string | null;
  parentId: string | null;
  requesterName: string;
  requesterIdentifier: string;
  message: string;
  status: "PENDING" | "FIXED";
  priority: "HIGH" | "NORMAL";
  responseDueAt: Date | null;
  firstRespondedAt: Date | null;
  fixedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: Request) {
  try {
    const session = await getApiSession();
    const allowedRoles = new Set(["driver", "parent", "teacher", "admin", "school"]);
    if (!session || !allowedRoles.has(session.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const showHistory = new URL(request.url).searchParams.get("view") === "history";
    await db.$executeRaw`
      DELETE FROM "support_tickets"
      WHERE "deleted_at" IS NOT NULL
        AND "deleted_at" < NOW() - INTERVAL '21 days'
    `;

    const tickets = showHistory
      ? await db.$queryRaw<SupportTicketApiRow[]>`
          SELECT
            "id",
            "requester_role" AS "requesterRole",
            "driver_id" AS "driverId",
            "parent_id" AS "parentId",
            "requester_name" AS "requesterName",
            "requester_identifier" AS "requesterIdentifier",
            "message",
            "status",
            "priority",
            "response_due_at" AS "responseDueAt",
            "first_responded_at" AS "firstRespondedAt",
            "fixed_at" AS "fixedAt",
            "deleted_at" AS "deletedAt",
            "created_at" AS "createdAt",
            "updated_at" AS "updatedAt"
          FROM "support_tickets"
          WHERE "requester_identifier" = ${session.id}
            AND "requester_role" = ${session.role}
            AND "deleted_at" IS NOT NULL
            AND "deleted_at" >= NOW() - INTERVAL '21 days'
          ORDER BY "deleted_at" DESC
          LIMIT 10
        `
      : await db.$queryRaw<SupportTicketApiRow[]>`
          SELECT
            "id",
            "requester_role" AS "requesterRole",
            "driver_id" AS "driverId",
            "parent_id" AS "parentId",
            "requester_name" AS "requesterName",
            "requester_identifier" AS "requesterIdentifier",
            "message",
            "status",
            "priority",
            "response_due_at" AS "responseDueAt",
            "first_responded_at" AS "firstRespondedAt",
            "fixed_at" AS "fixedAt",
            "deleted_at" AS "deletedAt",
            "created_at" AS "createdAt",
            "updated_at" AS "updatedAt"
          FROM "support_tickets"
          WHERE "requester_identifier" = ${session.id}
            AND "requester_role" = ${session.role}
            AND "deleted_at" IS NULL
          ORDER BY
            CASE WHEN "priority" = 'HIGH' AND "status" = 'PENDING' THEN 0 WHEN "priority" = 'HIGH' THEN 1 ELSE 2 END ASC,
            CASE WHEN "status" = 'PENDING' THEN 0 ELSE 1 END ASC,
            "created_at" DESC
          LIMIT 10
        `;

    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ message: "Unable to load support tickets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getApiSession();
    const allowedRoles = new Set(["driver", "parent", "teacher", "admin", "school"]);
    if (!session || !allowedRoles.has(session.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (message.length < 5) {
      return NextResponse.json({ message: "Please describe the issue before sending." }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ message: "Please keep the complaint under 2,000 characters." }, { status: 400 });
    }

    const isDriverSession = session.role === "driver";
    const isParentSession = session.role === "parent";
    const isTeacherSession = session.role === "teacher";
    const account = isDriverSession
      ? await db.driver.findUnique({
          where: { id: session.id },
          select: { id: true, full_name: true },
        })
      : isParentSession
      ? await db.parent.findUnique({
          where: { id: session.id },
          select: { id: true, full_name: true },
        })
      : isTeacherSession
      ? await db.teacher.findUnique({
          where: { id: session.id },
          select: { id: true, full_name: true },
        })
      : await db.user.findUnique({
          where: { id: session.id },
          select: { id: true, name: true },
        });

    if (!account) {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    const priorityCandidate = getSupportTicketPriority(message);
    const priority =
      isParentSession &&
      hasFeature(await getEntitlements(session), "priority_support")
        ? priorityCandidate
        : "NORMAL";
    const responseDueAt = new Date(
      Date.now() + (priority === "HIGH" ? 4 : 24) * 60 * 60 * 1000
    );

    const ticketRows = await db.$queryRaw<SupportTicketApiRow[]>`
      INSERT INTO "support_tickets" (
        "id",
        "requester_role",
        "driver_id",
        "parent_id",
        "requester_name",
        "requester_identifier",
        "message",
        "priority",
        "response_due_at"
      )
      VALUES (
        ${randomUUID()},
        ${session.role},
        ${isDriverSession ? account.id : null},
        ${isParentSession ? account.id : null},
        ${"full_name" in account ? account.full_name || session.name || session.role : account.name || session.name || "School"},
        ${account.id},
        ${message},
        ${priority}::"SupportTicketPriority",
        ${responseDueAt}
      )
      RETURNING
        "id",
        "requester_role" AS "requesterRole",
        "driver_id" AS "driverId",
        "parent_id" AS "parentId",
        "requester_name" AS "requesterName",
        "requester_identifier" AS "requesterIdentifier",
        "message",
        "status",
        "priority",
        "response_due_at" AS "responseDueAt",
        "first_responded_at" AS "firstRespondedAt",
        "fixed_at" AS "fixedAt",
        "deleted_at" AS "deletedAt",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt"
    `;
    const ticket = ticketRows[0];

    return NextResponse.json({ message: "Support request sent.", ticket }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to send support request." }, { status: 500 });
  }
}
