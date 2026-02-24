import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../src/config/env";

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Migrando SaleSequence...");

  // 1️⃣ Obtener almacén principal
  const warehouse = await prisma.warehouse.findFirst({
    where: { name: "Principal" },
  });

  if (!warehouse) {
    throw new Error("No existe almacén Principal");
  }

  // 2️⃣ Obtener secuencia global antigua
  const oldSequence = await prisma.saleSequence.findFirst({
    where: { warehouseId: null },
  });

  if (!oldSequence) {
    console.log("No hay secuencia global antigua.");
    return;
  }

  // 3️⃣ Crear nueva secuencia ligada al almacén
  await prisma.saleSequence.create({
    data: {
      warehouseId: warehouse.id,
      current: oldSequence.current,
    },
  });

  console.log("Secuencia migrada correctamente.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());