import { NextRequest, NextResponse } from "next/server";

import { getApiSession, isParent } from "@/lib/api-auth";
import { createInviteToken, normalizeLookup, normalizePhone } from "@/lib/known-driver-network";
import { sendDriverInviteEmail } from "@/lib/mail";
import db from "@/packages/db/client";
import {
  getFamilyEntitlements,
} from "@/lib/billing/entitlements";
import { assertDriverConnectionMutationAllowed } from "@/lib/billing/family-limits";
import { upgradeRequiredResponse } from "@/lib/billing/responses";
import { withSerializableTransaction } from "@/lib/prisma-transactions";

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? normalizeLookup(body.email) : "";
  const phoneNumber = typeof body.phoneNumber === "string" ? normalizePhone(body.phoneNumber) : "";

  if (!email && !phoneNumber) {
    return NextResponse.json({ message: "Email or phone number is required" }, { status: 400 });
  }

  const parent = await db.parent.findFirst({
    where: { id: session.id, accountType: "STANDALONE", schoolId: null },
    select: { id: true, full_name: true },
  });

  if (!parent) {
    return NextResponse.json({ message: "Standalone parent not found" }, { status: 404 });
  }

  const existingDriver = await db.driver.findFirst({
    where: {
      accountType: "STANDALONE",
      schoolId: null,
      OR: [
        ...(email ? [{ email }] : []),
        ...(phoneNumber ? [{ phoneNumber }] : []),
      ],
    },
    select: { id: true },
  });

  const { token, tokenHash } = createInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  let invite;
  try {
    if (!existingDriver) {
      invite = await db.driverInvite.create({
        data: {
          parentId: parent.id,
          driverId: null,
          email: email || null,
          phoneNumber: phoneNumber || null,
          tokenHash,
          expiresAt,
        },
      });
    } else {
      const resolved = await getFamilyEntitlements(parent.id);
      invite = await withSerializableTransaction(async (tx) => {
        await assertDriverConnectionMutationAllowed(
          tx,
          resolved,
          parent.id,
          existingDriver.id
        );
        const savedInvite = await tx.driverInvite.create({
          data: {
            parentId: parent.id,
            driverId: existingDriver.id,
            email: email || null,
            phoneNumber: phoneNumber || null,
            tokenHash,
            expiresAt,
          },
        });
        await tx.parentDriverConnection.upsert({
          where: {
            parentId_driverId: {
              parentId: parent.id,
              driverId: existingDriver.id,
            },
          },
          create: {
            parentId: parent.id,
            driverId: existingDriver.id,
            status: "INVITED",
            requestedBy: "parent",
          },
          update: {
            status: "INVITED",
            requestedBy: "parent",
            revokedAt: null,
          },
        });
        return savedInvite;
      });
    }
  } catch (error) {
    const response = upgradeRequiredResponse(error);
    if (response) return response;
    throw error;
  }

  if (email) {
    await sendDriverInviteEmail({ email, token, parentName: parent.full_name });
  }

  return NextResponse.json({
    message: existingDriver
      ? "Driver connection request created"
      : email
        ? "Driver registration invite sent"
        : "Driver invite recorded",
    invite: {
      id: invite.id,
      email: invite.email,
      phoneNumber: invite.phoneNumber,
      status: invite.status,
      expiresAt: invite.expiresAt,
    },
  }, { status: 201 });
}
