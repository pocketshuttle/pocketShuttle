import { NextRequest, NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/admin/request-security";
import { canManageSchool, getApiSession } from "@/lib/api-auth";
import {
  assertWithinLimit,
  getEntitlements,
  requireFeature,
} from "@/lib/billing/entitlements";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import db from "@/packages/db/client";

type Row = Record<string, unknown>;
const resources = ["STUDENTS", "STAFF", "VEHICLES", "ROUTES", "ASSIGNMENTS"] as const;

function text(row: Row, key: string) {
  const value = row[key];
  return value === null || value === undefined ? "" : String(value).trim();
}

export async function GET() {
  const session = await getApiSession();
  const schoolId = session?.schoolId;
  if (!canManageSchool(session) || !schoolId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const jobs = await db.schoolImportJob.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  return NextResponse.json({ jobs, resources });
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const session = await getApiSession();
    const schoolId = session?.schoolId;
    if (!canManageSchool(session) || !schoolId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const resource = String(body.resource || "").toUpperCase() as (typeof resources)[number];
    const clientRequestId = String(body.clientRequestId || "").trim();
    const rows = Array.isArray(body.rows)
      ? body.rows.filter((row: unknown): row is Row => Boolean(row && typeof row === "object" && !Array.isArray(row)))
      : [];
    if (!resources.includes(resource) || !clientRequestId || !rows.length || rows.length > 2000) {
      return NextResponse.json(
        { message: "Resource, clientRequestId, and 1-2,000 rows are required" },
        { status: 400 }
      );
    }
    const existing = await db.schoolImportJob.findUnique({
      where: { schoolId_clientRequestId: { schoolId, clientRequestId } },
    });
    if (existing) return NextResponse.json({ job: existing, duplicate: true });

    const resolved = await getEntitlements(session);
    requireFeature(resolved, "csv_import");
    if (resource === "STUDENTS") {
      assertWithinLimit(
        resolved,
        "max_students",
        await db.student.count({ where: { schoolId } }),
        rows.length
      );
    } else if (resource === "STAFF") {
      const [teachers, drivers] = await Promise.all([
        db.teacher.count({ where: { schoolId } }),
        db.driver.count({ where: { schoolId } }),
      ]);
      assertWithinLimit(resolved, "max_staff", teachers + drivers, rows.length);
    } else if (resource === "VEHICLES") {
      assertWithinLimit(
        resolved,
        "max_buses",
        await db.buses.count({ where: { schoolId } }),
        rows.length
      );
    }

    const job = await db.schoolImportJob.create({
      data: {
        schoolId,
        requestedBy: session.id,
        resource,
        clientRequestId,
        status: "PROCESSING",
        totalRows: rows.length,
      },
    });
    const errors: Array<{ row: number; message: string }> = [];
    let succeededRows = 0;

    for (const [index, row] of rows.entries()) {
      try {
        if (resource === "STUDENTS") {
          const fullName = text(row, "full_name") || text(row, "name");
          if (!fullName) throw new Error("full_name is required");
          const busId = text(row, "busId") || null;
          if (busId && !(await db.buses.findFirst({ where: { id: busId, schoolId } }))) {
            throw new Error("busId does not belong to this school");
          }
          await db.student.create({
            data: {
              schoolId,
              full_name: fullName,
              grade: text(row, "grade") || null,
              gender: text(row, "gender") || null,
              age: text(row, "age") ? Number(text(row, "age")) : null,
              address: text(row, "address") || null,
              busId,
            },
          });
        } else if (resource === "STAFF") {
          const kind = text(row, "type").toLowerCase();
          const name = text(row, "full_name") || text(row, "name");
          const email = text(row, "email").toLowerCase();
          if (!name || !email || !["teacher", "driver"].includes(kind)) {
            throw new Error("type, name, and email are required");
          }
          if (kind === "teacher") {
            await db.teacher.create({
              data: {
                schoolId,
                full_name: name,
                email,
                role: "teacher",
                address: text(row, "address") || "Not provided",
                phoneNumber: text(row, "phoneNumber") || null,
              },
            });
          } else {
            await db.driver.create({
              data: {
                schoolId,
                full_name: name,
                email,
                address: text(row, "address") || "Not provided",
                phoneNumber: text(row, "phoneNumber") || null,
              },
            });
          }
        } else if (resource === "ROUTES") {
          const name = text(row, "route_name") || text(row, "name");
          if (!name) throw new Error("route_name is required");
          await db.route.create({
            data: {
              schoolId,
              route_name: name,
              route_description: text(row, "route_description") || text(row, "description") || name,
            },
          });
        } else if (resource === "VEHICLES") {
          const routeId = text(row, "routeId");
          const route = await db.route.findFirst({ where: { id: routeId, schoolId } });
          if (!route) throw new Error("A valid routeId is required");
          const busNumber = text(row, "bus_number") || text(row, "number");
          const seats = Number(text(row, "seat_number") || text(row, "seats"));
          if (!busNumber || !Number.isInteger(seats) || seats < 1) {
            throw new Error("bus_number and a positive seat_number are required");
          }
          await db.buses.create({
            data: {
              schoolId,
              routeId,
              bus_number: busNumber,
              bus_product_name: text(row, "bus_product_name") || text(row, "vehicle") || "School vehicle",
              seat_number: seats,
              availableSeats: seats,
              color: text(row, "color") || null,
            },
          });
        } else {
          const busId = text(row, "busId");
          const driverId = text(row, "driverId");
          const teacherId = text(row, "teacherId");
          const [bus, driver, teacher] = await Promise.all([
            db.buses.findFirst({ where: { id: busId, schoolId } }),
            driverId ? db.driver.findFirst({ where: { id: driverId, schoolId } }) : null,
            teacherId ? db.teacher.findFirst({ where: { id: teacherId, schoolId } }) : null,
          ]);
          if (!bus || (!driver && !teacher)) throw new Error("Valid busId and driverId or teacherId are required");
          await db.buses.update({
            where: { id: bus.id },
            data: {
              ...(driver ? { driver: { connect: { id: driver.id } } } : {}),
              ...(teacher ? { teacher: { connect: { id: teacher.id } } } : {}),
            },
          });
        }
        succeededRows += 1;
      } catch (error) {
        errors.push({
          row: index + 2,
          message: error instanceof Error ? error.message : "Import failed",
        });
      }
    }

    const saved = await db.schoolImportJob.update({
      where: { id: job.id },
      data: {
        succeededRows,
        failedRows: errors.length,
        errors,
        status: errors.length ? (succeededRows ? "PARTIAL" : "FAILED") : "COMPLETED",
      },
    });
    return NextResponse.json({ job: saved }, { status: 201 });
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to import records" },
      { status: 400 }
    );
  }
}
