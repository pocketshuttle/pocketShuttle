import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isParent } from "@/lib/api-auth";
import { geocodeAddress } from "@/lib/google-geocoding";
import { ParentChildSchema } from "@/schemas";

async function getStandaloneParent(parentId: string) {
  return db.parent.findFirst({
    where: {
      id: parentId,
      accountType: "STANDALONE",
      schoolId: null,
    },
    select: { id: true },
  });
}

export async function GET() {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parent = await getStandaloneParent(session.id);
  if (!parent) {
    return NextResponse.json({ message: "Standalone parent not found" }, { status: 404 });
  }

  const children = await db.parentChild.findMany({
    where: { parentId: parent.id },
    include: {
      activeDriver: {
        select: {
          id: true,
          full_name: true,
          phoneNumber: true,
          serviceAreas: true,
          verificationStatus: true,
          carMake: true,
          carModel: true,
          plateNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const schoolCoordRows = await db.$queryRaw<Array<{ id: string; address: string | null; schoolCoords: unknown }>>`
    SELECT "id", "address", "school_coords" AS "schoolCoords"
    FROM "parent_children"
    WHERE "parent_id" = ${parent.id}
  `;
  const schoolCoordsByChildId = new Map(schoolCoordRows.map((row) => [row.id, row.schoolCoords]));
  const schoolCoordsByAddress = new Map(
    schoolCoordRows
      .filter((row) => row.address && row.schoolCoords)
      .map((row) => [row.address!.trim().toLowerCase(), row.schoolCoords])
  );

  return NextResponse.json({
    children: children.map((child) => ({
      ...child,
      schoolCoords:
        schoolCoordsByChildId.get(child.id) ??
        (child.address ? schoolCoordsByAddress.get(child.address.trim().toLowerCase()) : null) ??
        null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parent = await getStandaloneParent(session.id);
  if (!parent) {
    return NextResponse.json({ message: "Standalone parent not found" }, { status: 404 });
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

  const child = await db.parentChild.create({
    data: {
      parentId: parent.id,
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

  return NextResponse.json({ message: "Child added", child: { ...child, schoolCoords } }, { status: 201 });
}
