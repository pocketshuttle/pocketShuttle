import NextAuth, { type DefaultSession } from "next-auth";
// import { JWT, DefaultJWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client";

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole;
};
// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       role: string;
//       name: string;
//       image: string;
//     } & DefaultSession;
//   }

//   interface User extends DefaultUser {
//     role: string;
//   }
// }

declare module "next-auth" {
  interface session {
    user: ExtendedUser;
  }
}
