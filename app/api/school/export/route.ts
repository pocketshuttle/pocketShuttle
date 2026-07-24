import { NextRequest, NextResponse } from "next/server";

import { canManageSchool, getApiSession } from "@/lib/api-auth";
import {
  getEntitlements,
  historyCutoff,
  requireFeature,
} from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

function csv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const resolved = await getEntitlements(session);
    requireFeature(resolved, "csv_export");
    const cutoff = historyCutoff(resolved);
    const resource = req.nextUrl.searchParams.get("resource") || "students";
    let headers: string[] = [];
    let records: Array<Array<unknown>> = [];

    if (resource === "students") {
      const rows = await db.student.findMany({
        where: { schoolId },
        include: { bus: true, teacher: true, parent: true },
        orderBy: { full_name: "asc" },
      });
      headers = ["id", "name", "grade", "attendance", "status", "bus", "teacher", "parent"];
      records = rows.map((row) => [
        row.id,
        row.full_name,
        row.grade,
        row.attendance,
        row.status,
        row.bus?.bus_number,
        row.teacher?.full_name,
        row.parent?.full_name,
      ]);
    } else if (resource === "staff") {
      const [teachers, drivers] = await Promise.all([
        db.teacher.findMany({ where: { schoolId }, orderBy: { full_name: "asc" } }),
        db.driver.findMany({ where: { schoolId }, orderBy: { full_name: "asc" } }),
      ]);
      headers = ["id", "type", "name", "email", "phone"];
      records = [
        ...teachers.map((row) => [row.id, "teacher", row.full_name, row.email, row.phoneNumber]),
        ...drivers.map((row) => [row.id, "driver", row.full_name, row.email, row.phoneNumber]),
      ];
    } else if (resource === "vehicles") {
      const rows = await db.buses.findMany({
        where: { schoolId },
        include: { route: true, teacher: true, driver: true },
        orderBy: { bus_number: "asc" },
      });
      headers = ["id", "number", "vehicle", "status", "route", "teacher", "driver"];
      records = rows.map((row) => [
        row.id,
        row.bus_number,
        row.bus_product_name,
        row.driver ? "ASSIGNED" : "UNASSIGNED",
        row.route?.route_name,
        row.teacher?.full_name,
        row.driver?.full_name,
      ]);
    } else if (resource === "trips") {
      const rows = await db.trip.findMany({
        where: {
          schoolId,
          ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
        },
        orderBy: { createdAt: "desc" },
      });
      headers = ["id", "title", "type", "status", "safety", "started", "ended"];
      records = rows.map((row) => [
        row.id,
        row.title,
        row.tripType,
        row.status,
        row.safetyState,
        row.startedAt?.toISOString(),
        row.endedAt?.toISOString(),
      ]);
    } else {
      return NextResponse.json({ message: "Unsupported export resource" }, { status: 400 });
    }

    const output = [headers, ...records].map((row) => row.map(csv).join(",")).join("\n");
    return new NextResponse(output, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${resource}.csv"`,
      },
    });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json({ message: "Unable to export records" }, { status: 400 });
  }
}
