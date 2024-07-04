import { PrismaClient } from "@prisma/client";

// type for prisma
declare global {
  var prisma: PrismaClient | undefined;
}

//preventing hextjs hotreload, preventing reinitialization of prisma client
//so we stored the connection in the global this, so on reload we check if already have this as global isnt affected by hotreload
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
