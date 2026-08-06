import { PrismaClient } from "@prisma/client";
export type { Prisma } from ".prisma/client";
export type { StudentAttendance } from ".prisma/client";
export type { StudentStatus } from ".prisma/client";
export type { StudentPresence } from ".prisma/client";

const PRISMA_SCHEMA_VERSION = "20260805122223_add_driver_frsc_documents";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const db =
  globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}

export default db;
