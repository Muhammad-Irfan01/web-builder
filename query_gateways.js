import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log("Fetching payment gateway configs...");
  const configs = await prisma.$queryRaw`
    SELECT * FROM "subscriptions_packages"."subscriptions_packages.payment_gateway_configs"
  `;
  console.log("DB RESULT:");
  console.log(JSON.stringify(configs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
