import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  role: "ADMIN" | "PARENT" | "TEACHER";
};
declare module "next-auth" {
  interface session {
    user: ExtendedUser;
  }
}
