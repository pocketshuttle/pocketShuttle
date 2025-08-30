/**
 *  An array of accessible routes, no auth required
 * @type string
 *
 */
export const publicRoutes = ["/", "/new-verification", "/confirm-email"];

/**
 *  An array of auth routes,
 * redirects login users to homepage
 * @type {string[]}
 *
 */

export const authRoutes = [
  "/login",
  "/register",
  "/error",
  "/reset",
  "/reset-password",
];
/**
 *  the prefix for api auth routes,
 * routes with this prefix are used for api auth
 * @type {string}
 *
 */
export const apiAuthPrefix = "/api/auth";

/**
 *  the default redirect path
 * routes with this prefix are used for api auth
 * @type {string}
 *
 */

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 *  the default redirect path for specific user roles
 * @type {string}
 *
 */
export const DEFAULT_USER_ROLE = "/teacher";
export const DEFAULT_PARENT_ROLE = "/parent";
