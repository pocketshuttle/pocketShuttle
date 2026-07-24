"use server";
import { RegisterSchema } from "@/schemas";
import * as z from "zod";
import bcrypt from "bcryptjs";
import db from "@/packages/db/client";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { ensureDriverShareProfile } from "@/lib/known-driver-network";
import {
  ensureFamilyBillingAccount,
  ensureSchoolBillingAccount,
} from "@/lib/billing/accounts";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields" };
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
  } = validatedFields.data;
  const normalizedEmail = email.toLowerCase();

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [existingSchool, existingParent, existingDriver] = await Promise.all([
      db.user.findUnique({ where: { email: normalizedEmail } }),
      db.parent.findUnique({ where: { email: normalizedEmail } }),
      db.driver.findUnique({ where: { email: normalizedEmail } }),
    ]);

    if (existingSchool || existingParent || existingDriver) {
      return { error: "Email already in use!" };
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
            OR: [
              { email: normalizedEmail },
              ...(phoneNumber ? [{ phoneNumber }] : []),
            ],
          },
          data: {
            driverId: driver.id,
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });
      }
    } else {
      const school = await db.user.create({
        data: {
          name: schoolname,
          email: normalizedEmail,
          password: hashedPassword,
        },
      });
      await ensureSchoolBillingAccount(school.id);
    }

    const verificationToken = await generateVerificationToken(
      normalizedEmail,
      accountRole === "school" ? "ADMIN" : accountRole
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return { error: "Registration failed. Please try again." };
  }
  redirect("/confirm-email");
};
