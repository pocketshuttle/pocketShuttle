import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
const name = process.env.SUPER_ADMIN_NAME || "Super Admin";
const requestedAccessRole = String(
  process.env.SUPER_ADMIN_ACCESS_ROLE || ""
).toUpperCase();
const allowedRoles = new Set(["OWNER", "ADMIN", "SUPPORT", "BILLING", "READ_ONLY"]);

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
const ownerCount = await db.superUser.count({
  where: { accessRole: "OWNER", status: "ACTIVE" },
});
const accessRole = allowedRoles.has(requestedAccessRole)
  ? requestedAccessRole
  : ownerCount === 0
    ? "OWNER"
    : "ADMIN";

if (existing) {
  await db.superUser.update({
    where: { id: existing.id },
    data: {
      name,
      password: hashedPassword,
      role: "SUPERADMIN",
      status: "ACTIVE",
      ...(ownerCount === 0 ? { accessRole: "OWNER" } : {}),
    },
  });
  console.log(`Updated super admin: ${email}`);
} else {
  await db.superUser.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "SUPERADMIN",
      accessRole,
      status: "ACTIVE",
    },
  });
  console.log(`Created super admin: ${email}`);
}

await db.$disconnect();
