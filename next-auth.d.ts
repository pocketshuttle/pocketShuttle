import NextAuth, { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  role: "admin" | "parent" | "teacher";
};
declare module "next-auth" {
  interface session {
    user: ExtendedUser;
  }
}
