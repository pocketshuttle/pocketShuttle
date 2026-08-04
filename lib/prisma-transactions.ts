import "server-only";

import { Prisma } from "@prisma/client";

import db from "@/packages/db/client";

const SERIALIZABLE_RETRY_LIMIT = 3;

export async function withSerializableTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  for (let attempt = 0; attempt < SERIALIZABLE_RETRY_LIMIT; attempt += 1) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const canRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt + 1 < SERIALIZABLE_RETRY_LIMIT;
      if (!canRetry) throw error;
    }
  }

  throw new Error("Serializable transaction retry limit reached");
}
