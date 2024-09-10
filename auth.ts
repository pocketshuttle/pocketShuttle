import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  getCreatedById,
  getCreatedUser,
  getUserByEmail,
  getUserById,
} from "@/data/user";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./lib/db";
import { UserRole } from "@prisma/client";
export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailVerified: new Date(),
        },
      });
    },
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider !== "credentials") return true;
        //@ts-ignore

        const existingUser = await getUserByEmail(user?.email, user?.role);
        // console.log("user from authorize", existingUser);
        // if (!existingUser) {
        //   console.error("User not found during sign-in.");
        //   return false; // Fail if the user isn't found
        // }

        // if (!existingUser?.emailVerified) return false;

        // const userExist = await User.findOne({
        //   email: profile?.email,
        // });

        return true;
      } catch (error) {
        console.error("Error signing in:", error);
        throw error;
      }
    },

    async jwt({ token, user, profile }) {
      if (!token.sub) return token;
      console.log(token, "token");

      try {
        if (token.sub) {
          const createdUser = await getCreatedById(token.sub);

          if (createdUser) {
            if (createdUser.teacher) {
              token.name = createdUser.teacher.full_name;
              token.role = createdUser.teacher.role;
            } else if (createdUser.parent) {
              token.name = createdUser.parent.full_name;
              token.role = createdUser.parent.role;
            }
          } else {
            const existingUser = await getUserById(token.sub);
            if (existingUser) {
              token.role = existingUser?.role;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user by ID:", error);
      }
      return token;
    },

    async session({ token, session }) {
      console.log("session", session);
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        //@ts-ignore
        session.user.role = token.role as UserRole;
        session.user.name = token.name;
      }

      return session;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});
