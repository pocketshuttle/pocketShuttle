import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isParent } from "@/lib/api-auth";
import { geocodeAddress } from "@/lib/google-geocoding";
import { ParentChildSchema } from "@/schemas";

type Params = {
  id: string;
};

async function getOwnedChild(childId: string, parentId: string) {
  return db.parentChild.findFirst({
    where: {
      id: childId,
      parentId,
      parent: {
        accountType: "STANDALONE",
        schoolId: null,
      },
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedChild(id, session.id);
  if (!existing) {
    return NextResponse.json({ message: "Child not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = ParentChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  let schoolCoords;
  try {
    schoolCoords = await geocodeAddress(parsed.data.address);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "We could not locate this school address. Please enter a more specific address." },
      { status: 400 }
    );
  }

  const child = await db.parentChild.update({
    where: { id: existing.id },
    data: {
      fullName: parsed.data.fullName,
      age: parsed.data.age,
      grade: parsed.data.grade,
      address: parsed.data.address,
      image: parsed.data.image,
    },
  });

  await db.$executeRaw`
    UPDATE "parent_children"
    SET "school_coords" = ${JSON.stringify(schoolCoords)}::jsonb
    WHERE "id" = ${child.id}
  `;

  const normalizedAddress = parsed.data.address.trim().toLowerCase();
  const siblingRows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "parent_children"
    WHERE "parent_id" = ${session.id}
      AND LOWER(TRIM("address")) = ${normalizedAddress}
  `;

  await db.$executeRaw`
    UPDATE "parent_children"
    SET "school_coords" = ${JSON.stringify(schoolCoords)}::jsonb
    WHERE "parent_id" = ${session.id}
      AND LOWER(TRIM("address")) = ${normalizedAddress}
  `;

  return NextResponse.json({
    message: "Child updated",
    child: { ...child, schoolCoords },
    schoolCoordinateUpdate: {
      address: parsed.data.address,
      schoolCoords,
      childIds: siblingRows.map((row) => row.id),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedChild(id, session.id);
  if (!existing) {
    return NextResponse.json({ message: "Child not found" }, { status: 404 });
  }

  await db.parentChild.delete({ where: { id: existing.id } });

  return NextResponse.json({ message: "Child removed" });
}
