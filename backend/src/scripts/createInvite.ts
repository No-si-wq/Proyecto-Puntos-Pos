import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV } from "../core/config/env";

const pool = new Pool({ connectionString: ENV.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith("--"))
      .map(a => {
        const [k, v] = a.slice(2).split("=");
        return [k, v];
      })
  );

  const days = parseInt(args.days ?? "7");
  const count = parseInt(args.count ?? "1");

  if (isNaN(days) || days < 1) {
    console.error("--days debe ser un número positivo");
    process.exit(1);
  }

  const invites = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const invite = await prisma.tenantInvite.create({
      data: { code, expiresAt },
    });

    invites.push(invite);
  }

  console.log(`\n${invites.length} invite(s) creado(s):\n`);

  invites.forEach((inv, i) => {
    console.log(`  #${i + 1}`);
    console.log(`  Código   : ${inv.code}`);
    console.log(`  Expira   : ${inv.expiresAt.toISOString()}`);
  });
}

main()
  .catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());