import { db } from "@/lib/db";
import { connectToDB } from "@/utils/connect-to-db";
export const getVerificationTokenByEmail = async (email: string) => {
  try {
    await connectToDB();
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        email,
      },
    });
    return verificationToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getVerificationTokenByToken = async (token: string) => {
  try {
    await connectToDB();
    const verificationToken = await db.verificationToken.findUnique({
      where: {
        token: token,
      },
    });
    return verificationToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};
