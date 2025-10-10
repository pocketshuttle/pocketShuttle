import { PrismaClient } from ".prisma/client";
export type { Prisma } from ".prisma/client";
export type { StudentAttendance } from ".prisma/client";
export type { StudentStatus } from ".prisma/client";
export type { StudentPresence } from ".prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export default db;
