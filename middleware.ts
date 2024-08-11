import NextAuth from "next-auth";
import authConfig from "@/auth.config";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;

  const isLoggedIn = !!req.auth;
  console.log(isLoggedIn);

  const isAPIAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  //   //if the nexturl.pathname is included in the publicroutes array, then it requires no auth
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  //   //if the nexturl.pathname is included in the authroutes array, then it requires auth
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isAPIAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }

    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  return null;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
  unstable_allowDynamic: [
    "mongoose/dist/browser.umd.js",
    "./(models)/Parent.ts",
    "/node_modules/function-bind/**", // use a glob to allow anything in the function-bind 3rd party module
  ],
};
