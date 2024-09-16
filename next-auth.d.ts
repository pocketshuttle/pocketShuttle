// import NextAuth, { type DefaultSession } from "next-auth";
// // import { JWT, DefaultJWT } from "next-auth/jwt";
// import { UserRole } from "@prisma/client";

// export type ExtendedUser = DefaultSession["user"] & {
//   role: UserRole;
// };
// // declare module "next-auth" {
// //   interface Session {
// //     user: {
// //       id: string;
// //       role: string;
// //       name: string;
// //       image: string;
// //     } & DefaultSession;
// //   }

// //   interface User extends DefaultUser {
// //     role: string;
// //   }
// // }

// declare module "next-auth" {
//   interface session {
//     user: ExtendedUser;
//   }
// }
// types/next-auth.d.ts

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
