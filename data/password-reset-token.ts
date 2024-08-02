import ResetPasswordToken from "@/(models)/ResetPassword";
import { connectToDB } from "@/utils/connect-to-db";

export const getResetPasswordTokenByEmail = async (email: string) => {
  try {
    await connectToDB();
    const resetPasswordToken = ResetPasswordToken.find({ email: email });
    return resetPasswordToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getResetPasswordTokenByToken = async (token: string) => {
  try {
    await connectToDB();
    const resetPasswordToken = await ResetPasswordToken.findOne({
      token: token,
    });
    return resetPasswordToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};
