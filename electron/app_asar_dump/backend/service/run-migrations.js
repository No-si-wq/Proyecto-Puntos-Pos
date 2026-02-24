const { execSync } = require("child_process");
const path = require("path");

require(path.join(__dirname, "..", "dist", "config", "env"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definido");
  process.exit(1);
}

try {
  console.log("Ejecutando migraciones Prisma...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });
  console.log("Migraciones aplicadas correctamente");
} catch (err) {
  console.error("Error ejecutando migraciones Prisma");
  process.exit(1);
}