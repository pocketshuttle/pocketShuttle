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
    async signIn({ user, account, profile }) {
      try {
        await connectToDB(); // Connect to the database
        console.log("users", user);
        if (account?.provider !== "credentials") return true;

        const existingUser = await getUserById(user?.id);

        console.log("existing users", profile);

        if (!existingUser?.[0].emailVerified) return false;
        // if (account?.provider !== "credentials") {
        //   const existingUser = await getUserById(user?.id);
        //   if (existingUser) {
        //     if (!existingUser?.[0].emailVerified) {
        //       console.log("Email not verified");
        //       return false;
        //     }
        //   }
        //   return true;
        // }

        const userExist = await User.findOne({
          email: profile?.email,
        });

        console.log(userExist);

        // if (!userExist) {
        //   await User.create({
        //     email: profile?.email,
        //     // Ensure there's no space in the username and convert to lowercase
        //     username: profile?.name?.replace(" ", " ").toLowerCase(),
        //     image: profile?.image,
        //   });
        // } else {
        //   return userExist;
        // }

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
      // console.log("existing users", existingUser?.[0]?.role);

      if (!existingUser) return token;

      token.role = existingUser?.[0]?.role;

      return token;
    },
  },
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  ...authConfig,
});
