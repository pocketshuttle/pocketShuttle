import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  DEFAULT_USER_ROLE,
} from "@/routes";
import { NextRequest } from "next/server";
import { decrypt } from "./lib/create-session";
import { cookies } from "next/headers";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  try {
    const cookie = req.cookies.get("session")?.value;

    const token = await decrypt(cookie);

    const userRole = token?.role;
    const isLoggedIn = !!token;
    const isAPIAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

    //   //if the nexturl.pathname is included in the authroutes array, then it requires auth
    if (isAPIAuthRoute) {
      return null;
    }

    // Matching for both static and dynamic routes
    const isAuthRoute = authRoutes.some((route) =>
      nextUrl.pathname.startsWith(route)
    );

    if (isAuthRoute) {
      if (isLoggedIn) {
        if (userRole === "parent") {
          return Response.redirect(new URL(DEFAULT_USER_ROLE, nextUrl));
        }
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }

      return null;
    }

    // If user is not logged in and it's not a public route, redirect to login
    if (!isLoggedIn && !isPublicRoute) {
      //taking users back to the previous used route
      let callbackUrl = nextUrl.pathname;
      console.log(callbackUrl, "from middleware");

      if (nextUrl.search && nextUrl.search.startsWith("?")) {
        callbackUrl += nextUrl.search;
      }

      const encodeCallbackUrl = encodeURIComponent(callbackUrl);

      return Response.redirect(
        new URL(`/login?callbackUrl=${encodeCallbackUrl}`, nextUrl)
      );
    }

    return null;
  } catch (error) {
    return Response.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
  unstable_allowDynamic: [
    "mongoose/dist/browser.umd.js",
    "./(models)/Parent.ts",
    "/node_modules/function-bind/**",
  ],
};
