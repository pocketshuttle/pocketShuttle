import NextAuth from "next-auth";
// import authConfig from "./auth.config";
import {
  getCreatedById,
  getCreatedUser,
  getUserByEmail,
  getUserById,
} from "@/data/user";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./lib/db";
import { UserRole } from "@prisma/client";

import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { LoginSchema } from "@/schemas";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials) {
        //we validating the fields again
        const validatedFields = LoginSchema.safeParse(credentials);
        if (validatedFields.success) {
          const { email, password, role } = validatedFields.data;
          const user = await getUserByEmail(email, role);
          console.log(user, "this is user");

          if (!user || !user.password) {
            return null;
          }
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) return user;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
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
    // async authorized({ request: { nextUrl }, auth }) {
    //   const isLoggedIn = !!auth?.user;
    //   const { pathname } = nextUrl;

    // },
    async jwt({ token }) {
      if (!token.sub) return token;
      console.log("JWT Token:", token);

      try {
        if (token.sub) {
          const createdUser = await getCreatedById(token.sub);
          console.log("created user", createdUser);
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
      console.log("JWT Session:", session);

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
        session.user.name = token.name;
      }
      return session;
    },
    // debug: process.env.NODE_ENV === "development" ? true : false,
  },
  session: {
    strategy: "jwt",
    maxAge: 5 * 24 * 60 * 60,
  },
});
