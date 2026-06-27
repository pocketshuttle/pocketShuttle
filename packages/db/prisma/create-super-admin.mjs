import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

if (!email || !password) {
  console.error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("SUPER_ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const existing = await db.superUser.findUnique({
  where: { email: email.toLowerCase() },
});

const hashedPassword = await bcrypt.hash(password, 10);

if (existing) {
  await db.superUser.update({
    where: { id: existing.id },
    data: { name, password: hashedPassword, role: "SUPERADMIN" },
  });
  console.log(`Updated super admin: ${email}`);
} else {
  await db.superUser.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "SUPERADMIN",
    },
  });
  console.log(`Created super admin: ${email}`);
}

await db.$disconnect();
