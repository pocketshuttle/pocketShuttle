import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getCreatedUser, getUserByEmail, getUserById } from "@/data/user";
import clientPromise from "@/utils/db-promise";
import User from "./(models)/User";
import { connectToDB } from "./utils/connect-to-db";
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
        await connectToDB(); // Connect to the database
        if (account?.provider !== "credentials") return true;

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
      if (!token.sub) return token;

      if (token.role === "teacher" || token.role === "parent") {
        token.role = token.role;
        token.name = token.name;
      } else if (token.sub) {
        const existingUser = await getUserById(token.sub);
        if (existingUser) {
          token.role = existingUser?.role;
        }
      }

      return token;
    },
    async session({ token, session, user }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      const createdUser = await getCreatedUser(token?.email);

      if (createdUser) {
        if (createdUser.teacher) {
          session.user.name = createdUser.teacher.full_name;
          session.user.role = createdUser.teacher.role;
        } else if (createdUser.parent) {
          session.user.name = createdUser.parent.full_name;
          session.user.role = createdUser.parent.role;
        }
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
        // session.user.name = token.name;
      }

      return session;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});
