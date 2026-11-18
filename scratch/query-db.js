import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- PROJECTS ---');
  const projects = await prisma.project.findMany();
  console.log(JSON.stringify(projects, null, 2));

  console.log('--- TEMPLATES ---');
  const templates = await prisma.template.findMany();
  console.log(JSON.stringify(templates, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
