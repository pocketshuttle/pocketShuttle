import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { getToken } from "next-auth/jwt";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  DEFAULT_USER_ROLE,
} from "@/routes";
import { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);
//@ts-ignore

export default auth(async (req) => {
  const { nextUrl } = req;
  const token = await getToken({
    req,
    //@ts-ignore
    secret: process.env.NEXTAUTH_SECRET,
  });
  const userRole = token?.role;

  const isLoggedIn = !!req.auth;
  console.log(isLoggedIn, "loggin in");

  const isAPIAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  //   //if the nexturl.pathname is included in the publicroutes array, then it requires no auth
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  //   //if the nexturl.pathname is included in the authroutes array, then it requires auth
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  console.log(isAuthRoute, "auth in", nextUrl.pathname);
  if (isAPIAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (userRole && userRole === "teacher") {
        console.log("Redirecting to parent page");
        return Response.redirect(new URL(DEFAULT_USER_ROLE, nextUrl));
      }

      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }

    return null;
  }
  console.log(userRole, "user role 2");

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  return null;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
  unstable_allowDynamic: [
    "mongoose/dist/browser.umd.js",
    "./(models)/Parent.ts",
    "/node_modules/function-bind/**", // use a glob to allow anything in the function-bind 3rd party module
  ],
};
