import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import {
  assertSameOrigin,
  sanitizeAuditValue,
} from "@/lib/admin/request-security";
import {
  logSuperUserAction,
  requirePlatformPermission,
} from "@/lib/admin/platform";
import db from "@/packages/db/client";

type AccountType = "school" | "parent" | "driver" | "teacher";
const accountTypes = new Set<AccountType>(["school", "parent", "driver", "teacher"]);

async function loadAccount(type: AccountType, id: string) {
  if (type === "school") {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        suspendedAt: true,
        suspendedReason: true,
        SchoolSettings: true,
        billingAccount: {
          include: {
            subscriptions: {
              include: { plan: true, planPrice: true },
              orderBy: { startDate: "desc" },
            },
            paymentAttempts: { orderBy: { createdAt: "desc" }, take: 20 },
          },
        },
        _count: {
          select: {
            Teacher: true,
            Driver: true,
            Parent: true,
            Student: true,
            Buses: true,
            Route: true,
          },
        },
      },
    });
  }
  if (type === "parent") {
    return db.parent.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        phoneNumber: true,
        address: true,
        image: true,
        accountType: true,
        schoolId: true,
        suspendedAt: true,
        suspendedReason: true,
        billingAccount: {
          include: {
            subscriptions: {
              include: { plan: true, planPrice: true },
              orderBy: { startDate: "desc" },
            },
            paymentAttempts: { orderBy: { createdAt: "desc" }, take: 20 },
          },
        },
        ParentChild: { orderBy: { createdAt: "desc" } },
        driverConnections: {
          include: {
            driver: {
              select: {
                id: true,
                full_name: true,
                email: true,
                verificationStatus: true,
              },
            },
            _count: { select: { assignments: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });
  }
  if (type === "driver") {
    return db.driver.findUnique({
      where: { id },
      select: {
        id: true,
        driverId: true,
        full_name: true,
        email: true,
        phoneNumber: true,
        address: true,
        image: true,
        accountType: true,
        schoolId: true,
        verificationStatus: true,
        verificationRejectionReason: true,
        serviceAreas: true,
        carMake: true,
        carModel: true,
        carColor: true,
        plateNumber: true,
        vehicleCapacity: true,
        lastActiveAt: true,
        suspendedAt: true,
        suspendedReason: true,
        shareProfile: { select: { shareId: true } },
        parentConnections: {
          select: {
            id: true,
            status: true,
            parent: { select: { id: true, full_name: true, email: true } },
            _count: { select: { assignments: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });
  }
  return db.teacher.findUnique({
    where: { id },
    select: {
      id: true,
      full_name: true,
      email: true,
      phoneNumber: true,
      address: true,
      image: true,
      schoolId: true,
      busId: true,
      suspendedAt: true,
      suspendedReason: true,
      bus: { select: { id: true, bus_number: true, bus_product_name: true } },
      _count: { select: { Student: true } },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    await requirePlatformPermission("accounts.read");
    const { type, id } = await params;
    if (!accountTypes.has(type as AccountType)) {
      return NextResponse.json({ message: "Invalid account type" }, { status: 400 });
    }
    const account = await loadAccount(type as AccountType, id);
    if (!account) return NextResponse.json({ message: "Account not found" }, { status: 404 });
    return NextResponse.json({
      type,
      account: sanitizeAuditValue(account),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load account";
    return NextResponse.json(
      { message },
      { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    assertSameOrigin(request);
    const session = await requirePlatformPermission("accounts.manage");
    const { type, id } = await params;
    if (!accountTypes.has(type as AccountType)) {
      return NextResponse.json({ message: "Invalid account type" }, { status: 400 });
    }
    const body = await request.json();
    const before = await loadAccount(type as AccountType, id);
    if (!before) return NextResponse.json({ message: "Account not found" }, { status: 404 });

    let updated: unknown;
    if (type === "school") {
      updated = await db.user.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: String(body.name).trim().slice(0, 120) } : {}),
          ...(body.image !== undefined ? { image: body.image ? String(body.image) : null } : {}),
        },
        select: { id: true, name: true, email: true, image: true },
      });
    } else if (type === "parent") {
      updated = await db.parent.update({
        where: { id },
        data: {
          ...(body.full_name !== undefined
            ? { full_name: String(body.full_name).trim().slice(0, 120) }
            : {}),
          ...(body.phoneNumber !== undefined
            ? { phoneNumber: body.phoneNumber ? String(body.phoneNumber).slice(0, 30) : null }
            : {}),
          ...(body.address !== undefined
            ? { address: body.address ? String(body.address).slice(0, 300) : null }
            : {}),
          ...(body.image !== undefined ? { image: body.image ? String(body.image) : null } : {}),
        },
        select: { id: true, full_name: true, email: true, phoneNumber: true, address: true, image: true },
      });
    } else if (type === "driver") {
      updated = await db.driver.update({
        where: { id },
        data: {
          ...(body.full_name !== undefined
            ? { full_name: String(body.full_name).trim().slice(0, 120) }
            : {}),
          ...(body.phoneNumber !== undefined
            ? { phoneNumber: body.phoneNumber ? String(body.phoneNumber).slice(0, 30) : null }
            : {}),
          ...(body.address !== undefined
            ? { address: String(body.address).slice(0, 300) }
            : {}),
          ...(body.serviceAreas !== undefined && Array.isArray(body.serviceAreas)
            ? { serviceAreas: body.serviceAreas.map(String).slice(0, 20) }
            : {}),
          ...(["carMake", "carModel", "carColor", "plateNumber"].reduce(
            (data, field) =>
              body[field] !== undefined
                ? { ...data, [field]: body[field] ? String(body[field]).slice(0, 80) : null }
                : data,
            {} as Record<string, string | null>
          )),
          ...(body.vehicleCapacity !== undefined
            ? {
                vehicleCapacity:
                  body.vehicleCapacity === null
                    ? null
                    : Math.max(1, Math.min(100, Number(body.vehicleCapacity))),
              }
            : {}),
        },
        select: {
          id: true,
          full_name: true,
          email: true,
          phoneNumber: true,
          address: true,
          serviceAreas: true,
          carMake: true,
          carModel: true,
          carColor: true,
          plateNumber: true,
          vehicleCapacity: true,
        },
      });
    } else {
      updated = await db.teacher.update({
        where: { id },
        data: {
          ...(body.full_name !== undefined
            ? { full_name: String(body.full_name).trim().slice(0, 120) }
            : {}),
          ...(body.phoneNumber !== undefined
            ? { phoneNumber: body.phoneNumber ? String(body.phoneNumber).slice(0, 30) : null }
            : {}),
          ...(body.address !== undefined
            ? { address: String(body.address).slice(0, 300) }
            : {}),
          ...(body.image !== undefined ? { image: body.image ? String(body.image) : null } : {}),
        },
        select: { id: true, full_name: true, email: true, phoneNumber: true, address: true, image: true },
      });
    }
    await logSuperUserAction({
      superUserId: session.id,
      action: "ACCOUNT_PROFILE_UPDATED",
      targetId: `${type}:${id}`,
      metadata: {
        before: sanitizeAuditValue(before),
        after: sanitizeAuditValue(updated),
      } as Prisma.InputJsonValue,
    });
    return NextResponse.json({ message: "Account updated", account: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update account";
    return NextResponse.json(
      { message },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : message === "FORBIDDEN" || message === "INVALID_ORIGIN"
              ? 403
              : 400,
      }
    );
  }
}
