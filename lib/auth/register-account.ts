import "server-only";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import type * as z from "zod";

import {
  ensureFamilyBillingAccount,
  ensureSchoolBillingAccount,
} from "@/lib/billing/accounts";
import { ensureDriverShareProfile } from "@/lib/known-driver-network";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/token";
import db from "@/packages/db/client";
import { RegisterSchema } from "@/schemas";

export type RegisterInput = z.infer<typeof RegisterSchema>;

export type RegisterResult =
  | { ok: true; role: RegisterInput["accountRole"]; email: string }
  | { ok: false; status: 400 | 409 | 500; message: string; details?: unknown };

/**
 * Shared account creation used by the web server action and the mobile REST route.
 * Creates the parent/driver/school record, billing account, driver share profile,
 * accepts a pending driver invite, and sends the verification email.
 */
export async function registerAccount(values: unknown): Promise<RegisterResult> {
  const validated = RegisterSchema.safeParse(values);
  if (!validated.success) {
    return {
      ok: false,
      status: 400,
      message: "Please check the highlighted fields.",
      details: validated.error.flatten(),
    };
  }

  const {
    accountRole,
    schoolname,
    full_name,
    email,
    password,
    phoneNumber,
    address,
    serviceAreas,
    carMake,
    carModel,
    carColor,
    plateNumber,
    vehicleCapacity,
    inviteToken,
  } = validated.data;
  const normalizedEmail = email.toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [existingSchool, existingParent, existingDriver] = await Promise.all([
      db.user.findUnique({ where: { email: normalizedEmail } }),
      db.parent.findUnique({ where: { email: normalizedEmail } }),
      db.driver.findUnique({ where: { email: normalizedEmail } }),
    ]);
    if (existingSchool || existingParent || existingDriver) {
      return { ok: false, status: 409, message: "Email already in use!" };
    }

    if (accountRole === "parent") {
      const parent = await db.parent.create({
        data: {
          role: "parent",
          accountType: "STANDALONE",
          full_name,
          email: normalizedEmail,
          phoneNumber,
          address,
          password: hashedPassword,
        },
      });
      await ensureFamilyBillingAccount(parent.id);
    } else if (accountRole === "driver") {
      const driver = await db.driver.create({
        data: {
          role: "driver",
          accountType: "STANDALONE",
          full_name: full_name || "",
          email: normalizedEmail,
          phoneNumber,
          address: address || "",
          password: hashedPassword,
          serviceAreas: serviceAreas
            ? serviceAreas
                .split(",")
                .map((area) => area.trim())
                .filter(Boolean)
            : [],
          carMake,
          carModel,
          carColor,
          plateNumber,
          vehicleCapacity,
        },
      });
      await ensureDriverShareProfile(driver);

      if (inviteToken) {
        const tokenHash = crypto.createHash("sha256").update(inviteToken).digest("hex");
        await db.driverInvite.updateMany({
          where: {
            tokenHash,
            status: "SENT",
            expiresAt: { gt: new Date() },
            OR: [{ email: normalizedEmail }, ...(phoneNumber ? [{ phoneNumber }] : [])],
          },
          data: { driverId: driver.id, status: "ACCEPTED", acceptedAt: new Date() },
        });
      }
    } else {
      const school = await db.user.create({
        data: { name: schoolname, email: normalizedEmail, password: hashedPassword },
      });
      await ensureSchoolBillingAccount(school.id);
    }

    const verificationToken = await generateVerificationToken(
      normalizedEmail,
      accountRole === "school" ? "ADMIN" : accountRole
    );
    await sendVerificationEmail(verificationToken.email, verificationToken.token);
  } catch (error) {
    console.error("Error during registration:", error);
    return { ok: false, status: 500, message: "Registration failed. Please try again." };
  }

  return { ok: true, role: accountRole, email: normalizedEmail };
}
