import VerificationToken from "@/(models)/VerificationToken";
import { connectToDB } from "@/utils/connect-to-db";
export const getVerificationTokenByEmail = async (email: string) => {
  try {
    await connectToDB();
    const verificationToken = VerificationToken.find({ email: email });
    return verificationToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getVerificationTokenByToken = async (token: string) => {
  try {
    await connectToDB();
    const verificationToken = await VerificationToken.findOne({ token: token });
    return verificationToken;
  } catch (error) {
    console.error(error);
    return null;
  }
};
