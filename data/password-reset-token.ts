import  db  from "@/packages/db/client";

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
