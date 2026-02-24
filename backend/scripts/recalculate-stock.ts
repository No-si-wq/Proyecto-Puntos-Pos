import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../src/config/env";

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Recalculando stock...");

  const products = await prisma.product.findMany({
    select: { id: true },
  });

  for (const p of products) {
    const result = await prisma.inventoryMovement.aggregate({
      where: { productId: p.id },
      _sum: { quantity: true },
    });

    const stock = result._sum.quantity ?? 0;

    await prisma.product.update({
      where: { id: p.id },
      data: { stock },
    });

    console.log(`Producto ${p.id} → stock = ${stock}`);
  }

  console.log("Proceso finalizado.");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });