import ResetPasswordToken from "@/(models)/ResetPassword";
import { db } from "@/lib/db";
import { connectToDB } from "@/utils/connect-to-db";

export const getResetPasswordTokenByEmail = async (email: string) => {
  try {
    const resetPasswordToken = db.resetPasswordToken.findFirst({
      where: { email: email },
    });
    return resetPasswordToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getResetPasswordTokenByToken = async (token: string) => {
  try {
    const resetPasswordToken = await db.resetPasswordToken.findUnique({
      where: {
        token: token,
      },
    });
    return resetPasswordToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};
