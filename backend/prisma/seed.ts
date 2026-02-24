import { PrismaClient, Role, InventoryMovementType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando seed...");

  const adminPassword = await bcrypt.hash("123456", 10);
  const userPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      email: "admin@system.local",
      password: adminPassword,
      name: "admin",
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { name: "usuario" },
    update: {},
    create: {
      email: "user@system.local",
      password: userPassword,
      name: "usuario",
      role: Role.USER,
    },
  });

  const consumer = await prisma.customer.upsert({
    where: { email: "consumidor@final.local" },
    update: {},
    create: {
      name: "CONSUMIDOR FINAL",
      email: "consumidor@final.local",
      active: true,
    },
  });

  await prisma.loyaltyPoint.upsert({
    where: { customerId: consumer.id },
    update: {},
    create: {
      customerId: consumer.id,
      balance: 0,
    },
  });

  const productsData = [
    {
      sku: "PROD-001",
      name: "Producto A",
      description: "Producto de ejemplo A",
      price: 100,
      cost: 70,
      stock: 50,
    },
    {
      sku: "PROD-002",
      name: "Producto B",
      description: "Producto de ejemplo B",
      price: 50,
      cost: 30,
      stock: 100,
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        cost: p.cost,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: InventoryMovementType.IN,
        quantity: p.stock,
        note: "Stock inicial",
      },
    });
  }

  console.log("Seed completado correctamente");
  console.log({
    admin: admin.email,
    user: user.email,
    consumidorFinal: consumer.name,
  });
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });