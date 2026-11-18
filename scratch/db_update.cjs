const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACTIVE_STORE_ID = 'cmo7aimu90000p601kv9hi4db';

async function main() {
  console.log('Updating project and domain records to storeId:', ACTIVE_STORE_ID);
  
  const projectsCount = await prisma.project.updateMany({
    data: { storeId: ACTIVE_STORE_ID }
  });
  console.log(`Updated ${projectsCount.count} projects.`);

  const domainsCount = await prisma.domain.updateMany({
    data: { storeId: ACTIVE_STORE_ID }
  });
  console.log(`Updated ${domainsCount.count} domains.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
