"use server";

import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import db from "@/packages/db/client";

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return { error: "Token not found" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token expired" };
  }
  const existingUser = await getUserByEmail(
    existingToken.email,
    existingToken.role.toLowerCase()
  );

  if (!existingUser) {
    return { error: "Email does not exist" };
  }

  if ("role" in existingUser && existingUser.role.toLowerCase() === "parent") {
    await db.parent.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });
  } else if (
    "role" in existingUser &&
    existingUser.role.toLowerCase() === "admin"
  ) {
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });
  } else if (
    "role" in existingUser &&
    existingUser.role.toLowerCase() === "driver"
  ) {
    await db.driver.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });
  } else {
    await db.teacher.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });
  }

  await db.verificationToken.delete({ where: { id: existingToken.id } });

  return { success: "Email verified!" };
};
