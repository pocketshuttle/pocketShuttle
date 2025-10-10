import { PrismaClient } from "./node_modules/.prisma/client";
export type { Prisma } from ".prisma/client";
export type { StudentAttendance } from ".prisma/client";
export type { StudentStatus } from ".prisma/client";
export type { StudentPresence } from ".prisma/client";
declare const db: PrismaClient<import(".prisma/client", { with: { "resolution-mode": "import" } }).Prisma.PrismaClientOptions, never, import(".prisma/client/runtime/library").DefaultArgs>;
export default db;
