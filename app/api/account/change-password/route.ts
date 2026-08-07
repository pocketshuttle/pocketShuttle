import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getApiSession } from "@/lib/api-auth";
import { ChangePasswordSchema } from "@/schemas";
import db from "@/packages/db/client";

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session || !["parent", "driver"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validatedFields = ChangePasswordSchema.safeParse(body);
  if (!validatedFields.success) {
    return NextResponse.json({ message: "Invalid fields" }, { status: 400 });
  }

  const { currentPassword, newPassword } = validatedFields.data;
  const isParent = session.role === "parent";

  const account = isParent
    ? await db.parent.findUnique({ where: { id: session.id }, select: { password: true } })
    : await db.driver.findUnique({ where: { id: session.id }, select: { password: true } });

  if (!account?.password) {
    return NextResponse.json({ message: "No password set for this account" }, { status: 400 });
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, account.password);
  if (!isCurrentPasswordValid) {
    return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
  }

  const isSamePassword = await bcrypt.compare(newPassword, account.password);
  if (isSamePassword) {
    return NextResponse.json({ message: "New password must be different from your current password" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  if (isParent) {
    await db.parent.update({ where: { id: session.id }, data: { password: hashedPassword } });
  } else {
    await db.driver.update({ where: { id: session.id }, data: { password: hashedPassword } });
  }

  return NextResponse.json({ message: "Password updated successfully" });
}
