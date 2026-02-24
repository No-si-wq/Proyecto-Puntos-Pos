import prisma from "../src/config/prisma";

async function recalculateFIFO() {
  const products = await prisma.product.findMany({
    select: { id: true },
  });

  for (const product of products) {
    const warehouses = await prisma.productStock.findMany({
      where: { productId: product.id },
      select: { warehouseId: true },
    });

    for (const w of warehouses) {
      console.log(
        `Recalculando producto ${product.id} warehouse ${w.warehouseId}`
      );

      // 1️⃣ Obtener total vendido
      const sold = await prisma.inventoryMovement.aggregate({
        where: {
          productId: product.id,
          warehouseId: w.warehouseId,
          type: "OUT",
        },
        _sum: { quantity: true },
      });

      const totalSold = Math.abs(sold._sum.quantity ?? 0);

      // 2️⃣ Obtener lotes ordenados FIFO
      const lots = await prisma.purchaseItem.findMany({
        where: {
          productId: product.id,
          warehouseId: w.warehouseId,
        },
        orderBy: [
          { expiresAt: "asc" },
          { purchase: { createdAt: "asc" } },
        ],
      });

      let remainingToDiscount = totalSold;

      for (const lot of lots) {
        const originalQty = lot.quantity;

        if (remainingToDiscount <= 0) {
          break;
        }

        const deduct = Math.min(originalQty, remainingToDiscount);

        await prisma.purchaseItem.update({
          where: { id: lot.id },
          data: {
            quantity: originalQty - deduct,
          },
        });

        remainingToDiscount -= deduct;
      }
    }
  }

  console.log("Recalculo FIFO completado.");
}

recalculateFIFO()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });