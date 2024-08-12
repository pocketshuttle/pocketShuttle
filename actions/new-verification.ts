"use server";

import User from "@/(models)/User";
import VerificationToken from "@/(models)/VerificationToken";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { db } from "@/lib/db";
import { connectToDB } from "@/utils/connect-to-db";

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);
  console.log("existing token", existingToken);
  if (!existingToken) {
    return { error: "Token not found" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return { error: "Token expired" };
  }

  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return { error: "email doesnt exist" };
  }

  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });
  await db.verificationToken.delete({ where: { id: existingToken.id } });

  return { success: "Email verified!" };
};
