import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando seed...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  // ADMIN
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@system.local",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // USER
  const user = await prisma.user.upsert({
    where: { username: "user" },
    update: {},
    create: {
      username: "user",
      email: "user@system.local",
      password: hashedPassword,
      role: Role.USER,
    },
  });

  console.log("Seed completado correctamente");
  console.log({
    admin: admin.username,
    user: user.username,
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