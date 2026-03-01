import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../src/config/env";

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {

  // Actualizar SaleItem en un solo query
  await prisma.$executeRawUnsafe(`
    UPDATE "SaleItem"
    SET 
      "discountType" = 'NONE',
      "discountValue" = 0,
      "discountAmount" = 0,
      "lineSubtotal" = price * quantity
  `)

  // Copiar subtotal a grossSubtotal
  await prisma.$executeRawUnsafe(`
    UPDATE "Sale"
    SET "grossSubtotal" = "subtotal"
  `)

  console.log('Backfill completado correctamente')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())