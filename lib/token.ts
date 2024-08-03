import ResetPasswordToken from "@/(models)/ResetPassword";
import VerificationToken from "@/(models)/VerificationToken";
import { getResetPasswordTokenByEmail } from "@/data/password-reset-token";
import { getVerificationTokenByEmail } from "@/data/verification-token";
import { v4 as uuidv4 } from "uuid";

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  // it expires in one hour
  const expires = new Date(Date.now() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await VerificationToken.deleteOne({ _id: existingToken._id });
  }

  const verificationToken = await VerificationToken.create({
    email,
    token,
    expires,
  });

  return verificationToken;
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  // it expires in one hour
  const expires = new Date(Date.now() + 3600 * 1000);

  const existingToken = await getResetPasswordTokenByEmail(email);

  if (existingToken) {
    await ResetPasswordToken.deleteOne({ _id: existingToken._id });
  }

  const resetPasswordToken = await ResetPasswordToken.create({
    email,
    token,
    expires,
  });

  return resetPasswordToken;
};
