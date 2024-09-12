import { auth } from "@/auth";

export const getUserSession = async () => {
  const session = await auth();
  console.log("Session data:", session);
  return session?.user;
};
