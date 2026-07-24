import "dotenv/config";

import { Prisma, PrismaClient } from "@prisma/client";

import { PLAN_CATALOG } from "../../../lib/billing/catalog";

const db = new PrismaClient();

async function main() {
  await Promise.all(
    Object.values(PLAN_CATALOG).map((definition) =>
      db.plan.upsert({
        where: { code: definition.code },
        create: {
          code: definition.code,
          name: definition.name,
          price: 0,
          duration: 30,
          description: definition.description,
          features: definition.marketingFeatures,
          entitlements: definition.entitlements as Prisma.InputJsonValue,
          audience: definition.audience,
          tier: definition.tier,
          isActive: true,
          isPublic: definition.isPublic,
          isPurchasable: definition.isPurchasable,
        },
        update: {
          description: definition.description,
          features: definition.marketingFeatures,
          entitlements: definition.entitlements as Prisma.InputJsonValue,
          audience: definition.audience,
          tier: definition.tier,
        },
      })
    )
  );
  process.stdout.write("Subscription plan catalog seeded\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
