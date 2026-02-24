import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../src/config/env";

const adapter = new PrismaPg({
  connectionString: ENV.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando migración histórica de warehouse...");

  // 1️⃣ Verificar si existe almacén principal
  let warehouse = await prisma.warehouse.findFirst({
    where: { name: "Principal" },
  });

  if (!warehouse) {
    console.log("Almacén 'Principal' no existe. Creándolo...");

    warehouse = await prisma.warehouse.create({
      data: {
        name: "Principal",
      },
    });

    console.log(`Almacén creado con id ${warehouse.id}`);
  }

  const warehouseId = warehouse.id;

  // 2️⃣ Migrar ventas
  const salesUpdated = await prisma.sale.updateMany({
    where: { warehouseId: null },
    data: { warehouseId },
  });

  console.log(
    `Ventas actualizadas: ${salesUpdated.count}`
  );

  // 3️⃣ Migrar compras
  const purchasesUpdated = await prisma.purchase.updateMany({
    where: { warehouseId: null },
    data: { warehouseId },
  });

  console.log(
    `Compras actualizadas: ${purchasesUpdated.count}`
  );

  // 4️⃣ Verificación final
  const remainingSales = await prisma.sale.count({
    where: { warehouseId: null },
  });

  const remainingPurchases = await prisma.purchase.count({
    where: { warehouseId: null },
  });

  console.log("Verificación final:");
  console.log({
    remainingSales,
    remainingPurchases,
  });

  if (remainingSales === 0 && remainingPurchases === 0) {
    console.log("Migración completada correctamente.");
  } else {
    console.log(
      "Advertencia: aún existen registros sin warehouse."
    );
  }
}

main()
  .catch((error) => {
    console.error("Error durante migración:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });