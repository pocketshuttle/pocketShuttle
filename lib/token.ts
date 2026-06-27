import { getResetPasswordTokenByEmail } from "@/data/password-reset-token";
import { getVerificationTokenByEmail } from "@/data/verification-token";
import db from "@/packages/db/client";

export const generateVerificationToken = async (
  email: string,
  role: string
) => {
  const token = crypto.randomUUID();

  // it expires in one hour
  const expires = new Date(Date.now() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      role,
      token,
      expires,
    },
  });

  return verificationToken;
};

export const generatePasswordResetToken = async (
  email: string,
  role: string
) => {
  const token = crypto.randomUUID();
  // it expires in one hour
  const expires = new Date(Date.now() + 3600 * 1000);
  const existingToken = await getResetPasswordTokenByEmail(email);

  if (existingToken) {
    await db.resetPasswordToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const resetPasswordToken = await db.resetPasswordToken.create({
    data: { email, role, token, expires },
  });

  return resetPasswordToken;
};
