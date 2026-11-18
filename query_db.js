import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  console.log("Fetching projects...");
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      storeId: true,
      apiKey: true,
      domains: true
    }
  });
  console.log("DB RESULT:");
  console.log(JSON.stringify(projects, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
