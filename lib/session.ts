// import { auth } from "@/auth";

import { cookies } from "next/headers";
import { decrypt } from "./create-session";
import { cache } from "react";
import { redirect } from "next/navigation";

// export const getUserSession = async () => {
//   const session = await auth();
//   return session?.user;
// };

export const getUserSession = cache(async () => {
  const cookie = cookies().get("session")?.value;

  if (!cookie) return null;
  const session = await decrypt(cookie);
  return session;
});


// export const verifySession = cache(async () => {
//   const cookie = cookies().get("session")?.value;
//   const session = await decrypt(cookie);

//   if (!session?.userId) {
//     redirect("/login");
//   }

//   return { isAuth: true, userId: session.userId };
// });
