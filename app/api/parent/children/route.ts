import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isParent } from "@/lib/api-auth";
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

  return NextResponse.json({ children });
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

  return NextResponse.json({ message: "Child added", child }, { status: 201 });
}
