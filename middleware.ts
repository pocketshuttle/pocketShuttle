import {
  DEFAULT_LOGIN_REDIRECT,
  authRoutes,
  publicRoutes,
  DEFAULT_USER_ROLE,
  DEFAULT_PARENT_ROLE,
} from "@/routes";
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/create-session";
import {
  LAST_SCREEN_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  routeStateCookieOptions,
} from "@/lib/auth-cookies";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  try {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    const token = await decrypt(cookie);

    const userRole = token?.role;
    const isLoggedIn = !!token;
    const isPublicRoute = publicRoutes.includes(pathname);
    const isHomePage = pathname === "/";
    const response = NextResponse.next();

    if (!isPublicRoute && !pathname.startsWith("/api")) {
      response.cookies.set(
        LAST_SCREEN_COOKIE_NAME,
        pathname + nextUrl.search,
        routeStateCookieOptions
      );
    }

    // Matching for both static and dynamic routes
    const isAuthRoute = authRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isHomePage && isLoggedIn) {
      if (userRole === "parent") {
        return NextResponse.redirect(new URL(DEFAULT_PARENT_ROLE, nextUrl));
      }
      if (userRole === "teacher") {
        return NextResponse.redirect(new URL(DEFAULT_USER_ROLE, nextUrl));
      }
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }

    if (isAuthRoute) {
      if (isLoggedIn) {
        if (userRole === "parent") {
          return NextResponse.redirect(new URL(DEFAULT_PARENT_ROLE, nextUrl));
        }
        if (userRole === "teacher") {
          return NextResponse.redirect(new URL(DEFAULT_USER_ROLE, nextUrl));
        }
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }

      return response;
    }

    // If user is not logged in and it's not a public route, redirect to login
    if (!isLoggedIn && !isPublicRoute) {
      //taking users back to the previous used route
      let callbackUrl = pathname;

      if (nextUrl.search && nextUrl.search.startsWith("?")) {
        callbackUrl += nextUrl.search;
      }

      const encodeCallbackUrl = encodeURIComponent(callbackUrl);

      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeCallbackUrl}`, nextUrl)
      );
    }

    return response;
  } catch (error) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api|trpc|.*\\..*|_next).*)", "/"],
  unstable_allowDynamic: [
    "mongoose/dist/browser.umd.js",
    "./(models)/Parent.ts",
    "/node_modules/function-bind/**",
  ],
};
