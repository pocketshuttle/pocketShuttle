import { NextRequest, NextResponse } from "next/server";

import db from "@/packages/db/client";
import { getApiSession, isParent } from "@/lib/api-auth";
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

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await getOwnedChild(params.id, session.id);
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

  const child = await db.parentChild.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json({ message: "Child updated", child });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const session = await getApiSession();
  if (!isParent(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await getOwnedChild(params.id, session.id);
  if (!existing) {
    return NextResponse.json({ message: "Child not found" }, { status: 404 });
  }

  await db.parentChild.delete({ where: { id: existing.id } });

  return NextResponse.json({ message: "Child removed" });
}
