import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../src/config/env";

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const purchases = await prisma.purchase.findMany({
    include: { items: true },
  });

  for (const purchase of purchases) {
    await prisma.purchaseItem.updateMany({
      where: {
        purchaseId: purchase.id,
        warehouseId: null,
      },
      data: {
        warehouseId: purchase.warehouseId,
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());