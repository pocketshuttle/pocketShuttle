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
      // console.log(token, "token");
      if (!token.sub) return token;

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

      return token;
    },
    async session({ token, session, user }) {
      // console.log(, "session token");
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      // const createdUser = await getCreatedUser(token?.email);

      // if (createdUser) {
      //   if (createdUser.teacher) {
      //     session.user.name = createdUser.teacher.full_name;
      //     //@ts-ignore

      //     session.user.role = createdUser.teacher.role;
      //   } else if (createdUser.parent) {
      //     session.user.name = createdUser.parent.full_name;
      //     //@ts-ignore

      //     session.user.role = createdUser.parent.role;
      //   }
      // }

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
