import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getUserByEmail, getUserById } from "@/data/user";
import clientPromise from "@/utils/db-promise";
import User from "./(models)/User";
import { connectToDB } from "./utils/connect-to-db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await User.findByIdAndUpdate(
        user.id,
        { emailVerified: new Date() },
        { new: true, useFindAndModify: false }
      );
    },
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectToDB(); // Connect to the database
        if (account?.provider !== "credentials") return true;
        console.log(user, "sign in user");

        const existingUser = await getUserByEmail(user?.email, user?.role);
        console.log("existing user", existingUser);
        // console.log("user from authorize", existingUser);

        // if (!existingUser?.[0].emailVerified) return false;

        // const userExist = await User.findOne({
        //   email: profile?.email,
        // });
        console.log("User found:", user);

        return true;
      } catch (error) {
        console.error("Error signing in:", error);
        throw error;
      }
    },

    async jwt({ token, user, profile }) {
      if (!token.sub) return token;

      if (user?.role) {
        token.role = user?.role;
        token.name = user?.full_name;
      } else if (token.sub) {
        const existingUser = await getUserById(token.sub);
        if (existingUser) {
          token.role = existingUser?.[0]?.role;
          token.name = existingUser?.[0]?.name;
        }
      }

      return token;
    },
    async session({ token, session, user }) {
      console.log("session token", token);
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
        session.user.name = token.name;
      }

      return session;
    },
  },
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  ...authConfig,
});
