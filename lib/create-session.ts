import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  authCookieOptions,
  getSessionExpiresAt,
} from "@/lib/auth-cookies";

const secretKey = process.env.AUTH_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.log("Failed to verify session");
  }
}

export type SessionPayload = {
  id: string;
  role: string;
  name?: string | null;
  image?: string | null;
  email?: string | null;
  schoolId?: string | null;
};

export async function setSessionCookie(payload: SessionPayload) {
  const expiresAt = getSessionExpiresAt();
  const session = await encrypt({ ...payload, expiresAt });

  cookies().set(SESSION_COOKIE_NAME, session, {
    ...authCookieOptions,
    expires: expiresAt,
  });
}

export async function deleteSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function createSession(id: string) {
  await setSessionCookie({ id, role: "admin", schoolId: id });
}
