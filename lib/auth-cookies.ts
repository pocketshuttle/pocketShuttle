export const SESSION_COOKIE_NAME = "session";
export const LAST_SCREEN_COOKIE_NAME = "last_screen";
export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60;

export const getSessionExpiresAt = () =>
  new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const routeStateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
