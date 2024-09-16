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

const { auth } = NextAuth(authConfig);
//@ts-ignore
export default auth(async (req) => {
  const { nextUrl } = req;

  try {
    const token = await getToken({
      req,
      //@ts-ignore
      secret: process.env.AUTH_SECRET,
    });

    const userRole = token?.role;
    const isLoggedIn = !!token;
    const isAPIAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

    //   //if the nexturl.pathname is included in the authroutes array, then it requires auth
    // const isAuthRoute = authRoutes.includes(nextUrl.pathname);
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
      console.log(isAuthRoute, "auth route");
      console.log(nextUrl.pathname, "pathname route");

      return null;
    }

    if (!isLoggedIn && !isPublicRoute) {
      //taking users back to the previous used route
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }

      const encodeCallbackUrl = encodeURIComponent(callbackUrl);
      return Response.redirect(
        new URL(`/login?callbackUrl=${encodeCallbackUrl}`, nextUrl)
      );
    }

    return null;
  } catch (error) {
    // Handle error, e.g., redirect to login or display an error message
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
  unstable_allowDynamic: [
    "mongoose/dist/browser.umd.js",
    "./(models)/Parent.ts",
    "/node_modules/function-bind/**",
  ],
};
