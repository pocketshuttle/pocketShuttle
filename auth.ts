import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getUserById } from "@/data/user";
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
    async signIn({ user, account }) {
      try {
        if (account?.provider !== "credentials") return true;

        const existingUser = await getUserById(user?.id);
        
        //preventing signin without email verification
        if (!existingUser?.emailVerified) return false;

        //     await connectToDB(); // Connect to the database
        //     const userExist = await User.findOne({
        //       email: profile?.email,
        //     });

        //     if (!userExist) {
        //       await User.create({
        //         email: profile?.email,
        //         // Ensure there's no space in the username and convert to lowercase
        //         username: profile?.name?.replace(" ", " ").toLowerCase(),
        //         image: profile?.image,
        //         role: "admin",
        //       });
        //     } else {
        //       return userExist;
        //     }
        return true;
      } catch (error) {
        console.error("Error signing in:", error);
        throw error;
      }
    },
    async session({ token, session }) {
      // console.log("token", token.role);
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as "admin" | "parent" | "teacher";
      }
      console.log("session", session);
      return session;
    },

    async jwt({ token }) {
      // console.log(token);
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      console.log("existing users", existingUser?.[0]?.role);

      if (!existingUser) return token;

      token.role = existingUser?.[0]?.role;

      return token;
    },
  },
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  ...authConfig,
});
