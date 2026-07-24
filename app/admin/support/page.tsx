export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle, MapPin, MessageSquareWarning, Phone, Users } from "lucide-react";

import { SupportTicketControls } from "@/components/admin/support/support-ticket-controls";
import { SupportTicketLiveUpdater } from "@/components/admin/support/support-ticket-live-updater";
import db from "@/packages/db/client";
import { requirePlatformPermission } from "@/lib/admin/platform";

type SupportTicketRow = {
  id: string;
  requesterRole: string;
  requesterName: string;
  requesterIdentifier: string;
  message: string;
  status: "PENDING" | "FIXED";
  priority: "HIGH" | "NORMAL";
  fixedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  driverId: string | null;
  driverName: string | null;
  driverEmail: string | null;
  driverPhoneNumber: string | null;
  driverLiveAddress: unknown;
  parentId: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhoneNumber: string | null;
};

type DriverParentRow = {
  driverId: string;
  connectionStatus: string;
  parentId: string;
  parentName: string | null;
  parentEmail: string | null;
  parentPhoneNumber: string | null;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function phoneHref(phone?: string | null) {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
}

function getLiveLocationHref(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const location = value as { latitude?: unknown; longitude?: unknown };
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function requesterLabel(role: string) {
  if (role === "parent") return "Parent";
  if (role === "driver") return "Driver";
  if (role === "teacher") return "Teacher";
  if (role === "school" || role === "admin") return "School";
  return "Account";
}

const AdminSupportPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) => {
  await requirePlatformPermission("accounts.read");
  const params = await searchParams;
  const showHistory = params.view === "history";
  let loadError: string | null = null;

  let rows: SupportTicketRow[] = [];
  try {
    rows = showHistory
      ? await db.$queryRaw<SupportTicketRow[]>`
        SELECT
          ticket."id",
          ticket."requester_role" AS "requesterRole",
          ticket."requester_name" AS "requesterName",
          ticket."requester_identifier" AS "requesterIdentifier",
          ticket."message",
          ticket."status",
          ticket."priority",
          ticket."fixed_at" AS "fixedAt",
          ticket."deleted_at" AS "deletedAt",
          ticket."created_at" AS "createdAt",
          ticket."updated_at" AS "updatedAt",
          driver."id" AS "driverId",
          driver."full_name" AS "driverName",
          driver."email" AS "driverEmail",
          driver."phoneNumber" AS "driverPhoneNumber",
          driver."live_address" AS "driverLiveAddress",
          parent."id" AS "parentId",
          parent."full_name" AS "parentName",
          parent."email" AS "parentEmail",
          parent."phoneNumber" AS "parentPhoneNumber"
        FROM "support_tickets" ticket
        LEFT JOIN "Driver" driver ON driver."id" = ticket."driver_id"
        LEFT JOIN "Parent" parent ON parent."id" = ticket."parent_id"
        WHERE ticket."deleted_at" IS NOT NULL
          AND ticket."deleted_at" >= NOW() - INTERVAL '21 days'
        ORDER BY ticket."deleted_at" DESC
      `
      : await db.$queryRaw<SupportTicketRow[]>`
    SELECT
      ticket."id",
      ticket."requester_role" AS "requesterRole",
      ticket."requester_name" AS "requesterName",
      ticket."requester_identifier" AS "requesterIdentifier",
      ticket."message",
      ticket."status",
      ticket."priority",
      ticket."fixed_at" AS "fixedAt",
      ticket."deleted_at" AS "deletedAt",
      ticket."created_at" AS "createdAt",
      ticket."updated_at" AS "updatedAt",
      driver."id" AS "driverId",
      driver."full_name" AS "driverName",
      driver."email" AS "driverEmail",
      driver."phoneNumber" AS "driverPhoneNumber",
      driver."live_address" AS "driverLiveAddress",
      parent."id" AS "parentId",
      parent."full_name" AS "parentName",
      parent."email" AS "parentEmail",
      parent."phoneNumber" AS "parentPhoneNumber"
    FROM "support_tickets" ticket
    LEFT JOIN "Driver" driver ON driver."id" = ticket."driver_id"
    LEFT JOIN "Parent" parent ON parent."id" = ticket."parent_id"
    WHERE ticket."deleted_at" IS NULL
    ORDER BY
      CASE
        WHEN ticket."priority" = 'HIGH' AND ticket."status" = 'PENDING' THEN 0
        WHEN ticket."priority" = 'HIGH' THEN 1
        ELSE 2
      END ASC,
      CASE WHEN ticket."status" = 'PENDING' THEN 0 ELSE 1 END ASC,
      ticket."created_at" DESC
  `;
  } catch (error) {
    console.error("Support tickets failed to load:", error);
    loadError = "Support tickets are temporarily busy. The live view will retry automatically.";
  }

  const urgentDriverIds = Array.from(
    new Set(
      rows
        .filter((ticket) => ticket.priority === "HIGH" && ticket.requesterRole === "driver" && ticket.driverId)
        .map((ticket) => ticket.driverId as string)
    )
  );
  let driverParentRows: DriverParentRow[] = [];
  try {
    driverParentRows = urgentDriverIds.length
      ? await db.$queryRaw<DriverParentRow[]>`
        SELECT
          connection."driver_id" AS "driverId",
          connection."status" AS "connectionStatus",
          parent."id" AS "parentId",
          parent."full_name" AS "parentName",
          parent."email" AS "parentEmail",
          parent."phoneNumber" AS "parentPhoneNumber"
        FROM "parent_driver_connections" connection
        INNER JOIN "Parent" parent ON parent."id" = connection."parent_id"
        WHERE connection."driver_id" IN (${Prisma.join(urgentDriverIds)})
        ORDER BY parent."full_name" ASC NULLS LAST, parent."createdAt" DESC
      `
      : [];
  } catch (error) {
    console.error("Support ticket parent context failed to load:", error);
  }
  const parentsByDriverId = driverParentRows.reduce<Record<string, DriverParentRow[]>>((acc, parent) => {
    acc[parent.driverId] = [...(acc[parent.driverId] || []), parent];
    return acc;
  }, {});

  const tickets = rows.map((ticket) => ({
    id: ticket.id,
    requesterRole: ticket.requesterRole,
    requesterName: ticket.requesterName,
    requesterIdentifier: ticket.requesterIdentifier,
    message: ticket.message,
    status: ticket.status,
    priority: ticket.priority,
    fixedAt: ticket.fixedAt,
    deletedAt: ticket.deletedAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    driver: ticket.driverId
      ? {
          id: ticket.driverId,
          full_name: ticket.driverName,
          email: ticket.driverEmail,
          phoneNumber: ticket.driverPhoneNumber,
          liveAddress: ticket.driverLiveAddress,
        }
      : null,
    parent: ticket.parentId
      ? {
          id: ticket.parentId,
          full_name: ticket.parentName,
          email: ticket.parentEmail,
          phoneNumber: ticket.parentPhoneNumber,
        }
      : null,
  }));

  const pendingCount = tickets.filter((ticket) => ticket.status === "PENDING").length;
  const highPriorityCount = tickets.filter((ticket) => ticket.priority === "HIGH" && ticket.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Support tickets</h1>
            <SupportTicketLiveUpdater />
          </div>
          <p className="text-sm text-slate-500">
            {showHistory ? "Fixed tickets are kept here for 21 days before permanent deletion." : "Driver complaints and support requests from the app."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/admin/support"
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${!showHistory ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              Active tickets
            </Link>
            <Link
              href="/admin/support?view=history"
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${showHistory ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              Deleted history
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">{showHistory ? "History" : "Pending"}</p>
          <p className="text-2xl font-semibold">{showHistory ? tickets.length : pendingCount}</p>
          <p className="text-xs font-medium text-rose-600">{showHistory ? "21-day retention" : `${highPriorityCount} urgent`}</p>
        </div>
      </div>

      <section className="grid gap-3">
        {loadError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            {loadError}
          </div>
        )}
        {tickets.map((ticket) => (
          <article key={ticket.id} className={`rounded-lg border bg-white p-4 ${ticket.priority === "HIGH" ? "border-rose-200" : "border-slate-200"}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-700">
                    <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{ticket.requesterName}</h2>
                    <p className="text-xs text-slate-500">
                      {requesterLabel(ticket.requesterRole)} ID: <span className="font-medium text-slate-700">{ticket.requesterIdentifier}</span>
                    </p>
                  </div>
                </div>
                {ticket.priority === "HIGH" && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    Urgent priority
                  </span>
                )}
                <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{ticket.message}</p>
                {ticket.priority === "HIGH" && ticket.requesterRole === "driver" && ticket.driver && (
                  <div className="mt-3 rounded-md border border-rose-100 bg-rose-50/60 p-3">
                    <div className="flex flex-wrap gap-2">
                      {phoneHref(ticket.driver.phoneNumber) ? (
                        <a
                          href={phoneHref(ticket.driver.phoneNumber) || undefined}
                          className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                        >
                          <Phone className="h-4 w-4" aria-hidden="true" />
                          Call driver
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700">
                          <Phone className="h-4 w-4" aria-hidden="true" />
                          No driver phone
                        </span>
                      )}
                      {getLiveLocationHref(ticket.driver.liveAddress) ? (
                        <a
                          href={getLiveLocationHref(ticket.driver.liveAddress) || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          View live location
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          No live location
                        </span>
                      )}
                    </div>

                    <details className="mt-3">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        View parents under driver
                      </summary>
                      <div className="mt-3 grid gap-2">
                        {(parentsByDriverId[ticket.driver.id] || []).map((parent) => (
                          <div key={parent.parentId} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{parent.parentName || "Parent"}</p>
                              <p className="text-xs text-slate-500">{parent.connectionStatus.replaceAll("_", " ")}</p>
                              <p className="truncate text-xs text-slate-500">{parent.parentEmail || "No email"}</p>
                            </div>
                            {phoneHref(parent.parentPhoneNumber) ? (
                              <a
                                href={phoneHref(parent.parentPhoneNumber) || undefined}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                              >
                                <Phone className="h-4 w-4" aria-hidden="true" />
                                Call parent
                              </a>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">No phone</span>
                            )}
                          </div>
                        ))}
                        {!parentsByDriverId[ticket.driver.id]?.length && (
                          <p className="rounded-md bg-white p-3 text-sm text-slate-500">No parents found under this driver.</p>
                        )}
                      </div>
                    </details>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Created: {formatDate(ticket.createdAt)}</span>
                  <span>Updated: {formatDate(ticket.updatedAt)}</span>
                  {ticket.fixedAt && <span>Fixed: {formatDate(ticket.fixedAt)}</span>}
                  {ticket.deletedAt && <span>History until: {formatDate(new Date(ticket.deletedAt.getTime() + 21 * 24 * 60 * 60 * 1000))}</span>}
                  {(ticket.driver?.phoneNumber || ticket.parent?.phoneNumber) && <span>Phone: {ticket.driver?.phoneNumber || ticket.parent?.phoneNumber}</span>}
                  {(ticket.driver?.email || ticket.parent?.email) && <span>Email: {ticket.driver?.email || ticket.parent?.email}</span>}
                </div>
              </div>
              {!showHistory && <SupportTicketControls ticketId={ticket.id} initialStatus={ticket.status} />}
            </div>
          </article>
        ))}

        {!tickets.length && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            {showHistory ? "No deleted ticket history." : "No support tickets yet."}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSupportPage;
