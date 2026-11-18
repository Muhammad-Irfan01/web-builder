import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany({
    select: {
      id: true,
      title: true,
    }
  });
  console.log("TEMPLATES RESULT:");
  console.log(JSON.stringify(templates, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
