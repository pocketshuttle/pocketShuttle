"use server";

import User from "@/(models)/User";
import VerificationToken from "@/(models)/VerificationToken";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { connectToDB } from "@/utils/connect-to-db";

export const newVerification = async (token: string) => {
  await connectToDB();
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

  await User.findByIdAndUpdate(
    existingUser._id,
    { emailVerified: new Date(), email: existingToken.email },
    { email: existingToken.email }
  );

  await VerificationToken.deleteOne({ _id: existingToken._id });

  return { success: "email verified" };
};
