import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../src/config/env";

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    include: { stocks: true },
  });

  for (const p of products) {
    const total = p.stocks.reduce((acc, s) => acc + s.stock, 0);

    if (p.stock !== total) {
      console.log("Inconsistencia en producto:", p.id);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());