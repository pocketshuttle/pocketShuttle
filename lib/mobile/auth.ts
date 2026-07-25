import "server-only";

import { MobileSubjectRole } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";

import { MobileApiError } from "@/lib/mobile/errors";
import {
  createMobileRefreshToken,
  hashMobileToken,
  MOBILE_ACCESS_TTL_SECONDS,
  mobilePrismaRole,
  mobileRefreshExpiresAt,
  MobileRole,
  normalizeMobileRole,
} from "@/lib/mobile/policy";
import db from "@/packages/db/client";

const mobileSecret = new TextEncoder().encode(
  process.env.MOBILE_AUTH_SECRET || process.env.AUTH_SECRET
);
const issuer = "pocketshuttle";
const audience = "pocketshuttle-mobile";

export type MobileActor = {
  id: string;
  role: MobileRole;
  name: string;
  email: string;
  image: string | null;
  schoolId: string | null;
};

type ActorRecord = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  schoolId: string | null;
  password: string | null;
  emailVerified: Date | null;
  suspendedAt: Date | null;
};

function assertMobileSecret() {
  if (!process.env.MOBILE_AUTH_SECRET && !process.env.AUTH_SECRET) {
    throw new MobileApiError(
      "INVALID_REQUEST",
      500,
      "Mobile authentication is not configured."
    );
  }
}

function actorFromRecord(role: MobileRole, record: ActorRecord): MobileActor {
  if (record.suspendedAt) {
    throw new MobileApiError(
      "ACCOUNT_SUSPENDED",
      403,
      "This account has been suspended. Contact PocketShuttle support."
    );
  }
  if (!record.emailVerified) {
    throw new MobileApiError(
      "EMAIL_VERIFICATION_REQUIRED",
      403,
      "Verify your email before signing in to the mobile app."
    );
  }
  if (!record.email) {
    throw new MobileApiError("INVALID_CREDENTIALS", 401, "Invalid credentials.");
  }
  return {
    id: record.id,
    role,
    name: record.name || role,
    email: record.email.toLowerCase(),
    image: record.image,
    schoolId: record.schoolId,
  };
}

export async function findMobileActorByEmail(
  email: string,
  role: MobileRole
): Promise<{ actor: MobileActor; password: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  let record: ActorRecord | null = null;
  if (role === "parent") {
    const value = await db.parent.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        full_name: true,
        email: true,
        image: true,
        schoolId: true,
        password: true,
        emailVerified: true,
        suspendedAt: true,
      },
    });
    record = value
      ? { ...value, name: value.full_name }
      : null;
  } else if (role === "driver") {
    const value = await db.driver.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        full_name: true,
        email: true,
        image: true,
        schoolId: true,
        password: true,
        emailVerified: true,
        suspendedAt: true,
      },
    });
    record = value
      ? { ...value, name: value.full_name }
      : null;
  } else {
    const value = await db.teacher.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        full_name: true,
        email: true,
        image: true,
        schoolId: true,
        password: true,
        emailVerified: true,
        suspendedAt: true,
      },
    });
    record = value
      ? { ...value, name: value.full_name }
      : null;
  }
  if (!record?.password) {
    throw new MobileApiError("INVALID_CREDENTIALS", 401, "Invalid credentials.");
  }
  return { actor: actorFromRecord(role, record), password: record.password };
}

export async function findMobileActorById(
  subjectId: string,
  role: MobileRole
): Promise<MobileActor> {
  const lookup =
    role === "parent"
      ? db.parent.findUnique({
          where: { id: subjectId },
          select: {
            id: true,
            full_name: true,
            email: true,
            image: true,
            schoolId: true,
            password: true,
            emailVerified: true,
            suspendedAt: true,
          },
        })
      : role === "driver"
        ? db.driver.findUnique({
            where: { id: subjectId },
            select: {
              id: true,
              full_name: true,
              email: true,
              image: true,
              schoolId: true,
              password: true,
              emailVerified: true,
              suspendedAt: true,
            },
          })
        : db.teacher.findUnique({
            where: { id: subjectId },
            select: {
              id: true,
              full_name: true,
              email: true,
              image: true,
              schoolId: true,
              password: true,
              emailVerified: true,
              suspendedAt: true,
            },
          });
  const value = await lookup;
  if (!value) throw new MobileApiError("UNAUTHORIZED", 401, "Account not found.");
  return actorFromRecord(role, {
    ...value,
    name: value.full_name,
  });
}

async function issueAccessToken(input: {
  actor: MobileActor;
  sessionId: string;
}) {
  assertMobileSecret();
  return new SignJWT({
    role: input.actor.role,
    schoolId: input.actor.schoolId,
    sessionId: input.sessionId,
    tokenType: "mobile_access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(input.actor.id)
    .setIssuedAt()
    .setExpirationTime(`${MOBILE_ACCESS_TTL_SECONDS}s`)
    .sign(mobileSecret);
}

export async function createMobileLoginSession(input: {
  actor: MobileActor;
  installationId: string;
  platform: "ANDROID" | "IOS";
  deviceName?: string | null;
  appVersion?: string | null;
}) {
  assertMobileSecret();
  const role = mobilePrismaRole(input.actor.role) as MobileSubjectRole;
  const device = await db.mobileDevice.upsert({
    where: {
      subjectRole_subjectId_installationId: {
        subjectRole: role,
        subjectId: input.actor.id,
        installationId: input.installationId,
      },
    },
    create: {
      subjectRole: role,
      subjectId: input.actor.id,
      installationId: input.installationId,
      platform: input.platform,
      name: input.deviceName || null,
      appVersion: input.appVersion || null,
    },
    update: {
      platform: input.platform,
      name: input.deviceName || undefined,
      appVersion: input.appVersion || undefined,
      revokedAt: null,
      lastSeenAt: new Date(),
    },
  });
  await db.mobileSession.updateMany({
    where: { deviceId: device.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const refresh = createMobileRefreshToken();
  const session = await db.mobileSession.create({
    data: {
      subjectRole: role,
      subjectId: input.actor.id,
      schoolId: input.actor.schoolId,
      deviceId: device.id,
      refreshTokenHash: refresh.tokenHash,
      expiresAt: mobileRefreshExpiresAt(),
    },
  });
  return {
    accessToken: await issueAccessToken({ actor: input.actor, sessionId: session.id }),
    refreshToken: refresh.token,
    expiresIn: MOBILE_ACCESS_TTL_SECONDS,
    actor: input.actor,
    deviceId: device.id,
  };
}

export async function rotateMobileSession(refreshToken: string) {
  const tokenHash = hashMobileToken(refreshToken);
  const current = await db.mobileSession.findUnique({
    where: { refreshTokenHash: tokenHash },
    include: { device: true },
  });
  if (
    !current ||
    current.revokedAt ||
    current.expiresAt <= new Date() ||
    current.device.revokedAt
  ) {
    throw new MobileApiError("SESSION_EXPIRED", 401, "Your session has expired.");
  }
  const role = normalizeMobileRole(current.subjectRole);
  if (!role) throw new MobileApiError("INVALID_ROLE", 403, "Unsupported account role.");
  const actor = await findMobileActorById(current.subjectId, role);
  const nextRefresh = createMobileRefreshToken();
  const next = await db.$transaction(async (tx) => {
    const claimed = await tx.mobileSession.updateMany({
      where: { id: current.id, revokedAt: null },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new MobileApiError("SESSION_EXPIRED", 401, "Your session has expired.");
    }
    const created = await tx.mobileSession.create({
      data: {
        subjectRole: current.subjectRole,
        subjectId: current.subjectId,
        schoolId: actor.schoolId,
        deviceId: current.deviceId,
        refreshTokenHash: nextRefresh.tokenHash,
        expiresAt: mobileRefreshExpiresAt(),
      },
    });
    await tx.mobileSession.update({
      where: { id: current.id },
      data: { rotatedToId: created.id },
    });
    await tx.mobileDevice.update({
      where: { id: current.deviceId },
      data: { lastSeenAt: new Date() },
    });
    return created;
  });
  return {
    accessToken: await issueAccessToken({ actor, sessionId: next.id }),
    refreshToken: nextRefresh.token,
    expiresIn: MOBILE_ACCESS_TTL_SECONDS,
    actor,
  };
}

export async function authenticateMobileAccessToken(
  accessToken: string
): Promise<MobileActor & { mobileSessionId: string; mobileDeviceId: string }> {
  assertMobileSecret();
  try {
    const { payload } = await jwtVerify(accessToken, mobileSecret, {
      issuer,
      audience,
      algorithms: ["HS256"],
    });
    const subjectId = typeof payload.sub === "string" ? payload.sub : "";
    const role = normalizeMobileRole(payload.role);
    const sessionId =
      typeof payload.sessionId === "string" ? payload.sessionId : "";
    if (!subjectId || !role || !sessionId || payload.tokenType !== "mobile_access") {
      throw new Error("invalid claims");
    }
    const session = await db.mobileSession.findUnique({
      where: { id: sessionId },
      include: { device: true },
    });
    if (
      !session ||
      session.subjectId !== subjectId ||
      session.subjectRole !== mobilePrismaRole(role) ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.device.revokedAt
    ) {
      throw new Error("inactive session");
    }
    const actor = await findMobileActorById(subjectId, role);
    if (Date.now() - session.lastUsedAt.getTime() > 5 * 60 * 1000) {
      void db.mobileSession
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
        .catch(() => undefined);
    }
    return {
      ...actor,
      mobileSessionId: session.id,
      mobileDeviceId: session.deviceId,
    };
  } catch (error) {
    if (error instanceof MobileApiError) throw error;
    throw new MobileApiError("UNAUTHORIZED", 401, "A valid mobile session is required.");
  }
}

export function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

export async function requireMobileActor(request: Request) {
  const token = bearerToken(request);
  if (!token) throw new MobileApiError("UNAUTHORIZED", 401, "Authentication required.");
  return authenticateMobileAccessToken(token);
}

export async function revokeMobileSession(
  refreshToken: string,
  expectedSubjectId?: string
) {
  const session = await db.mobileSession.findUnique({
    where: { refreshTokenHash: hashMobileToken(refreshToken) },
  });
  if (!session || (expectedSubjectId && session.subjectId !== expectedSubjectId)) return;
  await db.mobileSession.update({
    where: { id: session.id },
    data: { revokedAt: session.revokedAt || new Date() },
  });
}
