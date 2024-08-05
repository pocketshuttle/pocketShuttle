import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
// export type ExtendedUser = DefaultSession["user"] & {
//   role: "admin" | "parent" | "teacher";
// };
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name: string;
      image: string;
    } & DefaultSession;
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
  }
}
