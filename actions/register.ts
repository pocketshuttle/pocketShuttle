"use server";
import { RegisterSchema } from "@/schemas";
import * as z from "zod";
import bcrypt from "bcryptjs";
import db from "@/packages/db/client";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";
import { redirect } from "next/navigation";

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
      await db.parent.create({
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
    } else if (accountRole === "driver") {
      await db.driver.create({
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
    } else {
      await db.user.create({
        data: {
          name: schoolname,
          email: normalizedEmail,
          password: hashedPassword,
        },
      });
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
